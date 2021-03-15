// Original file: https://github.com/scale-it/algorand-builder/blob/master/examples/crowdfunding/scripts/createApp.js
/* globals module, require */

const { CONFIGURE } = require('../common/constants.js');

const { stringToBytes } = require('@algorand-builder/algob');
const { executeTransaction } = require('@algorand-builder/algob');
const { TransactionType, SignType } = require('@algorand-builder/runtime/build/types.js');

const NFT_ASSET_ID = 14001707;
const USDC_ASSET_ID = 14098899;

async function run (runtimeEnv, deployer) {
  const masterAccount = deployer.accountsByName.get('master');

  // Initialize app arguments
  let appArgs = [`int:${USDC_ASSET_ID}`, `int:${NFT_ASSET_ID}`];

  // Create Application
  // Note: An Account can have maximum of 10 Applications.
  await deployer.ensureCompiled('manager.py', true, {});
  const res = await deployer.deploySSC(
    'manager.py', // approval program
    'clear.py', // clear program
    {
      sender: masterAccount,
      localInts: 1,
      localBytes: 0,
      globalInts: 4,
      globalBytes: 3,
      appArgs: appArgs,
      accounts: [masterAccount.addr]
    },
    {}
  );
  const applicationID = res.appID;

  // Get escrow account address
  const escrowAccount = await deployer.loadLogic('escrow.py', [], {
    app_id: applicationID,
    usdc_id: USDC_ASSET_ID,
    nft_id: NFT_ASSET_ID
  });
  console.log('Escrow Account Address:', escrowAccount.address());

  // Send funds for minimum escrow balance
  const algoTxnParams = {
    type: TransactionType.TransferAlgo,
    sign: SignType.SecretKey,
    fromAccount: masterAccount,
    toAccountAddr: escrowAccount.address(),
    amountMicroAlgos: 302000,
    payFlags: {}
  };
  await executeTransaction(deployer, algoTxnParams);

  console.log('Opting-In For Escrow');
  let txnParams = [
    {
      type: TransactionType.CallNoOpSSC,
      sign: SignType.SecretKey,
      fromAccount: masterAccount,
      appId: applicationID,
      appArgs: [stringToBytes(CONFIGURE)],
      accounts: [escrowAccount.address()],
      payFlags: { totalFee: 1000 }
    },
    {
      type: TransactionType.TransferAsset,
      sign: SignType.LogicSignature,
      fromAccount: { addr: escrowAccount.address() },
      toAccountAddr: escrowAccount.address(),
      lsig: escrowAccount,
      amount: 0,
      assetID: NFT_ASSET_ID,
      payFlags: { totalFee: 1000 }
    },
    {
      type: TransactionType.TransferAsset,
      sign: SignType.LogicSignature,
      fromAccount: { addr: escrowAccount.address() },
      toAccountAddr: escrowAccount.address(),
      lsig: escrowAccount,
      amount: 0,
      assetID: USDC_ASSET_ID,
      payFlags: { totalFee: 1000 }
    }
  ];
  await executeTransaction(deployer, txnParams);
  console.log('Application Is Ready');
}

module.exports = { default: run };
