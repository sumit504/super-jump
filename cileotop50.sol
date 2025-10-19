// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title CelioJumpGame - Complete Game Contract with Leaderboard
 * @dev Players can submit scores to leaderboard and claim daily ETH rewards
 * @dev Deployed on Base Mainnet
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
    uint256 public constant SCORE_THRESHOLD = 15;
    
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
        // This function can be used for tracking, daily limits, etc.
        // For now, it just emits an event
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
        // Validate score (reasonable range)
        if (score == 0 || score > 1000000) {
            revert InvalidScore();
        }
        
        PlayerStats storage stats = playerStats[msg.sender];
        
        // Check if this score is better than previous best
        if (stats.highestScore > 0 && score <= stats.highestScore) {
            revert ScoreNotBetter();
        }
        
        bool isNewBest = stats.highestScore > 0;
        
        // Update player stats
        stats.highestScore = score;
        stats.totalGames++;
        stats.lastPlayTimestamp = block.timestamp;
        
        // Create new leaderboard entry
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
     * @dev Claim reward after achieving score threshold
     * @param score Player's score (must be >= SCORE_THRESHOLD)
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
        // Validate FID
        if (farcasterFID == 0) revert InvalidFarcasterFID();
        
        // Verify Farcaster ownership
        if (!_verifyFarcasterOwnership(msg.sender, farcasterFID, farcasterProof)) {
            revert InvalidFarcasterFID();
        }
        
        // Check score threshold
        if (score < SCORE_THRESHOLD) revert ScoreTooLow();
        
        // Check daily claim limit per FID
        uint256 today = block.timestamp / 1 days;
        if (fidDailyClaims[farcasterFID][today] >= MAX_DAILY_CLAIMS_PER_FID) {
            revert FIDAlreadyClaimedToday();
        }
        
        // Generate and validate proof
        bytes32 proof = keccak256(abi.encodePacked(
            msg.sender,
            score,
            gameNonce,
            timestamp,
            farcasterFID
        ));
        
        if (usedProofs[proof]) revert ProofAlreadyUsed();
        
        // Validate timestamp (within 5 minutes)
        if (timestamp > block.timestamp || timestamp < block.timestamp - 300) {
            revert InvalidProof();
        }
        
        // Check contract balance
        if (address(this).balance < REWARD_AMOUNT) revert InsufficientBalance();
        
        // Mark proof as used and increment claims
        usedProofs[proof] = true;
        fidDailyClaims[farcasterFID][today]++;
        
        // Update player stats
        playerStats[msg.sender].totalRewardsClaimed += REWARD_AMOUNT;
        
        // Transfer reward
        (bool success, ) = payable(msg.sender).call{value: REWARD_AMOUNT}("");
        if (!success) revert TransferFailed();
        
        emit RewardClaimed(msg.sender, farcasterFID, score, REWARD_AMOUNT, proof);
    }
    
    /**
     * @dev Internal function to verify Farcaster ownership
     * @dev Basic verification - can be enhanced with actual Farcaster signature verification
     */
    function _verifyFarcasterOwnership(
        address /* wallet */,
        uint256 farcasterFID,
        bytes calldata proof
    ) internal pure returns (bool) {
        // Basic validation: proof must exist and FID must be valid
        return proof.length >= 32 && farcasterFID > 0;
    }
    
    // ============ View Functions ============
    
    /**
     * @dev Get top N players with UNIQUE addresses (highest score only)
     * @param count Number of top players to return
     * @return topPlayers Array of best entries per player
     */
    function getTopPlayers(uint256 count) external view returns (LeaderboardEntry[] memory topPlayers) {
        uint256 totalEntries = leaderboard.length;
        if (totalEntries == 0) {
            return new LeaderboardEntry[](0);
        }
        
        // Create array to track best score per address
        address[] memory uniqueAddresses = new address[](totalEntries);
        uint256[] memory bestScores = new uint256[](totalEntries);
        uint256 uniqueCount = 0;
        
        // Find best score for each unique address
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
        
        // Create sorted result with full entry data
        LeaderboardEntry[] memory sortedEntries = new LeaderboardEntry[](uniqueCount);
        
        for (uint256 i = 0; i < uniqueCount; i++) {
            // Find the entry with best score for this address
            for (uint256 j = 0; j < totalEntries; j++) {
                if (leaderboard[j].player == uniqueAddresses[i] && 
                    leaderboard[j].score == bestScores[i]) {
                    sortedEntries[i] = leaderboard[j];
                    break;
                }
            }
        }
        
        // Bubble sort by score (descending)
        for (uint256 i = 0; i < uniqueCount - 1; i++) {
            for (uint256 j = 0; j < uniqueCount - i - 1; j++) {
                if (sortedEntries[j].score < sortedEntries[j + 1].score) {
                    LeaderboardEntry memory temp = sortedEntries[j];
                    sortedEntries[j] = sortedEntries[j + 1];
                    sortedEntries[j + 1] = temp;
                }
            }
        }
        
        // Return top N
        uint256 returnCount = count > uniqueCount ? uniqueCount : count;
        topPlayers = new LeaderboardEntry[](returnCount);
        
        for (uint256 i = 0; i < returnCount; i++) {
            topPlayers[i] = sortedEntries[i];
        }
        
        return topPlayers;
    }
    
    /**
     * @dev Get player statistics
     * @param player Player address
     * @return highestScore Highest score achieved
     * @return totalGames Total number of games played
     * @return totalRewardsClaimed Total rewards claimed in wei
     * @return lastPlayTimestamp Timestamp of last game played
     */
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
    
    /**
     * @dev Get remaining claims for FID today
     * @param farcasterFID The Farcaster FID to check
     * @return remaining Number of claims remaining today
     */
    function getRemainingClaimsForFID(uint256 farcasterFID) external view returns (uint256 remaining) {
        uint256 today = block.timestamp / 1 days;
        uint256 claimedToday = fidDailyClaims[farcasterFID][today];
        
        if (claimedToday >= MAX_DAILY_CLAIMS_PER_FID) {
            return 0;
        }
        
        return MAX_DAILY_CLAIMS_PER_FID - claimedToday;
    }
    
    /**
     * @dev Get total number of scores submitted
     * @return size Total entries in leaderboard
     */
    function getLeaderboardSize() external view returns (uint256 size) {
        return leaderboard.length;
    }
    
    /**
     * @dev Get contract ETH balance
     * @return balance Contract balance in wei
     */
    function getContractBalance() external view returns (uint256 balance) {
        return address(this).balance;
    }
    
    /**
     * @dev Get reward amount (for frontend display)
     * @return amount Reward amount in wei
     */
    function getRewardAmount() external pure returns (uint256 amount) {
        return REWARD_AMOUNT;
    }
    
    /**
     * @dev Get score threshold (for frontend display)
     * @return threshold Minimum score needed to claim reward
     */
    function getScoreThreshold() external pure returns (uint256 threshold) {
        return SCORE_THRESHOLD;
    }
    
    /**
     * @dev Get total claims made by a specific FID today
     * @param farcasterFID Farcaster user ID
     * @return claims Number of claims made today
     */
    function getTotalClaimsByFID(uint256 farcasterFID) external view returns (uint256 claims) {
        uint256 today = block.timestamp / 1 days;
        return fidDailyClaims[farcasterFID][today];
    }
    
    /**
     * @dev Validate if a claim would be successful (without executing)
     * @return isValid Whether the claim is valid
     * @return prizeAmount Amount that would be claimed
     * @return reason Reason if claim is invalid
     */
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
        
        // Check daily claims
        if (fidDailyClaims[farcasterFID][today] >= MAX_DAILY_CLAIMS_PER_FID) {
            return (false, 0, "FID already claimed today");
        }
        
        // Check proof
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
        
        // Check score
        if (score < SCORE_THRESHOLD) {
            return (false, 0, "Score too low");
        }
        
        // Check timestamp
        if (timestamp > block.timestamp || timestamp < block.timestamp - 300) {
            return (false, 0, "Invalid timestamp");
        }
        
        // Check balance
        if (address(this).balance < REWARD_AMOUNT) {
            return (false, 0, "Insufficient contract balance");
        }
        
        return (true, REWARD_AMOUNT, "Valid claim");
    }
    
    /**
     * @dev Check if a specific proof has been used
     * @return used Whether the proof has been used
     */
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
    
    /**
     * @dev Get max daily claims per FID
     * @return max Maximum claims per FID per day
     */
    function getMaxDailyClaimsPerFID() external pure returns (uint256 max) {
        return MAX_DAILY_CLAIMS_PER_FID;
    }
    
    // ============ Owner Functions ============
    
    /**
     * @dev Fund the contract with ETH for rewards
     */
    function fundContract() external payable onlyOwner {
        emit ContractFunded(msg.sender, msg.value);
    }
    
    /**
     * @dev Withdraw specific amount of ETH
     * @param amount Amount to withdraw in wei
     */
    function withdrawETH(uint256 amount) external onlyOwner {
        if (amount > address(this).balance) revert InsufficientBalance();
        
        (bool success, ) = payable(owner).call{value: amount}("");
        if (!success) revert TransferFailed();
    }
    
    /**
     * @dev Emergency withdraw all funds
     */
    function emergencyWithdrawAll() external onlyOwner {
        uint256 balance = address(this).balance;
        if (balance == 0) revert InsufficientBalance();
        
        (bool success, ) = payable(owner).call{value: balance}("");
        if (!success) revert TransferFailed();
    }
    
    /**
     * @dev Get contract information (for debugging/monitoring)
     * @return contractBalance Current ETH balance
     * @return totalEntries Total leaderboard entries
     * @return rewardsAvailable Estimated number of rewards available
     */
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