/* globals describe, it */

import { addressToPk } from '@algorand-builder/algob';
import { Runtime, StoreAccount } from '@algorand-builder/runtime';
import chai from 'chai';
import { ContractManager } from './utils/contract.mjs';
import { setupAssets, fundAccounts } from './utils/assets.mjs';
import constants, { ASK_PRICE, BID_PRICE, BIDS_AMOUNT, CREATOR_ADDRESS, OWNER_ADDRESS } from '../common/constants.js';

const {
  ESCROW_ADDRESS
} = constants;
const { assert } = chai;

describe('nft-market tests', function () {
  const minBalance = 10e6;
  let master;
  let creator;
  let thirdParty;

  let runtime;
  let contract;
  let assetIds;

  const getGlobal = (key) => runtime.getGlobalState(contract.getApplicationId(), key);
  const getLocal = (accountAddr, key) => runtime.getLocalState(contract.getApplicationId(), accountAddr, key);

  this.beforeEach(() => {
    master = new StoreAccount(1000e6);
    creator = new StoreAccount(minBalance);
    thirdParty = new StoreAccount(minBalance);
    runtime = new Runtime([master, creator, thirdParty]);
    assetIds = setupAssets(runtime, master);
    fundAccounts(runtime, master, [master, creator, thirdParty], assetIds);
    contract = new ContractManager(runtime, creator, assetIds);
  });

  it('successfully swaps and withdraws', () => {
    const creatorPk = addressToPk(creator.address);

    // Setup application
    contract.setupApplication(master);

    assert.isDefined(contract.getApplicationId());
    assert.equal(getGlobal(ASK_PRICE), 0);
    assert.equal(getGlobal(BIDS_AMOUNT), 0);
    assert.deepEqual(getGlobal(OWNER_ADDRESS), new Uint8Array(32));
    assert.deepEqual(getGlobal(ESCROW_ADDRESS), new Uint8Array(32));
    assert.deepEqual(getGlobal(CREATOR_ADDRESS), creatorPk);

    // Setup escrow account
    contract.setupEscrow();

    // Verify escrow storage
    assert.deepEqual(getGlobal(ESCROW_ADDRESS), addressToPk(contract.getEscrowAddress()));

    // Opt-in
    contract.optIn(master.address);

    // First ask offer
    contract.setPrice(master, 100, {
      addNFT: true
    });
    assert.deepEqual(getGlobal(OWNER_ADDRESS), addressToPk(master.address));
    assert.equal(getGlobal(ASK_PRICE), 100);
    assert.equal(getGlobal(BIDS_AMOUNT), 0);

    // Update ask offer
    contract.setPrice(master, 1000);
    assert.deepEqual(getGlobal(OWNER_ADDRESS), addressToPk(master.address));
    assert.equal(getGlobal(ASK_PRICE), 1000);
    assert.equal(getGlobal(BIDS_AMOUNT), 0);

    // First bid offer
    contract.optIn(thirdParty.address);
    assert.equal(getLocal(thirdParty.address, BID_PRICE), 0);
    assert.equal(getGlobal(BIDS_AMOUNT), 0);
    contract.bid(thirdParty, 100);
    assert.equal(getLocal(thirdParty.address, BID_PRICE), 100);
    assert.equal(getGlobal(BIDS_AMOUNT), 1);

    // Increase bid offer
    contract.bid(thirdParty, 900);
    assert.equal(getLocal(thirdParty.address, BID_PRICE), 900);
    assert.equal(getGlobal(BIDS_AMOUNT), 1);

    // Decrease bid offer
    contract.bid(thirdParty, 800);
    assert.equal(getLocal(thirdParty.address, BID_PRICE), 800);
    assert.equal(getGlobal(BIDS_AMOUNT), 1);

    // Remove ask offer and withdraw NFT
    assert.deepEqual(getGlobal(OWNER_ADDRESS), addressToPk(master.address));
    assert.equal(getGlobal(ASK_PRICE), 1000);
    assert.equal(getGlobal(BIDS_AMOUNT), 1);
    contract.setPrice(master, 0, {
      removeNFT: true
    });
    assert.deepEqual(getGlobal(OWNER_ADDRESS), new Uint8Array(32));
    assert.equal(getGlobal(ASK_PRICE), 0);
    assert.equal(getGlobal(BIDS_AMOUNT), 1);

    // Sell now with direct NFT transfer
    contract.sellNow(master, thirdParty.address, {
      directTransfer: true
    });
    assert.deepEqual(getGlobal(OWNER_ADDRESS), new Uint8Array(32));
    assert.equal(getGlobal(ASK_PRICE), 0);
    assert.equal(getGlobal(BIDS_AMOUNT), 0);
    assert.equal(getLocal(thirdParty.address, BID_PRICE), 0);

    // First ask offer
    contract.setPrice(thirdParty, 1000, {
      addNFT: true
    });
    assert.deepEqual(getGlobal(OWNER_ADDRESS), addressToPk(thirdParty.address));
    assert.equal(getGlobal(ASK_PRICE), 1000);
    assert.equal(getGlobal(BIDS_AMOUNT), 0);
    assert.equal(getLocal(master.address, BID_PRICE), 0);

    // Increase bid offer
    contract.bid(master, 100);
    assert.equal(getGlobal(BIDS_AMOUNT), 1);
    assert.equal(getLocal(master.address, BID_PRICE), 100);

    // Buy now while increasing bid offer
    contract.buyNow(master, {});
    assert.deepEqual(getGlobal(OWNER_ADDRESS), new Uint8Array(32));
    assert.equal(getGlobal(ASK_PRICE), 0);
    assert.equal(getGlobal(BIDS_AMOUNT), 0);
    assert.equal(getLocal(master.address, BID_PRICE), 0);

    // First ask offer
    contract.setPrice(master, 1000, {
      addNFT: true
    });
    assert.deepEqual(getGlobal(OWNER_ADDRESS), addressToPk(master.address));
    assert.equal(getGlobal(ASK_PRICE), 1000);

    // Increase bid offer
    contract.bid(thirdParty, 900);
    assert.equal(getGlobal(BIDS_AMOUNT), 1);
    assert.equal(getLocal(thirdParty.address, BID_PRICE), 900);

    // Decrease ask offer
    contract.setPrice(master, 800);
    assert.deepEqual(getGlobal(OWNER_ADDRESS), addressToPk(master.address));
    assert.equal(getGlobal(ASK_PRICE), 800);

    // Buy now while decreasing bid offer
    contract.buyNow(thirdParty);
    assert.deepEqual(getGlobal(OWNER_ADDRESS), new Uint8Array(32));
    assert.equal(getGlobal(ASK_PRICE), 0);
    assert.equal(getGlobal(BIDS_AMOUNT), 0);
    assert.equal(getLocal(thirdParty.address, BID_PRICE), 0);

    // Create bid offer without ask offer
    contract.bid(thirdParty, 900);
    assert.equal(getGlobal(BIDS_AMOUNT), 1);
    assert.equal(getLocal(thirdParty.address, BID_PRICE), 900);

    // First ask offer
    contract.setPrice(master, 1000, {
      addNFT: true
    });
    assert.deepEqual(getGlobal(OWNER_ADDRESS), addressToPk(master.address));
    assert.equal(getGlobal(ASK_PRICE), 1000);
    assert.equal(getGlobal(BIDS_AMOUNT), 1);
    assert.equal(getLocal(thirdParty.address, BID_PRICE), 900);

    // Sell now with direct NFT transfer
    contract.sellNow(master, thirdParty.address);
    assert.deepEqual(getGlobal(OWNER_ADDRESS), new Uint8Array(32));
    assert.equal(getGlobal(ASK_PRICE), 0);
    assert.equal(getGlobal(BIDS_AMOUNT), 0);
    assert.equal(getLocal(thirdParty.address, BID_PRICE), 0);
  });
});
