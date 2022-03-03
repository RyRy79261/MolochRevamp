import { ethers } from "hardhat";
import { Signer } from "ethers";
import { Moloch, MolochSummoner, Token } from "../typechain";
import { expect } from "chai";
import { TEST_CONFIG } from "./config";
import { parseUnits } from "ethers/lib/utils";

describe("MolochSummoner", () => {
  let deployer: Signer;
  let greg: Signer;
  let steve: Signer;
  let marmite: Signer;

  let molochSummoner: MolochSummoner
  let token: Token
  

  beforeEach(async () => {
    [ deployer, greg, steve, marmite ] = await ethers.getSigners();
    const MolochSummonerFactory = await ethers.getContractFactory("MolochSummoner");
    const TokenFactory = await ethers.getContractFactory("Token");

    molochSummoner = await MolochSummonerFactory.deploy()
    await molochSummoner.deployed()

    token = await TokenFactory.deploy(parseUnits("42060", 18))
    await token.deployed()
  });

  it("initialize correctly", async () => {
    
    expect(await molochSummoner.getMolochCount()).to.be.equal(0)

  });

  describe("functions", () => {
    it("summons Moloch", async () => {
      expect(await molochSummoner.getMolochCount()).to.be.equal(0)
      const marmiteAddress = await marmite.getAddress()
      await molochSummoner.summonMoloch(
        marmiteAddress,
        [token.address],
        TEST_CONFIG.PERIOD_DURATION_IN_SECONDS,
        TEST_CONFIG.VOTING_DURATON_IN_PERIODS,
        TEST_CONFIG.GRACE_DURATON_IN_PERIODS,
        TEST_CONFIG.PROPOSAL_DEPOSIT,
        TEST_CONFIG.DILUTION_BOUND,
        TEST_CONFIG.PROCESSING_REWARD,
      )
      expect(await molochSummoner.getMolochCount()).to.be.equal(1)
      
  
      const molochAddress = await molochSummoner.Molochs(0)
      const MolochFactory = await ethers.getContractFactory("Moloch");
      
      const freshMoloch: Moloch = await MolochFactory.attach(molochAddress)
  
      const [
        delegateKey,
        shares,
        loot,
        exists,
        highestIndexYesVote,
        jailed
      ] = await freshMoloch.members(marmiteAddress)
  
      // Summoner is set up correctly
      expect(delegateKey).to.be.equal(marmiteAddress)
      expect(shares).to.be.equal(1)
      expect(loot).to.be.equal(0)
      expect(exists).to.be.true
      expect(highestIndexYesVote).to.be.equal(0)
      expect(jailed).to.be.equal(0)
  
      // Deposit token is assigned from first of approved tokens 
      const depositToken = await freshMoloch.depositToken()
      expect(depositToken).to.be.equal(token.address)
  
  
      const periodDuration = await freshMoloch.periodDuration()
      const votingPeriodLength = await freshMoloch.votingPeriodLength()
      const gracePeriodLength = await freshMoloch.gracePeriodLength()
      const proposalDeposit = await freshMoloch.proposalDeposit()
      const dilutionBound = await freshMoloch.dilutionBound()
      const processingReward = await freshMoloch.processingReward()
  
      expect(depositToken).to.be.equal(token.address)
  
      expect(periodDuration).to.be.equal(TEST_CONFIG.PERIOD_DURATION_IN_SECONDS)
      expect(votingPeriodLength).to.be.equal(TEST_CONFIG.VOTING_DURATON_IN_PERIODS)
      expect(gracePeriodLength).to.be.equal(TEST_CONFIG.GRACE_DURATON_IN_PERIODS)
      expect(proposalDeposit).to.be.equal(TEST_CONFIG.PROPOSAL_DEPOSIT)
      expect(dilutionBound).to.be.equal(TEST_CONFIG.DILUTION_BOUND)
      expect(processingReward).to.be.equal(TEST_CONFIG.PROCESSING_REWARD)
  
    })
  })

 
  describe("events", () => {
    it("emits Summoned", async () => {
      // Summoned(address indexed M, address indexed _summoner);
      expect(await molochSummoner.getMolochCount()).to.be.equal(0)
      const marmiteAddress = await marmite.getAddress()
      await expect(molochSummoner.summonMoloch(
        marmiteAddress,
        [token.address],
        TEST_CONFIG.PERIOD_DURATION_IN_SECONDS,
        TEST_CONFIG.VOTING_DURATON_IN_PERIODS,
        TEST_CONFIG.GRACE_DURATON_IN_PERIODS,
        TEST_CONFIG.PROPOSAL_DEPOSIT,
        TEST_CONFIG.DILUTION_BOUND,
        TEST_CONFIG.PROCESSING_REWARD,
      )).to.emit(molochSummoner, "Summoned")
    })
  })
  

});
