const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("HikariPrivateSBT Contract", function () {
  let MockZkVerifier;
  let verifier;
  let HikariPrivateSBT;
  let privateSbt;
  let owner;
  let student1;
  let student2;

  beforeEach(async function () {
    [owner, student1, student2] = await ethers.getSigners();
    
    // Deploy Mock Verifier
    MockZkVerifier = await ethers.getContractFactory("MockZkVerifier");
    verifier = await MockZkVerifier.deploy();
    await verifier.waitForDeployment();
    
    // Deploy Private SBT linked to Mock Verifier
    HikariPrivateSBT = await ethers.getContractFactory("HikariPrivateSBT");
    privateSbt = await HikariPrivateSBT.deploy(await verifier.getAddress());
    await privateSbt.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await privateSbt.owner()).to.equal(owner.address);
    });

    it("Should link to the right Zk Verifier", async function () {
      expect(await privateSbt.zkVerifierAddress()).to.equal(await verifier.getAddress());
    });
  });

  describe("Issuing Private Credentials", function () {
    it("Should allow issuing a credential with a valid proof", async function () {
      const topicId = "ohms_law";
      const score = 90; // e.g. 90%
      const mockZkProof = ethers.hexlify(ethers.toUtf8Bytes("valid_zk_proof_payload"));

      const tx = await privateSbt.issueCredential(
        student1.address,
        topicId,
        score,
        mockZkProof
      );
      await tx.wait();

      // Expected TokenId is keccak256(student, topicId)
      const expectedTokenId = ethers.toBigInt(
        ethers.solidityPackedKeccak256(
          ["address", "string"],
          [student1.address, topicId]
        )
      );

      expect(await privateSbt.balanceOf(student1.address)).to.equal(1);
      expect(await privateSbt.ownerOf(expectedTokenId)).to.equal(student1.address);

      const att = await privateSbt.attestations(expectedTokenId);
      expect(att.topicId).to.equal(topicId);
      expect(att.masteryScore).to.equal(score);
    });

    it("Should revert if ZK proof is invalid (empty)", async function () {
      const topicId = "ohms_law";
      const score = 90;
      const emptyZkProof = "0x"; // Empty proof fails in our MockZkVerifier

      await expect(
        privateSbt.issueCredential(
          student1.address,
          topicId,
          score,
          emptyZkProof
        )
      ).to.be.revertedWith("Hikari: Invalid zero-knowledge proof of mastery");
    });
  });

  describe("Soul-Bound Transfers (Private SBT Restrictions)", function () {
    it("Should prevent transfer of private credentials", async function () {
      const topicId = "ohms_law";
      const score = 90;
      const mockZkProof = ethers.hexlify(ethers.toUtf8Bytes("valid_zk_proof_payload"));

      await privateSbt.issueCredential(
        student1.address,
        topicId,
        score,
        mockZkProof
      );

      const tokenId = ethers.toBigInt(
        ethers.solidityPackedKeccak256(
          ["address", "string"],
          [student1.address, topicId]
        )
      );

      await expect(
        privateSbt.connect(student1).transferFrom(student1.address, student2.address, tokenId)
      ).to.be.revertedWith("Hikari: Soul-Bound credentials cannot be transferred");
    });
  });
});
