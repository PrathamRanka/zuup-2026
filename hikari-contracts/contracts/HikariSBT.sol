// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract HikariSBT is ERC721, Ownable {
    
    struct LearningCredential {
        string studentId;      // Hikari student UUID (hashed/string)
        string topicId;        // e.g., "ohms_law"
        string topicName;      // e.g., "Ohm's Law"
        string subject;        // e.g., "physics"
        string curriculum;     // e.g., "ncert"
        uint256 masteryScore;  // scaled x1000 (e.g., 830 = 0.830)
        uint256 issuedAt;
        string metadataUri;    // IPFS URI with full credential JSON
    }
    
    uint256 private _tokenIdCounter;
    
    mapping(uint256 => LearningCredential) public credentials;
    mapping(address => uint256[]) public studentTokens;
    
    // Events
    event CredentialIssued(
        uint256 indexed tokenId,
        address indexed student,
        string topicId,
        uint256 masteryScore
    );
    
    constructor() ERC721("HikariLearning", "HIKARI") Ownable(msg.sender) {}
    
    // SOUL-BOUND: Override transfers to prevent selling/trading
    function _update(address to, uint256 tokenId, address auth)
        internal override returns (address) {
        address from = _ownerOf(tokenId);
        // Only allow minting (from == address(0)), block all transfers
        require(from == address(0), "Hikari: SBT cannot be transferred");
        return super._update(to, tokenId, auth);
    }
    
    // Issue credential — only callable by Hikari backend (owner)
    function issueCredential(
        address student,
        string memory studentId,
        string memory topicId,
        string memory topicName,
        string memory subject,
        string memory curriculum,
        uint256 masteryScore,
        string memory metadataUri
    ) external onlyOwner returns (uint256) {
        uint256 tokenId = _tokenIdCounter++;
        _safeMint(student, tokenId);
        
        credentials[tokenId] = LearningCredential({
            studentId: studentId,
            topicId: topicId,
            topicName: topicName,
            subject: subject,
            curriculum: curriculum,
            masteryScore: masteryScore,
            issuedAt: block.timestamp,
            metadataUri: metadataUri
        });
        
        studentTokens[student].push(tokenId);
        
        emit CredentialIssued(tokenId, student, topicId, masteryScore);
        return tokenId;
    }
    
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        return credentials[tokenId].metadataUri;
    }
    
    function getStudentCredentials(address student) external view returns (uint256[] memory) {
        return studentTokens[student];
    }
    
    function verifyCredential(uint256 tokenId) external view returns (
        bool valid,
        string memory topicId,
        uint256 masteryScore,
        uint256 issuedAt
    ) {
        address owner = _ownerOf(tokenId);
        return (
            owner != address(0),
            credentials[tokenId].topicId,
            credentials[tokenId].masteryScore,
            credentials[tokenId].issuedAt
        );
    }
}
