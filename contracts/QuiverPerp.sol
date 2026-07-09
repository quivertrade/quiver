// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IMintableERC20 {
    function transfer(address to, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function mint(address to, uint256 value) external;
    function balanceOf(address account) external view returns (uint256);
}

/// @title QuiverPerp — vAMM perpetual futures on tokenized-stock indices (testnet)
/// @notice Virtual AMM (x·y=k) per market. Collateral is tUSDC (6 decimals).
///         A keeper repegs each vAMM to the external index price. On testnet the
///         perp contract is a tUSDC minter so winning traders can always be paid.
contract QuiverPerp {
    uint256 public constant MAX_LEVERAGE = 20;
    uint256 public constant MAINTENANCE_BPS = 500; // 5% of notional
    uint256 public constant FEE_BPS = 10; // 0.10% taker fee on notional
    uint256 public constant PRICE_SCALE = 1e6; // prices in tUSDC decimals

    IMintableERC20 public immutable collateral;
    address public owner;
    mapping(address => bool) public keepers;

    struct Market {
        uint256 baseReserve; // 1e18
        uint256 quoteReserve; // 1e6
        bool active;
    }

    struct Position {
        uint256 size; // base amount, 1e18
        uint256 margin; // tUSDC locked, 1e6
        uint256 openNotional; // quote at open, 1e6
        bool isLong;
    }

    bytes32[] public marketList;
    mapping(bytes32 => Market) public markets;
    mapping(address => mapping(bytes32 => Position)) public positions;

    event MarketListed(bytes32 indexed symbol, uint256 price);
    event IndexPriceSet(bytes32 indexed symbol, uint256 price);
    event PositionOpened(
        address indexed trader,
        bytes32 indexed symbol,
        bool isLong,
        uint256 margin,
        uint256 notional,
        uint256 size,
        uint256 entryPrice
    );
    event PositionClosed(
        address indexed trader,
        bytes32 indexed symbol,
        int256 pnl,
        uint256 exitPrice
    );
    event Liquidated(
        address indexed trader,
        bytes32 indexed symbol,
        address indexed liquidator,
        uint256 reward
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "perp: not owner");
        _;
    }

    modifier onlyKeeper() {
        require(keepers[msg.sender] || msg.sender == owner, "perp: not keeper");
        _;
    }

    constructor(address _collateral) {
        collateral = IMintableERC20(_collateral);
        owner = msg.sender;
        keepers[msg.sender] = true;
    }

    function setKeeper(address keeper, bool allowed) external onlyOwner {
        keepers[keeper] = allowed;
    }

    function marketCount() external view returns (uint256) {
        return marketList.length;
    }

    /// @notice List a market with virtual liquidity anchored at `price` (1e6).
    function listMarket(bytes32 symbol, uint256 price, uint256 baseReserve)
        external
        onlyOwner
    {
        require(!markets[symbol].active, "perp: exists");
        require(price > 0 && baseReserve > 0, "perp: bad params");
        markets[symbol] = Market({
            baseReserve: baseReserve,
            quoteReserve: (baseReserve * price) / 1e18,
            active: true
        });
        marketList.push(symbol);
        emit MarketListed(symbol, price);
    }

    /// @notice Keeper repegs the vAMM mark to the external index price.
    function setIndexPrice(bytes32 symbol, uint256 price) public onlyKeeper {
        Market storage m = markets[symbol];
        require(m.active, "perp: no market");
        require(price > 0, "perp: bad price");
        m.quoteReserve = (m.baseReserve * price) / 1e18;
        emit IndexPriceSet(symbol, price);
    }

    function setIndexPrices(bytes32[] calldata symbols, uint256[] calldata prices)
        external
        onlyKeeper
    {
        require(symbols.length == prices.length, "perp: length");
        for (uint256 i = 0; i < symbols.length; i++) {
            setIndexPrice(symbols[i], prices[i]);
        }
    }

    /// @notice Current vAMM mark price (1e6 per 1e18 base).
    function markPrice(bytes32 symbol) public view returns (uint256) {
        Market storage m = markets[symbol];
        require(m.active, "perp: no market");
        return (m.quoteReserve * 1e18) / m.baseReserve;
    }

    function openPosition(
        bytes32 symbol,
        bool isLong,
        uint256 margin,
        uint256 leverage
    ) external {
        Market storage m = markets[symbol];
        require(m.active, "perp: no market");
        require(margin >= 1e6, "perp: min margin 1 tUSDC");
        require(leverage >= 1 && leverage <= MAX_LEVERAGE, "perp: leverage");
        require(positions[msg.sender][symbol].size == 0, "perp: position open");

        uint256 notional = margin * leverage;
        uint256 fee = (notional * FEE_BPS) / 10_000;
        require(
            collateral.transferFrom(msg.sender, address(this), margin + fee),
            "perp: transfer failed"
        );

        uint256 k = m.baseReserve * m.quoteReserve;
        uint256 size;
        if (isLong) {
            uint256 newQuote = m.quoteReserve + notional;
            uint256 newBase = k / newQuote;
            size = m.baseReserve - newBase;
            m.quoteReserve = newQuote;
            m.baseReserve = newBase;
        } else {
            require(notional < m.quoteReserve, "perp: size too large");
            uint256 newQuote = m.quoteReserve - notional;
            uint256 newBase = k / newQuote;
            size = newBase - m.baseReserve;
            m.quoteReserve = newQuote;
            m.baseReserve = newBase;
        }
        require(size > 0, "perp: zero size");

        positions[msg.sender][symbol] = Position({
            size: size,
            margin: margin,
            openNotional: notional,
            isLong: isLong
        });
        emit PositionOpened(
            msg.sender,
            symbol,
            isLong,
            margin,
            notional,
            size,
            (notional * 1e18) / size
        );
    }

    /// @notice Quote value the position would settle at right now (1e6).
    function closeQuote(address trader, bytes32 symbol)
        public
        view
        returns (uint256)
    {
        Position storage p = positions[trader][symbol];
        require(p.size > 0, "perp: no position");
        Market storage m = markets[symbol];
        uint256 k = m.baseReserve * m.quoteReserve;
        if (p.isLong) {
            // sell base back into the pool
            return m.quoteReserve - k / (m.baseReserve + p.size);
        }
        // buy base back from the pool
        return k / (m.baseReserve - p.size) - m.quoteReserve;
    }

    function pnlOf(address trader, bytes32 symbol) public view returns (int256) {
        Position storage p = positions[trader][symbol];
        uint256 quote = closeQuote(trader, symbol);
        return p.isLong
            ? int256(quote) - int256(p.openNotional)
            : int256(p.openNotional) - int256(quote);
    }

    function closePosition(bytes32 symbol) external {
        _settle(msg.sender, symbol, msg.sender, false);
    }

    function isLiquidatable(address trader, bytes32 symbol)
        public
        view
        returns (bool)
    {
        Position storage p = positions[trader][symbol];
        if (p.size == 0) return false;
        int256 equity = int256(p.margin) + pnlOf(trader, symbol);
        int256 minEquity = int256((p.openNotional * MAINTENANCE_BPS) / 10_000);
        return equity < minEquity;
    }

    function liquidate(address trader, bytes32 symbol) external {
        require(isLiquidatable(trader, symbol), "perp: not liquidatable");
        _settle(trader, symbol, msg.sender, true);
    }

    function _settle(
        address trader,
        bytes32 symbol,
        address caller,
        bool isLiquidation
    ) internal {
        Position memory p = positions[trader][symbol];
        require(p.size > 0, "perp: no position");
        Market storage m = markets[symbol];

        uint256 quote = closeQuote(trader, symbol);
        uint256 k = m.baseReserve * m.quoteReserve;
        if (p.isLong) {
            m.baseReserve += p.size;
            m.quoteReserve = k / m.baseReserve;
        } else {
            m.baseReserve -= p.size;
            m.quoteReserve = k / m.baseReserve;
        }

        int256 pnl = p.isLong
            ? int256(quote) - int256(p.openNotional)
            : int256(p.openNotional) - int256(quote);
        int256 equity = int256(p.margin) + pnl;
        delete positions[trader][symbol];

        if (equity <= 0) {
            emit PositionClosed(trader, symbol, pnl, (quote * 1e18) / p.size);
            return;
        }
        uint256 payout = uint256(equity);
        if (isLiquidation) {
            uint256 reward = payout / 2;
            _pay(caller, reward);
            emit Liquidated(trader, symbol, caller, reward);
            emit PositionClosed(trader, symbol, pnl, (quote * 1e18) / p.size);
            return; // remainder stays in the insurance pool
        }
        _pay(trader, payout);
        emit PositionClosed(trader, symbol, pnl, (quote * 1e18) / p.size);
    }

    function _pay(address to, uint256 amount) internal {
        uint256 bal = collateral.balanceOf(address(this));
        if (bal < amount) {
            collateral.mint(address(this), amount - bal);
        }
        require(collateral.transfer(to, amount), "perp: payout failed");
    }
}
