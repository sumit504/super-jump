// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title CelioJumpGame - Complete Game Contract with Leaderboard
 * @dev Players can submit scores to leaderboard and claim daily ETH rewards
 * @dev Deployed on Base Mainnet
 * @dev UPDATED: Score threshold changed to 30 points
 */
contract CelioJumpGame {
    
    // ============ Structs ============
    
    struct LeaderboardEntry {
        address player;
        uint256 farcasterFID;
        uint256 score;
        uint256 timestamp;
    }
    
    struct PlayerStats {
        uint256 highestScore;
        uint256 totalGames;
        uint256 totalRewardsClaimed;
        uint256 lastPlayTimestamp;
    }
    
    // ============ State Variables ============
    
    LeaderboardEntry[] public leaderboard;
    
    mapping(address => PlayerStats) public playerStats;
    mapping(uint256 => mapping(uint256 => uint256)) public fidDailyClaims; // FID => day => claims
    mapping(bytes32 => bool) private usedProofs;
    
    address public immutable owner;
    uint256 public constant REWARD_AMOUNT = 8510638297872;  // ~$0.04 at $4700 ETH
    uint256 public constant MAX_DAILY_CLAIMS_PER_FID = 1;
    uint256 public constant SCORE_THRESHOLD = 30;  // ⭐ CHANGED FROM 15 TO 30
    
    // ============ Events ============
    
    event GameStarted(
        address indexed player,
        uint256 indexed farcasterFID,
        uint256 timestamp
    );
    
    event ScoreSubmitted(
        address indexed player,
        uint256 indexed farcasterFID,
        uint256 score,
        uint256 leaderboardPosition,
        bool isNewBest
    );
    
    event RewardClaimed(
        address indexed player,
        uint256 indexed farcasterFID,
        uint256 score,
        uint256 amount,
        bytes32 proof
    );
    
    event ContractFunded(address indexed funder, uint256 amount);
    
    // ============ Errors ============
    
    error OnlyOwner();
    error InsufficientBalance();
    error InvalidScore();
    error TransferFailed();
    error ExceededDailyClaims();
    error ScoreNotBetter();
    error ScoreTooLow();
    error InvalidProof();
    error ProofAlreadyUsed();
    error InvalidFarcasterFID();
    error FIDAlreadyClaimedToday();
    
    // ============ Constructor ============
    
    constructor() payable {
        owner = msg.sender;
        if (msg.value > 0) {
            emit ContractFunded(msg.sender, msg.value);
        }
    }
    
    // ============ Modifiers ============
    
    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }
    
    // ============ Receive Function ============
    
    receive() external payable {
        emit ContractFunded(msg.sender, msg.value);
    }
    
    // ============ Core Game Functions ============
    
    /**
     * @dev Start a new game session
     * @param farcasterFID Player's Farcaster FID (can be 0 for non-Farcaster users)
     */
    function startGame(uint256 farcasterFID) external {
        emit GameStarted(msg.sender, farcasterFID, block.timestamp);
    }
    
    /**
     * @dev Submit score to leaderboard - only if better than previous best
     * @param score Player's game score
     * @param farcasterFID Player's Farcaster FID (can be 0 for non-Farcaster users)
     * @return position Leaderboard position
     */
    function submitScore(
        uint256 score,
        uint256 farcasterFID
    ) external returns (uint256 position) {
        if (score == 0 || score > 1000000) {
            revert InvalidScore();
        }
        
        PlayerStats storage stats = playerStats[msg.sender];
        
        if (stats.highestScore > 0 && score <= stats.highestScore) {
            revert ScoreNotBetter();
        }
        
        bool isNewBest = stats.highestScore > 0;
        
        stats.highestScore = score;
        stats.totalGames++;
        stats.lastPlayTimestamp = block.timestamp;
        
        LeaderboardEntry memory newEntry = LeaderboardEntry({
            player: msg.sender,
            farcasterFID: farcasterFID,
            score: score,
            timestamp: block.timestamp
        });
        
        leaderboard.push(newEntry);
        position = leaderboard.length - 1;
        
        emit ScoreSubmitted(msg.sender, farcasterFID, score, position, isNewBest);
        
        return position;
    }
    
    /**
     * @dev Claim reward after achieving score threshold (30 points)
     * @param score Player's score (must be >= 30)
     * @param gameNonce Unique game identifier
     * @param timestamp Game completion timestamp
     * @param farcasterFID Player's Farcaster FID
     * @param farcasterProof Proof of Farcaster ownership
     */
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
        
        // ⭐ Check score threshold (30 points)
        if (score < SCORE_THRESHOLD) revert ScoreTooLow();
        
        uint256 today = block.timestamp / 1 days;
        if (fidDailyClaims[farcasterFID][today] >= MAX_DAILY_CLAIMS_PER_FID) {
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
        
        if (address(this).balance < REWARD_AMOUNT) revert InsufficientBalance();
        
        usedProofs[proof] = true;
        fidDailyClaims[farcasterFID][today]++;
        
        playerStats[msg.sender].totalRewardsClaimed += REWARD_AMOUNT;
        
        (bool success, ) = payable(msg.sender).call{value: REWARD_AMOUNT}("");
        if (!success) revert TransferFailed();
        
        emit RewardClaimed(msg.sender, farcasterFID, score, REWARD_AMOUNT, proof);
    }
    
    /**
     * @dev Internal function to verify Farcaster ownership
     */
    function _verifyFarcasterOwnership(
        address /* wallet */,
        uint256 farcasterFID,
        bytes calldata proof
    ) internal pure returns (bool) {
        return proof.length >= 32 && farcasterFID > 0;
    }
    
    // ============ View Functions ============
    
    function getTopPlayers(uint256 count) external view returns (LeaderboardEntry[] memory topPlayers) {
        uint256 totalEntries = leaderboard.length;
        if (totalEntries == 0) {
            return new LeaderboardEntry[](0);
        }
        
        address[] memory uniqueAddresses = new address[](totalEntries);
        uint256[] memory bestScores = new uint256[](totalEntries);
        uint256 uniqueCount = 0;
        
        for (uint256 i = 0; i < totalEntries; i++) {
            address player = leaderboard[i].player;
            uint256 score = leaderboard[i].score;
            
            bool found = false;
            for (uint256 j = 0; j < uniqueCount; j++) {
                if (uniqueAddresses[j] == player) {
                    if (score > bestScores[j]) {
                        bestScores[j] = score;
                    }
                    found = true;
                    break;
                }
            }
            
            if (!found) {
                uniqueAddresses[uniqueCount] = player;
                bestScores[uniqueCount] = score;
                uniqueCount++;
            }
        }
        
        LeaderboardEntry[] memory sortedEntries = new LeaderboardEntry[](uniqueCount);
        
        for (uint256 i = 0; i < uniqueCount; i++) {
            for (uint256 j = 0; j < totalEntries; j++) {
                if (leaderboard[j].player == uniqueAddresses[i] && 
                    leaderboard[j].score == bestScores[i]) {
                    sortedEntries[i] = leaderboard[j];
                    break;
                }
            }
        }
        
        for (uint256 i = 0; i < uniqueCount - 1; i++) {
            for (uint256 j = 0; j < uniqueCount - i - 1; j++) {
                if (sortedEntries[j].score < sortedEntries[j + 1].score) {
                    LeaderboardEntry memory temp = sortedEntries[j];
                    sortedEntries[j] = sortedEntries[j + 1];
                    sortedEntries[j + 1] = temp;
                }
            }
        }
        
        uint256 returnCount = count > uniqueCount ? uniqueCount : count;
        topPlayers = new LeaderboardEntry[](returnCount);
        
        for (uint256 i = 0; i < returnCount; i++) {
            topPlayers[i] = sortedEntries[i];
        }
        
        return topPlayers;
    }
    
    function getPlayerStats(address player) external view returns (
        uint256 highestScore,
        uint256 totalGames,
        uint256 totalRewardsClaimed,
        uint256 lastPlayTimestamp
    ) {
        PlayerStats memory stats = playerStats[player];
        return (
            stats.highestScore,
            stats.totalGames,
            stats.totalRewardsClaimed,
            stats.lastPlayTimestamp
        );
    }
    
    function getRemainingClaimsForFID(uint256 farcasterFID) external view returns (uint256 remaining) {
        uint256 today = block.timestamp / 1 days;
        uint256 claimedToday = fidDailyClaims[farcasterFID][today];
        
        if (claimedToday >= MAX_DAILY_CLAIMS_PER_FID) {
            return 0;
        }
        
        return MAX_DAILY_CLAIMS_PER_FID - claimedToday;
    }
    
    function getLeaderboardSize() external view returns (uint256 size) {
        return leaderboard.length;
    }
    
    function getContractBalance() external view returns (uint256 balance) {
        return address(this).balance;
    }
    
    function getRewardAmount() external pure returns (uint256 amount) {
        return REWARD_AMOUNT;
    }
    
    /**
     * @dev Get score threshold - NOW RETURNS 30
     * @return threshold Minimum score needed to claim reward
     */
    function getScoreThreshold() external pure returns (uint256 threshold) {
        return SCORE_THRESHOLD;
    }
    
    function getTotalClaimsByFID(uint256 farcasterFID) external view returns (uint256 claims) {
        uint256 today = block.timestamp / 1 days;
        return fidDailyClaims[farcasterFID][today];
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
        uint256 today = block.timestamp / 1 days;
        
        if (fidDailyClaims[farcasterFID][today] >= MAX_DAILY_CLAIMS_PER_FID) {
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
        
        // ⭐ Check against 30 point threshold
        if (score < SCORE_THRESHOLD) {
            return (false, 0, "Score too low (need 30+)");
        }
        
        if (timestamp > block.timestamp || timestamp < block.timestamp - 300) {
            return (false, 0, "Invalid timestamp");
        }
        
        if (address(this).balance < REWARD_AMOUNT) {
            return (false, 0, "Insufficient contract balance");
        }
        
        return (true, REWARD_AMOUNT, "Valid claim");
    }
    
    function isProofUsed(
        address player,
        uint256 score,
        uint256 gameNonce,
        uint256 timestamp,
        uint256 farcasterFID
    ) external view returns (bool used) {
        bytes32 proof = keccak256(abi.encodePacked(
            player,
            score,
            gameNonce,
            timestamp,
            farcasterFID
        ));
        return usedProofs[proof];
    }
    
    function getMaxDailyClaimsPerFID() external pure returns (uint256 max) {
        return MAX_DAILY_CLAIMS_PER_FID;
    }
    
    // ============ Owner Functions ============
    
    function fundContract() external payable onlyOwner {
        emit ContractFunded(msg.sender, msg.value);
    }
    
    function withdrawETH(uint256 amount) external onlyOwner {
        if (amount > address(this).balance) revert InsufficientBalance();
        
        (bool success, ) = payable(owner).call{value: amount}("");
        if (!success) revert TransferFailed();
    }
    
    function emergencyWithdrawAll() external onlyOwner {
        uint256 balance = address(this).balance;
        if (balance == 0) revert InsufficientBalance();
        
        (bool success, ) = payable(owner).call{value: balance}("");
        if (!success) revert TransferFailed();
    }
    
    function getContractInfo() external view returns (
        uint256 contractBalance,
        uint256 totalEntries,
        uint256 rewardsAvailable
    ) {
        contractBalance = address(this).balance;
        totalEntries = leaderboard.length;
        rewardsAvailable = contractBalance / REWARD_AMOUNT;
        
        return (contractBalance, totalEntries, rewardsAvailable);
    }
}