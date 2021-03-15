import eventBus from '@/utils/eventBus';
import { validateTx } from '@/utils/validation';
import { internalService } from '@/services/internal';
import {
  assignGroupId,
  combineSignedTxs,
  getLogicSign,
  logicSign,
  transactionMaker,
  TX_FORMAT,
  unwrapTxs,
} from '@/utils/transactions';
import { ALGORAND_LEDGER, USDC_ID } from '@/config';
import { algoExplorer } from '@/services/algoExplorer';
import { BID, BUY_NOW, CONFIGURE, SELL_NOW, SET_PRICE } from '@/utils/constants';

function WalletNotConfigured() {
  return new Error('Wallet Not Configured');
}

WalletNotConfigured.prototype = Object.create(Error.prototype);

export default class WalletManager {
  constructor(ledger) {
    this.wallet = null;
    this.ledger = ledger;
  }

  setWallet(signer) {
    this.wallet = signer;
  }

  getWallet() {
    if (!this.wallet) {
      throw new WalletNotConfigured();
    }
  }

  async connect() {
    return await this.wallet.connect();
  }

  getAccounts() {
    return this.wallet.accounts({
      ledger: this.ledger
    });
  }

  getAccountData(accountAddress) {
    return this.wallet.algod({
      ledger: this.ledger,
      path: `/v2/accounts/${accountAddress}`
    });
  }

  getSuggestedParams() {
    return this.wallet.algod({
      ledger: this.ledger,
      path: '/v2/transactions/params'
    });
  }

  async createAsset(accountAddress, params) {
    const suggestedParams = await this.getSuggestedParams();
    eventBus.$emit('set-action-message', 'Creating asset transaction...');
    const assetTx = transactionMaker.makeAssetCreateTx({
      from: accountAddress,
      note: 'Visit asset URL to learn more.',
      unitName: params['unitName'],
      assetName: params['assetName'],
      assetURL: params['assetURL'],
      assetMetadataHash: params['metadataHash'],
      suggestedParams
    });
    await validateTx([assetTx.getTx(TX_FORMAT.Signer)]);
    const signedAssetTx = await this.wallet.sign([assetTx], 'asset transaction');
    eventBus.$emit('set-action-message', 'Sending asset transaction...');
    return await this.wallet.send({
      ledger: ALGORAND_LEDGER,
      tx: signedAssetTx[0].blob
    });
  }

  async setPrice(accountAddress, escrowAddress, appId, nftId, price, depositAsset = false) {
    const suggestedParams = await this.getSuggestedParams();
    let transactionName;
    if (price > 0) {
      transactionName = 'set price transaction';
    } else {
      transactionName = 'cancel transaction';
    }
    eventBus.$emit('set-action-message', `Creating ${transactionName}...`);
    const callTx = transactionMaker.makeCallTx({
      accountAddress,
      appIndex: appId,
      appArgs: [SET_PRICE, price],
      suggestedParams
    });
    let txnGroup = [callTx];
    let signedTxs;
    if (price > 0) {
      if (depositAsset) {
        const depositTx = transactionMaker.makeAssetPaymentTx({
          accountAddress,
          toAddress: escrowAddress,
          amount: 1,
          assetIndex: nftId,
          suggestedParams
        });
        txnGroup = assignGroupId([
          callTx,
          depositTx
        ]);
      }
      await validateTx(unwrapTxs(txnGroup, TX_FORMAT.Signer));
      // Must be separated due to MyAlgo bug
      signedTxs = await this.wallet.sign(txnGroup, transactionName, true);
    } else {
      const escrowProgram = await this.getEscrowProgram(appId, nftId);
      const lSig = getLogicSign(escrowProgram);
      const feeTx = transactionMaker.makeAlgoPaymentTx({
        accountAddress,
        toAddress: escrowAddress,
        amount: Number(suggestedParams['min-fee']),
        suggestedParams
      });
      const withdrawalTx = transactionMaker.makeAssetPaymentTx({
        accountAddress: escrowAddress,
        toAddress: accountAddress,
        amount: 1,
        assetIndex: nftId,
        suggestedParams
      });
      txnGroup = assignGroupId([
        callTx,
        feeTx,
        withdrawalTx
      ]);
      await validateTx(unwrapTxs(txnGroup, TX_FORMAT.Signer));
      const signedEscrowTx = logicSign(lSig, txnGroup[2].getTx(TX_FORMAT.SDK));
      const signedUserTxs = await this.wallet.sign([txnGroup[0], txnGroup[1]], transactionName);
      signedTxs = [...signedUserTxs, signedEscrowTx];
    }
    const combinedTxs = combineSignedTxs(signedTxs);
    eventBus.$emit('set-action-message', `Sending ${transactionName}...`);
    const response = await internalService.sendOperationTx({
      'blob': btoa(String.fromCharCode.apply(null, combinedTxs)),
      'operation': 'ASK',
    });
    return {
      operationId: response['operation_id'],
    };
  }

