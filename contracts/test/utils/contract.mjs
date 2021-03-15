import algosdk from 'algosdk';
import { getProgram, stringToBytes } from '@algorand-builder/algob';
import { SignType, TransactionType } from '@algorand-builder/runtime/build/types.js';
import {
  ASK_PRICE,
  BID,
  BID_PRICE,
  BUY_NOW,
  CONFIGURE,
  OWNER_ADDRESS,
  SELL_NOW,
  SET_PRICE
} from '../../common/constants.js';

export class ContractManager {
  constructor(runtime, creator, assets) {
    this.creator = creator;
    this.runtime = runtime;
    this.NFTAssetId = assets['NFTAssetId'];
    this.USDCAssetId = assets['USDCAssetId'];
    this.program = getProgram('manager.py', {});

    this.creationArgs = [
      `int:${this.USDCAssetId}`,
      `int:${this.NFTAssetId}`
    ];
    this.flags = {
      sender: creator.account,
      accounts: [creator.address],
      localInts: 1,
      localBytes: 0,
      globalInts: 4,
      globalBytes: 3
    };
    this.escrow = null;
    this.escrowAddress = null;
    this.applicationId = null;
    this.lSig = null;
  }

  setupApplication() {
    this.creationFlags = Object.assign({}, this.flags);
    this.applicationId = this.runtime.addApp({ ...this.creationFlags, appArgs: this.creationArgs }, {}, this.program);
  }

  setupEscrow() {
    this.deployEscrow();
    this.addFundsToEscrow();
    this.escrowSetupAssets();
  }

  addFundsToEscrow() {
    let txGroup = [
      {
        type: TransactionType.TransferAlgo,
        sign: SignType.SecretKey,
        fromAccount: this.creator.account,
        toAccountAddr: this.escrowAddress,
        amountMicroAlgos: this.escrow.minBalance + 302000,
        payFlags: {
          totalFee: 1000,
        }
      }
    ];
    this.runtime.executeTx(txGroup, {}, []);
  }

  deployEscrow() {
    const escrowProg = getProgram('escrow.py', {
      app_id: this.applicationId,
      nft_id: this.NFTAssetId,
      usdc_id: this.USDCAssetId
    });
    this.lSig = this.runtime.getLogicSig(escrowProg, []);
    const escrowAddress = this.lSig.address();
    this.escrow = this.runtime.getAccount(escrowAddress);
    this.setEscrowAddress(this.escrow.address);
  }

  escrowSetupAssets() {
    this.runtime.optIntoASA(this.USDCAssetId, this.escrowAddress, {}); // opt-in tx doesn't work
    this.runtime.optIntoASA(this.NFTAssetId, this.escrowAddress, {});

    let txGroup = [
      {
        type: TransactionType.CallNoOpSSC,
        sign: SignType.SecretKey,
        fromAccount: this.creator.account,
        appId: this.applicationId,
        appArgs: [stringToBytes(CONFIGURE)],
        accounts: [this.escrowAddress],
        payFlags: { totalFee: 1000 }
      },
      {
        type: TransactionType.TransferAsset,
        assetID: this.USDCAssetId,
        sign: SignType.LogicSignature,
        lsig: this.lSig,
        fromAccount: this.escrow.account,
        toAccountAddr: this.escrowAddress,
        amount: 0,
        payFlags: {
          totalFee: 1000,
        },
      },
      {
        type: TransactionType.TransferAsset,
        assetID: this.NFTAssetId,
        sign: SignType.LogicSignature,
        lsig: this.lSig,
        fromAccount: this.escrow.account,
        toAccountAddr: this.escrowAddress,
        amount: 0,
        payFlags: {
          totalFee: 1000,
        },
      },
    ];
    this.runtime.executeTx(txGroup, this.program, []);
  }

  getEscrowAddress() {
    return this.escrowAddress;
  }

  setEscrowAddress(address) {
    return this.escrowAddress = address;
  }

  getApplicationId() {
    return this.applicationId;
  }

  setupApplicationWithEscrow() {
    this.setupApplication();
    this.setupEscrow();
  }

  optIn(address) {
    this.runtime.optInToApp(address, this.applicationId, {}, {}, this.program);
  }

