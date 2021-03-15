import { SignType, TransactionType } from '@algorand-builder/runtime/build/types.js';

export function setupAssets(runtime, account) {
  return {
    NFTAssetId: setupNFTAsset(runtime, account),
    USDCAssetId: setupUSDCAsset(runtime, account),
  };
}

function setupNFTAsset(runtime, account) {
  account.addAsset(111, 'NFT', {
    creator: 'addr-1',
    total: 10000000,
    decimals: 10,
    defaultFrozen: false,
    unitName: 'ASSET',
    name: 'ASSET',
    url: 'assetUrl',
    metadataHash: 'hash',
    manager: 'addr-1',
    reserve: 'addr-2',
    freeze: 'addr-3',
    clawback: 'addr-4'
  });
  runtime.store.assetDefs.set(111, account.address);
  return 111;
}

function setupUSDCAsset(runtime, account) {
  account.addAsset(123, 'USDC', {
    creator: 'addr-1',
    total: 10000000,
    decimals: 10,
    defaultFrozen: false,
    unitName: 'ASSET',
    name: 'ASSET',
    url: 'assetUrl',
    metadataHash: 'hash',
    manager: 'addr-1',
    reserve: 'addr-2',
    freeze: 'addr-3',
    clawback: 'addr-4'
  });
  runtime.store.assetDefs.set(123, account.address);
  return 123;
}

export function fundAccounts(runtime, fundingAccount, accounts, assets) {
  function fund(assetId, account) {
    runtime.optIntoASA(assetId, account.address, {});
    let tx = [
      {
        type: TransactionType.TransferAsset,
        assetID: assetId,
        sign: SignType.SecretKey,
        fromAccount: fundingAccount.account,
        toAccountAddr: account.address,
        amount: 1000000,
        payFlags: {
          totalFee: 1000
        }
      }
    ];
    runtime.executeTx(tx);
  }
  accounts.forEach((account) => {
    Object.keys(assets).forEach((key) => {
      fund(assets[key], account);
    });
  });
}
