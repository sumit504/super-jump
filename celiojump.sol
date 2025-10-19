// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract CelioJumpGame {
    struct Player {
        uint128 highestScore;
        uint128 totalWon;
        uint64 totalClaims;
        uint32 lastClaimDate;
        uint256 farcasterFID;
    }
    
    // Constants
    uint256 private constant SCORE_THRESHOLD = 15;
    uint256 private constant FIXED_PRIZE = 8510638297872;  // ~$0.04 at $4700 ETH
    uint256 private constant MAX_DAILY_CLAIMS = 1;
    
    mapping(address => Player) private players;
    mapping(uint256 => mapping(uint32 => uint256)) private fidDailyClaims;
    mapping(bytes32 => bool) private usedProofs;
    address public immutable owner;
    
    // Leaderboard tracking
    address[] public allPlayers;
    mapping(address => bool) private hasPlayed;
    
    // Custom errors
    error InsufficientBalance();
    error InvalidProof();
    error ProofAlreadyUsed();
    error TransferFailed();
    error OnlyOwner();
    error InvalidFarcasterFID();
    error FIDAlreadyClaimedToday();
    error ScoreTooLow();
    
    // Events
    event RewardClaimed(
        address indexed player,
        uint256 indexed farcasterFID,
        uint256 score,
        uint256 amount,
        bytes32 proof
    );
    event ContractFunded(address indexed funder, uint256 amount);
    
    constructor() payable {
        owner = msg.sender;
        if (msg.value > 0) {
            emit ContractFunded(msg.sender, msg.value);
        }
    }
    
    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }
    
    receive() external payable {
        emit ContractFunded(msg.sender, msg.value);
    }
    
    function claimReward(
        uint256 score,
        uint256 gameNonce,
        uint256 timestamp,
        uint256 farcasterFID,
        bytes calldata farcasterProof
    ) external {
        if (farcasterFID == 0) revert InvalidFarcasterFID();
        
        if (!_verifyFarcasterOwnership(msg.sender, farcasterFID, farcasterProof)) {
            revert InvalidFarcasterFID();
        }
        
        if (score < SCORE_THRESHOLD) revert ScoreTooLow();
        
        uint32 today = uint32(block.timestamp / 1 days);
        if (fidDailyClaims[farcasterFID][today] >= MAX_DAILY_CLAIMS) {
            revert FIDAlreadyClaimedToday();
        }
        
        bytes32 proof = keccak256(abi.encodePacked(
            msg.sender,
            score,
            gameNonce,
            timestamp,
            farcasterFID
        ));
        
        if (usedProofs[proof]) revert ProofAlreadyUsed();
        
        if (timestamp > block.timestamp || timestamp < block.timestamp - 300) {
            revert InvalidProof();
        }
        
        if (address(this).balance < FIXED_PRIZE) revert InsufficientBalance();
        
        usedProofs[proof] = true;
        fidDailyClaims[farcasterFID][today]++;
        
        if (!hasPlayed[msg.sender]) {
            allPlayers.push(msg.sender);
            hasPlayed[msg.sender] = true;
        }
        
        Player storage player = players[msg.sender];
        player.farcasterFID = farcasterFID;
        
        if (score > player.highestScore) {
            player.highestScore = uint128(score);
        }
        
        unchecked {
            player.totalWon += uint128(FIXED_PRIZE);
            player.totalClaims++;
        }
        
        if (player.lastClaimDate != today) {
            player.lastClaimDate = today;
        }
        
        (bool success,) = payable(msg.sender).call{value: FIXED_PRIZE}("");
        if (!success) revert TransferFailed();
        
        emit RewardClaimed(msg.sender, farcasterFID, score, FIXED_PRIZE, proof);
    }
    
    function _verifyFarcasterOwnership(
        address /* wallet */,
        uint256 farcasterFID,
        bytes calldata proof
    ) internal pure returns (bool) {
        return proof.length >= 32 && farcasterFID > 0;
    }
    
    function getRemainingClaimsForFID(uint256 farcasterFID) external view returns (uint256) {
        uint32 today = uint32(block.timestamp / 1 days);
        uint256 usedClaims = fidDailyClaims[farcasterFID][today];
        return MAX_DAILY_CLAIMS > usedClaims ? MAX_DAILY_CLAIMS - usedClaims : 0;
    }
    
    function validateClaim(
        address player,
        uint256 score,
        uint256 gameNonce,
        uint256 timestamp,
        uint256 farcasterFID
    ) external view returns (
        bool isValid,
        uint256 prizeAmount,
        string memory reason
    ) {
        uint32 today = uint32(block.timestamp / 1 days);
        if (fidDailyClaims[farcasterFID][today] >= MAX_DAILY_CLAIMS) {
            return (false, 0, "FID already claimed today");
        }
        
        bytes32 proof = keccak256(abi.encodePacked(
            player,
            score,
            gameNonce,
            timestamp,
            farcasterFID
        ));
        
        if (usedProofs[proof]) {
            return (false, 0, "Proof already used");
        }
        
        if (score < SCORE_THRESHOLD) {
            return (false, 0, "Score too low");
        }
        
        if (timestamp > block.timestamp || timestamp < block.timestamp - 300) {
            return (false, 0, "Invalid timestamp");
        }
        
        return (true, FIXED_PRIZE, "Valid claim");
    }
    
    function getPlayerStats(address playerAddr) external view returns (
        uint128 highestScore,
        uint256 totalWon,
        uint256 totalClaims,
        uint256 remainingClaims
    ) {
        Player memory player = players[playerAddr];
        uint32 today = uint32(block.timestamp / 1 days);
        
        uint256 remaining = (player.lastClaimDate != today) ? MAX_DAILY_CLAIMS : 0;
        
        return (
            player.highestScore,
            uint256(player.totalWon),
            uint256(player.totalClaims),
            remaining
        );
    }
    
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    function getTotalPlayers() external view returns (uint256) {
        return allPlayers.length;
    }
    
    function getLeaderboard() external view returns (
        address[] memory topPlayers,
        uint128[] memory highestScores,
        uint256[] memory totalWinnings
    ) {
        uint256 playerCount = allPlayers.length;
        if (playerCount == 0) {
            return (new address[](0), new uint128[](0), new uint256[](0));
        }
        
        uint256 topCount = playerCount > 10 ? 10 : playerCount;
        topPlayers = new address[](topCount);
        highestScores = new uint128[](topCount);
        totalWinnings = new uint256[](topCount);
        
        for (uint256 i = 0; i < topCount; i++) {
            address player = allPlayers[i];
            topPlayers[i] = player;
            highestScores[i] = players[player].highestScore;
            totalWinnings[i] = players[player].totalWon;
        }
        
        return (topPlayers, highestScores, totalWinnings);
    }
    
    function getTotalClaimsByFID(uint256 farcasterFID) external view returns (uint256) {
        uint32 today = uint32(block.timestamp / 1 days);
        return fidDailyClaims[farcasterFID][today];
    }
    
    function isProofUsed(
        address player,
        uint256 score,
        uint256 gameNonce,
        uint256 timestamp,
        uint256 farcasterFID
    ) external view returns (bool) {
        bytes32 proof = keccak256(abi.encodePacked(
            player,
            score,
            gameNonce,
            timestamp,
            farcasterFID
        ));
        return usedProofs[proof];
    }
    
    function getRewardAmount() external pure returns (uint256) {
        return FIXED_PRIZE;
    }
    
    function getScoreThreshold() external pure returns (uint256) {
        return SCORE_THRESHOLD;
    }
    
    function fundContract() external payable onlyOwner {
        emit ContractFunded(msg.sender, msg.value);
    }
    
    function withdrawETH(uint256 amount) external onlyOwner {
        if (amount > address(this).balance) revert InsufficientBalance();
        
        (bool success,) = payable(owner).call{value: amount}("");
        if (!success) revert TransferFailed();
    }
    
    function emergencyWithdrawAll() external onlyOwner {
        uint256 balance = address(this).balance;
        if (balance == 0) revert InsufficientBalance();
        
        (bool success,) = payable(owner).call{value: balance}("");
        if (!success) revert TransferFailed();
    }
}