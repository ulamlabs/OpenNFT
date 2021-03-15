import { Buffer } from 'buffer';
import { cloneDeep } from 'lodash';
import algosdk from 'algosdk';
import { base64ToUint8Array, encodeArrayForSDK, encodeArrayForSigner } from '@/utils/encoding';
import { uuid } from 'uuidv4';


export const TX_FORMAT = {
  SDK: 'SDK',
  Signer: 'Signer',
  MyAlgo: 'MyAlgo'
};

function NotImplementedError() {
  return new Error('Not Implemented');
}

NotImplementedError.prototype = Object.create(Error.prototype);

function InvalidTxFormatError() {
  return new Error('Invalid TX Format');
}

InvalidTxFormatError.prototype = Object.create(Error.prototype);

function InvalidTxTypeError() {
  return new Error('Invalid TX Format');
}

InvalidTxTypeError.prototype = Object.create(Error.prototype);

class TransactionWrapper {
  constructor(params) {
    this.params = params;
  }

  getTx(format) {
    let rawTx = Object.assign({}, this.params);
    if (format === TX_FORMAT.Signer) {
      return convertToSignerFormat(rawTx);
    } else if (format === TX_FORMAT.SDK) {
      return convertToSDKFormat(rawTx);
    } else if (format === TX_FORMAT.MyAlgo) {
      return convertToMyAlgoFormat(rawTx);
    } else {
      throw new InvalidTxFormatError();
    }
  }
}

export function unwrapTxs(txs, format=TX_FORMAT.Signer) {
  return txs.map((tx) => tx.getTx(format));
}

function convertToSDKFormat(rawTx) {
  return {
    ...rawTx,
    appArgs: rawTx.appArgs ? encodeArrayForSDK(rawTx.appArgs) : rawTx.appArgs,
  };
}

function convertToSignerFormat(rawTx) {
  return {
    ...rawTx,
    appArgs: rawTx.appArgs ? encodeArrayForSigner(rawTx.appArgs) : rawTx.appArgs,
    group: rawTx.group ? rawTx.group.toString('base64') : rawTx.group
  };
}

function convertToMyAlgoFormat(rawTx) {
  return {
    ...rawTx,
    appArgs: rawTx.appArgs ? encodeArrayForSigner(rawTx.appArgs) : [],
  };
}

export function assignGroupId(txns) {
  const newTxs = cloneDeep(txns);
  const sdkTxs = txns.map((txn) => {
    return {
      ...txn.getTx(TX_FORMAT.SDK)
    };
  });
  const groupId = algosdk.computeGroupID(cloneDeep(sdkTxs));
  for (const txn of newTxs) {
    txn.params['group'] = groupId;
  }
  return newTxs;
}

export class TransactionMaker {
  constructor() {
  }

  makeAssetCreateTx({ from, note, unitName, assetName, assetURL, assetMetadataHash, suggestedParams }) {
    const params = {
      from: from,
      fee: suggestedParams['min-fee'],
      firstRound: suggestedParams['last-round'],
      lastRound: suggestedParams['last-round'] + 1000,
      note: encodeArrayForSigner([note])[0],
      genesisID: suggestedParams['genesis-id'],
      genesisHash: suggestedParams['genesis-hash'],
      assetTotal: 1,
      assetDecimals: 0,
      assetDefaultFrozen: false,
      assetManager: from,
      assetReserve: from,
      assetFreeze: from,
      assetClawback: from,
      assetUnitName: unitName,
      assetName: assetName,
      assetURL: assetURL,
      assetMetadataHash: assetMetadataHash,
      type: 'acfg',
      flatFee: true
    };
    return new TransactionWrapper(params);
  }

  makeOptInTx({ accountAddress, applicationIndex, suggestedParams }) {
    const params = {
      from: accountAddress,
      type: 'appl',
      fee: suggestedParams['min-fee'],
      firstRound: suggestedParams['last-round'],
      lastRound: suggestedParams['last-round'] + 1000,
      genesisID: suggestedParams['genesis-id'],
      genesisHash: suggestedParams['genesis-hash'],
      flatFee: true,
      appIndex: applicationIndex,
      appOnComplete: 1 // OptInOC
    };
    return new TransactionWrapper(params);
  }