  async getEscrowProgram(appId, nftId) {
    const escrowResponse = await internalService.getCompiledEscrow(appId, USDC_ID, nftId);
    return escrowResponse['result'];
  }

  async bid(accountAddress, escrowAddress, appId, nftId, priceDiff, cancel = false) {
    let transactionName;
    if (cancel) {
      transactionName = 'cancel transaction';
    } else {
      transactionName = 'offer transaction';
    }
    const suggestedParams = await this.getSuggestedParams();
    eventBus.$emit('set-action-message', `Creating ${transactionName}...`);
    const escrowProgram = await this.getEscrowProgram(appId, nftId);
    const lSig = getLogicSign(escrowProgram);
    const callTx = transactionMaker.makeCallTx({
      accountAddress,
      appIndex: appId,
      appArgs: [BID],
      suggestedParams
    });
    let txnGroup;
    let signedTxs;
    if (priceDiff >= 0) {
      const depositTx = transactionMaker.makeAssetPaymentTx({
        accountAddress,
        toAddress: escrowAddress,
        amount: priceDiff,
        assetIndex: USDC_ID,
        suggestedParams
      });
      txnGroup = assignGroupId([
        callTx,
        depositTx
      ]);
      await validateTx(unwrapTxs(txnGroup, TX_FORMAT.Signer));
      // Must be separated due to MyAlgo bug
      signedTxs = await this.wallet.sign(txnGroup, transactionName, true);
    } else {
      const withdrawalTx = transactionMaker.makeAssetPaymentTx({
        accountAddress: escrowAddress,
        toAddress: accountAddress,
        amount: Math.abs(priceDiff),
        assetIndex: USDC_ID,
        suggestedParams
      });
      const feeTx = transactionMaker.makeAlgoPaymentTx({
        accountAddress,
        toAddress: escrowAddress,
        amount: Number(suggestedParams['min-fee']),
        suggestedParams
      });
      txnGroup = assignGroupId([
        callTx,
        feeTx,
        withdrawalTx
      ]);
      await validateTx(unwrapTxs(txnGroup, TX_FORMAT.Signer));
      const signedUserTxs = await this.wallet.sign([txnGroup[0], txnGroup[1]], transactionName);
      const signedEscrowTx = logicSign(lSig, txnGroup[2].getTx(TX_FORMAT.SDK));
      signedTxs = [...signedUserTxs, signedEscrowTx];
    }
    const combinedTxs = combineSignedTxs(signedTxs);
    eventBus.$emit('set-action-message', `Sending ${transactionName}...`);
    const response = await internalService.sendOperationTx({
      'blob': btoa(String.fromCharCode.apply(null, combinedTxs)),
      'operation': 'BID',
    });
    return {
      operationId: response['operation_id'],
    };
  }