  setPrice(from, price, params = {}) {
    let appArgs = [stringToBytes(SET_PRICE), `int:${price}`];
    let txGroup;
    if (params['addNFT']) {
      txGroup = [
        {
          type: TransactionType.CallNoOpSSC,
          sign: SignType.SecretKey,
          fromAccount: from.account,
          appId: this.applicationId,
          appArgs: appArgs,
          payFlags: { totalFee: 1000 },
        },
        {
          type: TransactionType.TransferAsset,
          assetID: this.NFTAssetId,
          sign: SignType.SecretKey,
          fromAccount: from.account,
          toAccountAddr: this.escrowAddress,
          amount: 1,
          payFlags: {
            totalFee: 1000,
          },
        }
      ];
    } else if (params['removeNFT']) {
      txGroup = [
        {
          type: TransactionType.CallNoOpSSC,
          sign: SignType.SecretKey,
          fromAccount: from.account,
          appId: this.applicationId,
          appArgs: appArgs,
          payFlags: { totalFee: 1000 },
        },
        {
          type: TransactionType.TransferAlgo,
          sign: SignType.SecretKey,
          fromAccount: from.account,
          toAccountAddr: this.escrow.address,
          amountMicroAlgos: 1000,
          payFlags: {
            totalFee: 1000,
          },
        },
        {
          type: TransactionType.TransferAsset,
          assetID: this.NFTAssetId,
          sign: SignType.LogicSignature,
          lsig: this.lSig,
          fromAccount: this.escrow.account,
          toAccountAddr: from.address,
          amount: 1,
          payFlags: {
            totalFee: 1000,
          },
        },
      ];
    } else {
      txGroup = [
        {
          type: TransactionType.CallNoOpSSC,
          sign: SignType.SecretKey,
          fromAccount: from.account,
          appId: this.applicationId,
          appArgs: appArgs,
          payFlags: { totalFee: 1000 },
        }
      ];
    }
    this.runtime.executeTx(txGroup, this.program, []);
  }

  // eslint-disable-next-line no-unused-vars
  bid(from, targetPrice, params = {}) {
    const currentPrice = Number(this.runtime.getLocalState(this.getApplicationId(), from.address, BID_PRICE));
    const difference = targetPrice - currentPrice;
    let appArgs = [stringToBytes(BID)];
    let txGroup;
    if (difference >= 0) {
      txGroup = [
        {
          type: TransactionType.CallNoOpSSC,
          sign: SignType.SecretKey,
          fromAccount: from.account,
          appId: this.applicationId,
          appArgs: appArgs,
          payFlags: { totalFee: 1000 },
        },
        {
          type: TransactionType.TransferAsset,
          assetID: this.USDCAssetId,
          sign: SignType.SecretKey,
          fromAccount: from.account,
          toAccountAddr: this.escrowAddress,
          amount: difference,
          payFlags: {
            totalFee: 1000,
          },
        }
      ];
    } else {
      txGroup = [
        {
          type: TransactionType.CallNoOpSSC,
          sign: SignType.SecretKey,
          fromAccount: from.account,
          appId: this.applicationId,
          appArgs: appArgs,
          payFlags: { totalFee: 1000 },
        },
        {
          type: TransactionType.TransferAlgo,
          sign: SignType.SecretKey,
          fromAccount: from.account,
          toAccountAddr: this.escrow.address,
          amountMicroAlgos: 1000,
          payFlags: {
            totalFee: 1000,
          },
        },
        {
          type: TransactionType.TransferAsset,
          assetID: this.USDCAssetId,
          sign: SignType.LogicSignature,
          lsig: this.lSig,
          fromAccount: this.escrow.account,
          toAccountAddr: from.address,
          amount: Math.abs(difference),
          payFlags: {
            totalFee: 1000,
          },
        }
      ];
    }
    this.runtime.executeTx(txGroup, this.program, []);
  }

  sellNow(from, toAddress, params = {}) {
    const appArgs = [stringToBytes(SELL_NOW)];
    const accounts = [toAddress];
    const bidPrice = Number(this.runtime.getLocalState(this.getApplicationId(), toAddress, BID_PRICE));
    let txGroup;
    if (params['directTransfer']) {
      txGroup = [
        {
          type: TransactionType.CallNoOpSSC,
          sign: SignType.SecretKey,
          fromAccount: from.account,
          appId: this.applicationId,
          appArgs: appArgs,
          accounts: accounts,
          payFlags: { totalFee: 1000 },
        },
        {
          type: TransactionType.TransferAlgo,
          sign: SignType.SecretKey,
          fromAccount: from.account,
          toAccountAddr: this.escrow.address,
          amountMicroAlgos: 1000,
          payFlags: {
            totalFee: 1000,
          },
        },
        {
          type: TransactionType.TransferAsset,
          assetID: this.USDCAssetId,
          sign: SignType.LogicSignature,
          lsig: this.lSig,
          fromAccount: this.escrow.account,
          toAccountAddr: from.address,
          amount: bidPrice,
          payFlags: {
            totalFee: 1000,
          },
        },
        {
          type: TransactionType.TransferAsset,
          assetID: this.NFTAssetId,
          sign: SignType.SecretKey,
          fromAccount: from.account,
          toAccountAddr: toAddress,
          amount: 1,
          payFlags: {
            totalFee: 1000,
          },
        }
      ];
    } else {
      txGroup = [
        {
          type: TransactionType.CallNoOpSSC,
          sign: SignType.SecretKey,
          fromAccount: from.account,
          appId: this.applicationId,
          appArgs: appArgs,
          accounts: accounts,
          payFlags: { totalFee: 1000 },
        },
        {
          type: TransactionType.TransferAlgo,
          sign: SignType.SecretKey,
          fromAccount: from.account,
          toAccountAddr: this.escrow.address,
          amountMicroAlgos: 2000,
          payFlags: {
            totalFee: 1000,
          },
        },
        {
          type: TransactionType.TransferAsset,
          assetID: this.USDCAssetId,
          sign: SignType.LogicSignature,
          lsig: this.lSig,
          fromAccount: this.escrow.account,
          toAccountAddr: from.address,
          amount: bidPrice,
          payFlags: {
            totalFee: 1000,
          },
        },
        {
          type: TransactionType.TransferAsset,
          assetID: this.NFTAssetId,
          sign: SignType.LogicSignature,
          lsig: this.lSig,
          fromAccount: this.escrow.account,
          toAccountAddr: toAddress,
          amount: 1,
          payFlags: {
            totalFee: 1000,
          },
        }
      ];
    }
    this.runtime.executeTx(txGroup, this.program, []);
  }