  makeCallTx({ accountAddress, appIndex, appArgs, appAccounts=undefined, suggestedParams }) {
    const params = {
      from: accountAddress,
      type: 'appl',
      fee: suggestedParams['min-fee'],
      firstRound: suggestedParams['last-round'],
      lastRound: suggestedParams['last-round'] + 1000,
      genesisID: suggestedParams['genesis-id'],
      genesisHash: suggestedParams['genesis-hash'],
      flatFee: true,
      appIndex: appIndex,
      appArgs: appArgs,
      appAccounts: appAccounts,
      appOnComplete: 0
    };
    return new TransactionWrapper(params);
  }

  makeAppCreateTx({
    from,
    suggestedParams,
    approvalProgram,
    clearProgram,
    numLocalInts,
    numLocalByteSlices,
    numGlobalInts,
    numGlobalByteSlices,
    appArgs,
    appAccounts,
    reKeyTo=undefined
  }) {
    const accounts = cloneDeep(appAccounts);
    const params = algosdk.makeApplicationCreateTxn(
      from,
      convertParamsToSDKFormat(suggestedParams),
      algosdk.OnApplicationComplete.NoOpOC,
      base64ToUint8Array(approvalProgram),
      base64ToUint8Array(clearProgram),
      numLocalInts,
      numLocalByteSlices,
      numGlobalInts,
      numGlobalByteSlices,
      encodeArrayForSDK(appArgs),
      [...appAccounts],
      undefined,
      undefined,
      undefined,
      encodeArrayForSDK([uuid().replaceAll('-', '')])[0],
      reKeyTo
    );
    return new TransactionWrapper({
      ...params,
      appAccounts: accounts,
      appArgs: appArgs,
      from: from,
      flatFee: true
    });
  }

  makeAlgoPaymentTx({ accountAddress, toAddress, amount, suggestedParams }) {
    const params = {
      type: 'pay',
      from: accountAddress,
      to: toAddress,
      fee: suggestedParams['min-fee'],
      firstRound: suggestedParams['last-round'],
      lastRound: suggestedParams['last-round'] + 1000,
      genesisID: suggestedParams['genesis-id'],
      genesisHash: suggestedParams['genesis-hash'],
      flatFee: true,
      amount: Number(amount)
    };
    return new TransactionWrapper(params);
  }

  makeAssetOptInTx({ accountAddress, assetIndex, suggestedParams }) {
    return this.makeAssetPaymentTx({
      accountAddress,
      toAddress: accountAddress,
      amount: 0,
      assetIndex,
      suggestedParams
    });
  }

  makeAssetPaymentTx({ accountAddress, toAddress, amount, assetIndex, suggestedParams }) {
    const params = {
      type: 'axfer',
      from: accountAddress,
      to: toAddress,
      fee: suggestedParams['min-fee'],
      firstRound: suggestedParams['last-round'],
      lastRound: suggestedParams['last-round'] + 1000,
      genesisID: suggestedParams['genesis-id'],
      genesisHash: suggestedParams['genesis-hash'],
      flatFee: true,
      amount: Number(amount),
      assetIndex: assetIndex
    };
    return new TransactionWrapper(params);
  }
}

function convertParamsToSDKFormat(suggestedParams) {
  return {
    consensusVersion: suggestedParams['consensus-version'],
    fee: suggestedParams['fee'],
    genesisHash: suggestedParams['genesis-hash'],
    genesisID: suggestedParams['genesis-id'],
    firstRound: suggestedParams['last-round'],
    lastRound: suggestedParams['last-round'] + 1000,
    flatFee: true,
    minFee: suggestedParams['min-fee']
  };
}

export function combineSignedTxs(txs) {
  const decodedTxs = txs.map((tx) => {
    if (tx.blob instanceof Uint8Array) {
      return tx.blob;
    } else {
      return base64ToUint8Array(tx.blob);
    }
  });
  const totalLength = decodedTxs.reduce((previousValue, currentValue) => {
    return previousValue + currentValue.byteLength;
  }, 0);
  const combinedTxs = new Uint8Array(totalLength);
  let byteLength = 0;
  for (let tx=0; tx < decodedTxs.length; tx++) {
    combinedTxs.set(new Uint8Array(decodedTxs[tx]), byteLength);
    byteLength += decodedTxs[tx].byteLength;
  }
  return combinedTxs;
}

export function getLogicSign(compiledContract) {
  const program = new Uint8Array(Buffer.from(compiledContract, 'base64'));
  return algosdk.makeLogicSig(program, []);
}

export function logicSign(lSig, tx) {
  // Wasted a lot of time on this algosdk quirk...
  const txObj = new algosdk.Transaction(tx);
  txObj.group = tx.group;
  return algosdk.signLogicSigTransactionObject(txObj, lSig);
}

export const transactionMaker = new TransactionMaker();
