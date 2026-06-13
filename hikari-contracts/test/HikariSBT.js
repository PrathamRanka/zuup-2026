const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("HikariSBT Contract", function () {
  let HikariSBT;
  let sbt;
  let owner;
  let student1;
  let student2;

  beforeEach(async function () {
    [owner, student1, student2] = await ethers.getSigners();
    HikariSBT = await ethers.getContractFactory("HikariSBT");
    sbt = await HikariSBT.deploy();
    await sbt.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await sbt.owner()).to.equal(owner.address);
    });

    it("Should have correct name and symbol", async function () {
      expect(await sbt.name()).to.equal("HikariLearning");
      expect(await sbt.symbol()).to.equal("HIKARI");
    });
  });

  describe("Issuing Credentials", function () {
    it("Should allow owner to issue a credential", async function () {
      const tx = await sbt.issueCredential(
        student1.address,
        "student-123",
        "ohms_law",
        "Ohm's Law",
        "physics",
        "ncert",
        850, // 0.85 * 1000
        "ipfs://metadata-uri"
      );
      await tx.wait();

      expect(await sbt.balanceOf(student1.address)).to.equal(1);
      
      const cred = await sbt.credentials(0);
      expect(cred.studentId).to.equal("student-123");
      expect(cred.topicId).to.equal("ohms_law");
      expect(cred.masteryScore).to.equal(850n);
      expect(await sbt.tokenURI(0)).to.equal("ipfs://metadata-uri");
    });

    it("Should prevent non-owners from issuing credentials", async function () {
      await expect(
        sbt.connect(student1).issueCredential(
          student2.address,
          "student-123",
          "ohms_law",
          "Ohm's Law",
          "physics",
          "ncert",
          850,
          "ipfs://metadata-uri"
        )
      ).to.be.revertedWithCustomError(sbt, "OwnableUnauthorizedAccount");
    });
  });

  describe("Soul-Bound Transfers (SBT Restrictions)", function () {
    beforeEach(async function () {
      await sbt.issueCredential(
        student1.address,
        "student-123",
        "ohms_law",
        "Ohm's Law",
        "physics",
        "ncert",
        850,
        "ipfs://metadata-uri"
      );
    });

    it("Should prevent transfers of the credential token", async function () {
      // Trying to transfer tokenId 0 from student1 to student2 should fail
      await expect(
        sbt.connect(student1).transferFrom(student1.address, student2.address, 0)
      ).to.be.revertedWith("Hikari: SBT cannot be transferred");
    });
  });
});