  async buyNow(accountAddress, escrowAddress, appId, nftId, priceDiff, sellerAddress, price) {
    const suggestedParams = await this.getSuggestedParams();
    eventBus.$emit('set-action-message', 'Creating purchase transaction...');
    const escrowProgram = await this.getEscrowProgram(appId, nftId);
    const lSig = getLogicSign(escrowProgram);
    const callTx = transactionMaker.makeCallTx({
      accountAddress,
      appIndex: appId,
      appArgs: [BUY_NOW],
      suggestedParams
    });
    const nftTransfer = transactionMaker.makeAssetPaymentTx({
      accountAddress: escrowAddress,
      toAddress: accountAddress,
      amount: 1,
      assetIndex: nftId,
      suggestedParams
    });
    const usdcTransfer = transactionMaker.makeAssetPaymentTx({
      accountAddress: escrowAddress,
      toAddress: sellerAddress,
      amount: price,
      assetIndex: USDC_ID,
      suggestedParams
    });
    let feeTx;
    let txnGroup;
    let signedTxs;
    if (priceDiff >= 0) {
      const depositTx = transactionMaker.makeAssetPaymentTx({
        accountAddress,
        toAddress: escrowAddress,
        amount: priceDiff,
        assetIndex: USDC_ID,
        suggestedParams
      });
      feeTx = transactionMaker.makeAlgoPaymentTx({
        accountAddress,
        toAddress: escrowAddress,
        amount: Number(suggestedParams['min-fee']) * 2,
        suggestedParams
      });
      txnGroup = assignGroupId([
        callTx,
        feeTx,
        depositTx,
        nftTransfer,
        usdcTransfer
      ]);
      await validateTx(unwrapTxs(txnGroup, TX_FORMAT.Signer));
      const signedUserTxs = await this.wallet.sign(
        [
          txnGroup[0],
          txnGroup[1],
          txnGroup[2]
        ],
        'purchase transaction'
      );
      signedTxs = [...signedUserTxs];
    } else {
      const withdrawalTx = transactionMaker.makeAssetPaymentTx({
        accountAddress: escrowAddress,
        toAddress: accountAddress,
        amount: Math.abs(priceDiff),
        assetIndex: USDC_ID,
        suggestedParams
      });
      feeTx = transactionMaker.makeAlgoPaymentTx({
        accountAddress,
        toAddress: escrowAddress,
        amount: Number(suggestedParams['min-fee']) * 3,
        suggestedParams
      });
      txnGroup = assignGroupId([
        callTx,
        feeTx,
        withdrawalTx,
        nftTransfer,
        usdcTransfer
      ]);
      await validateTx(unwrapTxs(txnGroup, TX_FORMAT.Signer));
      const signedUserTxs = await this.wallet.sign(
        [
          txnGroup[0],
          txnGroup[1]
        ],
        'purchase transaction'
      );
      signedTxs = [...signedUserTxs, logicSign(lSig, txnGroup[2].getTx(TX_FORMAT.SDK))];
    }
    signedTxs.push(logicSign(lSig, txnGroup[3].getTx(TX_FORMAT.SDK)));
    signedTxs.push(logicSign(lSig, txnGroup[4].getTx(TX_FORMAT.SDK)));
    const combinedTxs = combineSignedTxs(signedTxs);
    eventBus.$emit('set-action-message', 'Sending purchase transaction...');
    const response = await internalService.sendOperationTx({
      'blob': btoa(String.fromCharCode.apply(null, combinedTxs)),
      'operation': 'BUY_NOW',
    });
    return {
      operationId: response['operation_id'],
    };
  }