  // eslint-disable-next-line no-unused-vars
  buyNow(from, params = {}) {
    const appArgs = [stringToBytes(BUY_NOW)];
    const askPrice = Number(this.runtime.getGlobalState(this.getApplicationId(), ASK_PRICE));
    const nftOwner = algosdk.encodeAddress(this.runtime.getGlobalState(this.getApplicationId(), OWNER_ADDRESS));
    const bidPrice = Number(this.runtime.getLocalState(this.getApplicationId(), from.address, BID_PRICE));
    const difference = askPrice - bidPrice;
    let txGroup;
    if (difference >= 0) {
      txGroup = [
        {
          type: TransactionType.CallNoOpSSC,
          sign: SignType.SecretKey,
          fromAccount: from.account,
          appId: this.applicationId,
          appArgs: appArgs,
          payFlags: { totalFee: 1000 },
        },
        {
          type: TransactionType.TransferAlgo,
          sign: SignType.SecretKey,
          fromAccount: from.account,
          toAccountAddr: this.escrow.address,
          amountMicroAlgos: 2000,
          payFlags: {
            totalFee: 1000,
          },
        },
        {
          type: TransactionType.TransferAsset,
          assetID: this.USDCAssetId,
          sign: SignType.SecretKey,
          fromAccount: from.account,
          toAccountAddr: this.escrowAddress,
          amount: difference,
          payFlags: {
            totalFee: 1000,
          },
        },
        {
          type: TransactionType.TransferAsset,
          assetID: this.NFTAssetId,
          sign: SignType.LogicSignature,
          lsig: this.lSig,
          fromAccount: this.escrow.account,
          toAccountAddr: from.address,
          amount: 1,
          payFlags: {
            totalFee: 1000,
          },
        },
        {
          type: TransactionType.TransferAsset,
          assetID: this.USDCAssetId,
          sign: SignType.LogicSignature,
          lsig: this.lSig,
          fromAccount: this.escrow.account,
          toAccountAddr: nftOwner,
          amount: askPrice,
          payFlags: {
            totalFee: 1000,
          },
        }
      ];
    } else {
      txGroup = [
        {
          type: TransactionType.CallNoOpSSC,
          sign: SignType.SecretKey,
          fromAccount: from.account,
          appId: this.applicationId,
          appArgs: appArgs,
          payFlags: { totalFee: 1000 },
        },
        {
          type: TransactionType.TransferAlgo,
          sign: SignType.SecretKey,
          fromAccount: from.account,
          toAccountAddr: this.escrow.address,
          amountMicroAlgos: 3000,
          payFlags: {
            totalFee: 1000,
          },
        },
        {
          type: TransactionType.TransferAsset,
          assetID: this.USDCAssetId,
          sign: SignType.LogicSignature,
          lsig: this.lSig,
          fromAccount: this.escrow.account,
          toAccountAddr: from.address,
          amount: Math.abs(difference),
          payFlags: {
            totalFee: 1000,
          },
        },
        {
          type: TransactionType.TransferAsset,
          assetID: this.NFTAssetId,
          sign: SignType.LogicSignature,
          lsig: this.lSig,
          fromAccount: this.escrow.account,
          toAccountAddr: from.address,
          amount: 1,
          payFlags: {
            totalFee: 1000,
          },
        },
        {
          type: TransactionType.TransferAsset,
          assetID: this.USDCAssetId,
          sign: SignType.LogicSignature,
          lsig: this.lSig,
          fromAccount: this.escrow.account,
          toAccountAddr: nftOwner,
          amount: askPrice,
          payFlags: {
            totalFee: 1000,
          },
        }
      ];
    }
    this.runtime.executeTx(txGroup, this.program, []);
  }
}
