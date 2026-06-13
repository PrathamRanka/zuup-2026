// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IZkVerifier {
    function verifyProof(bytes calldata proof, uint256[] calldata publicInputs) external view returns (bool);
}

contract HikariPrivateSBT is ERC721, Ownable {
    
    struct Attestation {
        string topicId;
        uint256 masteryScore;
        uint256 issuedAt;
    }
    
    address public zkVerifierAddress;
    mapping(uint256 => Attestation) public attestations;
    
    constructor(address _zkVerifier) ERC721("HikariAttested", "HIKARI") Ownable(msg.sender) {
        zkVerifierAddress = _zkVerifier;
    }
    
    function setZkVerifier(address _zkVerifier) external onlyOwner {
        zkVerifierAddress = _zkVerifier;
    }
    
    function issueCredential(
        address student,
        string calldata topicId,
        uint256 score,
        bytes calldata zkProof
    ) external returns (uint256) {
        // Build public inputs for ZK proof: [hash(student), hash(topicId), score]
        uint256[] memory publicInputs = new uint256[](3);
        publicInputs[0] = uint256(keccak256(abi.encodePacked(student)));
        publicInputs[1] = uint256(keccak256(abi.encodePacked(topicId)));
        publicInputs[2] = score;
        
        // Verify ZK Proof before minting SBT
        require(
            IZkVerifier(zkVerifierAddress).verifyProof(zkProof, publicInputs),
            "Hikari: Invalid zero-knowledge proof of mastery"
        );
        
        uint256 tokenId = uint256(keccak256(abi.encodePacked(student, topicId)));
        _safeMint(student, tokenId);
        
        attestations[tokenId] = Attestation({
            topicId: topicId,
            masteryScore: score,
            issuedAt: block.timestamp
        });
        
        return tokenId;
    }
    
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        require(from == address(0), "Hikari: Soul-Bound credentials cannot be transferred");
        return super._update(to, tokenId, auth);
    }
}