  async sellNow(accountAddress, escrowAddress, buyerAddress, appId, nftId, price, fromEscrow = false) {
    const suggestedParams = await this.getSuggestedParams();
    eventBus.$emit('set-action-message', 'Creating sell now transaction...');
    const escrowProgram = await this.getEscrowProgram(appId, nftId);
    const lSig = getLogicSign(escrowProgram);
    const callTx = transactionMaker.makeCallTx({
      accountAddress,
      appAccounts: [buyerAddress],
      appIndex: appId,
      appArgs: [SELL_NOW],
      suggestedParams
    });
    const feeTx = transactionMaker.makeAlgoPaymentTx({
      accountAddress,
      toAddress: escrowAddress,
      amount: fromEscrow ? Number(suggestedParams['min-fee']) * 2 : Number(suggestedParams['min-fee']),
      suggestedParams
    });
    const usdcTransfer = transactionMaker.makeAssetPaymentTx({
      accountAddress: escrowAddress,
      toAddress: accountAddress,
      amount: price,
      assetIndex: USDC_ID,
      suggestedParams
    });
    let nftTransfer;
    let txnGroup = [callTx, feeTx, usdcTransfer];
    let signedTxs;
    if (fromEscrow) {
      nftTransfer = transactionMaker.makeAssetPaymentTx({
        accountAddress: escrowAddress,
        toAddress: buyerAddress,
        amount: 1,
        assetIndex: nftId,
        suggestedParams
      });
      txnGroup.push(nftTransfer);
      txnGroup = assignGroupId(txnGroup);
      const signedNFTTransfer = logicSign(lSig, txnGroup[3].getTx(TX_FORMAT.SDK));
      const signedUSDCTransfer = logicSign(lSig, txnGroup[2].getTx(TX_FORMAT.SDK));
      const signedUserTxs = await this.wallet.sign(
        [
          txnGroup[0],
          txnGroup[1]
        ],
        'sell now transaction'
      );
      signedTxs = [signedUserTxs[0], signedUserTxs[1], signedUSDCTransfer, signedNFTTransfer];
    } else {
      nftTransfer = transactionMaker.makeAssetPaymentTx({
        accountAddress: accountAddress,
        toAddress: buyerAddress,
        amount: 1,
        assetIndex: nftId,
        suggestedParams
      });
      txnGroup.push(nftTransfer);
      txnGroup = assignGroupId(txnGroup);
      const signedUSDCTransfer = logicSign(lSig, txnGroup[2].getTx(TX_FORMAT.SDK));
      const signedUserTxs = await this.wallet.sign(
        [
          txnGroup[0],
          txnGroup[1],
          txnGroup[3]
        ],
        'sell now transaction'
      );
      signedTxs = [signedUserTxs[0], signedUserTxs[1], signedUSDCTransfer, signedUserTxs[2]];
    }
    const combinedTxs = combineSignedTxs(signedTxs);
    eventBus.$emit('set-action-message', 'Sending sell now transaction...');
    const response = await internalService.sendOperationTx({
      'blob': btoa(String.fromCharCode.apply(null, combinedTxs)),
      'operation': 'SELL_NOW',
    });
    return {
      operationId: response['operation_id'],
    };
  }

  async createContract(accountAddress, nftId) {
    const suggestedParams = await this.getSuggestedParams();
    eventBus.$emit('set-action-message', 'Creating contract transactions...');
    const proxyProgram = await this.getProxyProgram();
    const lSig = getLogicSign(proxyProgram);
    const proxyAddress = lSig.address();
    const { approvalProgram, params } = await this.getApprovalProgram();
    const clearProgram = await this.getClearProgram();
    const feeTx = await transactionMaker.makeAlgoPaymentTx({
      accountAddress,
      toAddress: proxyAddress,
      amount: 1508000,
      suggestedParams
    });
    await validateTx([feeTx.getTx(TX_FORMAT.Signer)]);
    const appTx = await transactionMaker.makeAppCreateTx({
      from: proxyAddress,
      suggestedParams: suggestedParams,
      approvalProgram: approvalProgram,
      clearProgram: clearProgram,
      numLocalInts: params['num_local_ints'],
      numLocalByteSlices: params['num_local_byte_slices'],
      numGlobalInts: params['num_global_ints'],
      numGlobalByteSlices: params['num_global_byte_slices'],
      appArgs: [
        USDC_ID,
        Number(nftId),
      ],
      appAccounts: [accountAddress],
    });
    const txnGroup = assignGroupId([
      feeTx,
      appTx
    ]);
    const signedAppTx = logicSign(lSig, txnGroup[1].getTx(TX_FORMAT.SDK));
    const signedFeeTx = await this.wallet.sign([txnGroup[0]], 'contract transaction');
    const combinedTxs = combineSignedTxs([signedFeeTx[0], signedAppTx]);
    eventBus.$emit('set-action-message', 'Sending contract transaction...');
    const response = await this.wallet.send({
      ledger: ALGORAND_LEDGER,
      tx: btoa(String.fromCharCode.apply(null, combinedTxs))
    });
    return {
      txId: response['txId'],
      proxyAddress: proxyAddress
    };
  }

