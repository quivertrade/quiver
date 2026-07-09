// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title Test USDC — testnet collateral token for Quiver (6 decimals, public faucet)
contract TestUSDC {
    string public constant name = "Quiver Test USDC";
    string public constant symbol = "tUSDC";
    uint8 public constant decimals = 6;

    address public owner;
    mapping(address => bool) public minters;

    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    mapping(address => uint256) public lastFaucet;

    uint256 public constant FAUCET_AMOUNT = 10_000e6;
    uint256 public constant FAUCET_COOLDOWN = 24 hours;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor() {
        owner = msg.sender;
    }

    function setMinter(address minter, bool allowed) external {
        require(msg.sender == owner, "ERC20: not owner");
        minters[minter] = allowed;
    }

    /// @notice Testnet-only: authorized contracts (the perp engine) can mint
    ///         so winning traders can always be paid out.
    function mint(address to, uint256 value) external {
        require(minters[msg.sender], "ERC20: not minter");
        totalSupply += value;
        balanceOf[to] += value;
        emit Transfer(address(0), to, value);
    }

    function faucet() external {
        require(
            block.timestamp >= lastFaucet[msg.sender] + FAUCET_COOLDOWN,
            "faucet: cooldown"
        );
        lastFaucet[msg.sender] = block.timestamp;
        totalSupply += FAUCET_AMOUNT;
        balanceOf[msg.sender] += FAUCET_AMOUNT;
        emit Transfer(address(0), msg.sender, FAUCET_AMOUNT);
    }

    function transfer(address to, uint256 value) external returns (bool) {
        _transfer(msg.sender, to, value);
        return true;
    }

    function approve(address spender, uint256 value) external returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        if (allowed != type(uint256).max) {
            require(allowed >= value, "ERC20: allowance");
            allowance[from][msg.sender] = allowed - value;
        }
        _transfer(from, to, value);
        return true;
    }

    function _transfer(address from, address to, uint256 value) internal {
        require(to != address(0), "ERC20: zero to");
        uint256 bal = balanceOf[from];
        require(bal >= value, "ERC20: balance");
        unchecked {
            balanceOf[from] = bal - value;
            balanceOf[to] += value;
        }
        emit Transfer(from, to, value);
    }
}

interface IERC20 {
    function transfer(address to, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

/// @title QuiverVault — holds tUSDC trading collateral per account
contract QuiverVault {
    IERC20 public immutable collateral;
    mapping(address => uint256) public balances;

    event Deposited(address indexed account, uint256 amount);
    event Withdrawn(address indexed account, uint256 amount);

    constructor(address _collateral) {
        collateral = IERC20(_collateral);
    }

    function deposit(uint256 amount) external {
        require(amount > 0, "vault: zero amount");
        require(
            collateral.transferFrom(msg.sender, address(this), amount),
            "vault: transfer failed"
        );
        balances[msg.sender] += amount;
        emit Deposited(msg.sender, amount);
    }

    function withdraw(uint256 amount) external {
        uint256 bal = balances[msg.sender];
        require(amount > 0 && amount <= bal, "vault: bad amount");
        unchecked {
            balances[msg.sender] = bal - amount;
        }
        require(collateral.transfer(msg.sender, amount), "vault: transfer failed");
        emit Withdrawn(msg.sender, amount);
    }
}
