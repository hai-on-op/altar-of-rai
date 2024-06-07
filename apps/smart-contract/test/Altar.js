const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

describe("Altar", function() {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function fixuture() {
    const pokeCooldown = 100;

    const Sablier = await ethers.getContractFactory("Sablier");
    const sablier = await Sablier.deploy();

    const KITE = await ethers.getContractFactory("KITE");
    const kite = await KITE.deploy();

    const FLX = await ethers.getContractFactory("FLX");
    const flx = await FLX.deploy();

    const AltarTreasury = await ethers.getContractFactory("AltarTreasury");
    const altarTreasury = await AltarTreasury.deploy(
      sablier.address,
      kite.address
    );

    const EasyAuction = await ethers.getContractFactory("EasyAuction");
    const easyAuction = await EasyAuction.deploy();

    const auctionTime = 5 * 60;

    const Altar = await ethers.getContractFactory("Altar");
    const altar = await Altar.deploy(
      sablier.address,
      kite.address,
      flx.address,
      altarTreasury.address,
      pokeCooldown,
      auctionTime,
      easyAuction.address
    );

    const litBalance = 5 * 1000 * 1000;
    const periode = 1000;

    await kite.mint(altarTreasury.address, litBalance);

    return {
      sablier,
      kite,
      flx,
      altar,
      altarTreasury,
      litBalance,
      periode,
      pokeCooldown,
      easyAuction,
      auctionTime,
    };
  }

  async function startedStreamFixture() {
    const fixtureObj = await fixuture();
    const { altarTreasury, periode, altar } = fixtureObj;
    await altarTreasury.startStream(periode, altar.address);

    const streamId = await altarTreasury.streamId();

    return { ...fixtureObj, streamId };
  }

  describe("Deployment", function() {
    it("Sablier should exist", async function() {
      const { sablier } = await loadFixture(fixuture);
      expect(sablier.address).to.exist;
    });

    it("KITE should exist", async function() {
      const { kite } = await loadFixture(fixuture);
      expect(kite.address).to.exist;
    });

    it("FLX should exist", async function() {
      const { flx } = await loadFixture(fixuture);
      expect(flx.address).to.exist;
    });

    it("Altar Treasury must have proper addresses setted", async function() {
      const { altarTreasury, sablier, flx, kite } = await loadFixture(fixuture);
      expect(altarTreasury.address).to.exist;

      expect(await altarTreasury.kite()).to.equal(kite.address);
      expect(await altarTreasury.sablier()).to.equal(sablier.address);
    });

    it("Altar must have proper addresses setted", async function() {
      const { altar, sablier, flx, kite } = await loadFixture(fixuture);
      expect(altar.address).to.exist;

      expect(await altar.kite()).to.equal(kite.address);
      expect(await altar.sablier()).to.equal(sablier.address);
      expect(await altar.flx()).to.equal(flx.address);
    });

    it("Altar must have proper treasury address", async function() {
      const { altar, altarTreasury } = await loadFixture(fixuture);
      expect(await altar.treasury()).to.equal(altarTreasury.address);
    });
  });

  describe("Create stream", function() {
    it("Must be able to start the stream with periode", async function() {
      const { altarTreasury, altar, periode } = await loadFixture(fixuture);
      await altarTreasury.startStream(periode, altar.address);
      expect(await altarTreasury.streamId()).to.not.equal(0);
      expect(await altar.streamId()).to.exist;
      expect(await altar.streamId()).to.equal(await altarTreasury.streamId());
    });

    it("Must be able to test stream in the time", async function() {
      const {
        altarTreasury,
        altar,
        periode,
        sablier,
        streamId,
        litBalance,
      } = await loadFixture(startedStreamFixture);

      expect(await sablier.balanceOf(streamId, altarTreasury.address)).to.equal(
        litBalance
      );
      expect(await sablier.balanceOf(streamId, altar.address)).to.equal(0);

      await network.provider.send("evm_increaseTime", [periode + 120]);
      await network.provider.send("evm_mine"); // this one will have 02:00 PM as its timestamp
      expect(await sablier.balanceOf(streamId, altarTreasury.address)).to.equal(
        0
      );
      expect(await sablier.balanceOf(streamId, altar.address)).to.equal(
        litBalance
      );
    });
  });

  describe("Poke", function() {
    it("Must not be able to poke at before the target time", async function() {
      const { altar } = await loadFixture(startedStreamFixture);

      await expect(altar.poke()).to.be.revertedWith("can't yet");
    });
    it("Must be able to poke at the proper time", async function() {
      const { altar, pokeCooldown } = await loadFixture(startedStreamFixture);
      await network.provider.send("evm_increaseTime", [pokeCooldown + 120]);
      await network.provider.send("evm_mine");
      await expect(altar.poke()).to.be.not.revertedWith("can't yet");
    });

    it("Must not be able to poke twice after each other", async function() {
      const { altar, pokeCooldown } = await loadFixture(startedStreamFixture);
      await network.provider.send("evm_increaseTime", [pokeCooldown + 120]);
      await network.provider.send("evm_mine");
      await expect(altar.poke()).to.be.not.revertedWith("can't yet");
      await expect(altar.poke()).to.be.revertedWith("can't yet");
    });

    it("Must withdrawal from stream", async function() {
      const { altar, kite, pokeCooldown, easyAuction } = await loadFixture(
        startedStreamFixture
      );
      await network.provider.send("evm_increaseTime", [pokeCooldown + 120]);
      await network.provider.send("evm_mine");
      expect(await kite.balanceOf(altar.address)).to.be.equal(0);
      await altar.poke();
      expect(await kite.balanceOf(easyAuction.address)).to.not.be.equal(0);
    });

    it("Must emit Poked event", async function() {
      const { altar, pokeCooldown } = await loadFixture(startedStreamFixture);
      await network.provider.send("evm_increaseTime", [pokeCooldown + 120]);
      await network.provider.send("evm_mine");
      await expect(altar.poke()).to.emit(altar, "Poked");
    });

    it("Must emit NewAuction event in auctionHouse ", async function() {
      const { altar, pokeCooldown, easyAuction } = await loadFixture(
        startedStreamFixture
      );
      await network.provider.send("evm_increaseTime", [pokeCooldown + 120]);
      await network.provider.send("evm_mine");
      await expect(altar.poke()).to.emit(easyAuction, "NewAuction");
    });
  });
});