  async getProxyProgram() {
    const proxyResponse = await internalService.getCompiledProxy(Math.floor(Math.random() * 2147483647));
    return proxyResponse['result'];
  }

  async getApprovalProgram() {
    const managerResponse = await internalService.getCompiledManager();
    const approvalProgram = managerResponse['result'];
    const params = managerResponse['params'];
    return { approvalProgram, params };
  }

  async getClearProgram() {
    const clearResponse = await internalService.getCompiledClear();
    return clearResponse['result'];
  }

  async optInApp(accountAddress, applicationId) {
    const suggestedParams = await this.getSuggestedParams();
    const optInTxn = transactionMaker.makeOptInTx({
      accountAddress,
      applicationIndex: applicationId,
      suggestedParams
    });
    await validateTx([optInTxn.getTx(TX_FORMAT.Signer)]);
    const signedTx = await this.wallet.sign([optInTxn], 'application opt-in');
    eventBus.$emit('set-action-message', 'Sending application opt-in...');
    return await this.wallet.send({
      ledger: ALGORAND_LEDGER,
      tx: signedTx[0].blob
    });
  }

  async optInAsset(accountAddress, nftId) {
    const suggestedParams = await this.getSuggestedParams();
    const optInTxn = transactionMaker.makeAssetOptInTx({
      accountAddress,
      assetIndex: nftId,
      suggestedParams
    });
    await validateTx([optInTxn.getTx(TX_FORMAT.Signer)]);
    const signedTx = await this.wallet.sign([optInTxn], 'asset opt-in');
    eventBus.$emit('set-action-message', 'Sending asset opt-in...');
    return await this.wallet.send({
      ledger: ALGORAND_LEDGER,
      tx: signedTx[0].blob
    });
  }

  async configureContract(accountAddress, nftId, appId) {
    const suggestedParams = await this.getSuggestedParams();
    eventBus.$emit('set-action-message', 'Creating contract configuration...');
    const escrowProgram = await this.getEscrowProgram(appId, nftId);
    const lSig = getLogicSign(escrowProgram);
    const escrowAddress = lSig.address();
    const feeTx = transactionMaker.makeAlgoPaymentTx({
      accountAddress,
      toAddress: escrowAddress,
      amount: 302000,
      suggestedParams
    });
    let configureTx = transactionMaker.makeCallTx({
      accountAddress, appIndex: appId, appArgs: [CONFIGURE], suggestedParams, appAccounts: [escrowAddress]
    });
    await validateTx(unwrapTxs([feeTx, configureTx], TX_FORMAT.Signer));
    const nftTx = transactionMaker.makeAssetOptInTx({
      accountAddress: escrowAddress,
      assetIndex: nftId,
      suggestedParams
    });
    const usdcTx = transactionMaker.makeAssetOptInTx({
      accountAddress: escrowAddress,
      assetIndex: USDC_ID,
      suggestedParams
    });
    const txnGroup = assignGroupId([
      configureTx,
      feeTx,
      usdcTx,
      nftTx,
    ]);
    const signedUSDCTx = logicSign(lSig, txnGroup[2].getTx(TX_FORMAT.SDK));
    const signedNFTTx = logicSign(lSig, txnGroup[3].getTx(TX_FORMAT.SDK));
    const userSignedTxs = await this.wallet.sign([txnGroup[0], txnGroup[1]], 'contract configuration transaction');
    const combinedTxs = combineSignedTxs([...userSignedTxs, signedUSDCTx, signedNFTTx]);
    eventBus.$emit('set-action-message', 'Sending contract configuration...');
    return await this.wallet.send({
      ledger: ALGORAND_LEDGER,
      tx: btoa(String.fromCharCode.apply(null, combinedTxs))
    });
  }

  static async getApplicationData(ledger, applicationId) {
    return algoExplorer.get(`/v2/applications/${applicationId}`);
  }
}
