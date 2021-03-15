import store from '@/store';
import eventBus from '@/utils/eventBus';

function InsufficientFunds() {
  return new Error('Insufficient Funds');
}

InsufficientFunds.prototype = Object.create(Error.prototype);

export async function validateTx(txs) {
  await store.dispatch('algorand/FETCH_ACCOUNT_DATA', {});
  const algoSpending = countAlgoSpending(txs);
  await validateAlgoBalance(algoSpending);

  const assetSpendings = countAssetSpending(txs);
  await validateAssetBalances(assetSpendings);
}

export function validateAlgoBalance(algoSpending, throwException=true) {
  if (algoSpending > getAlgoBalance()) {
    if (!throwException) {
      return false;
    }
    emitInsufficientFundsError();
    throw InsufficientFunds();
  }
  return true;
}

export function validateAssetBalances(assetSpendings, throwException=true) {
  const assetBalances = getAssetBalances();
  for (let assetIndex of Object.keys(assetSpendings)) {
    let assetSpending = assetSpendings[assetIndex];
    if (!assetBalances[assetIndex] || assetSpending > assetBalances[assetIndex]) {
      if (!throwException) {
        return false;
      }
      emitInsufficientFundsError();
      throw InsufficientFunds();
    }
  }
  return true;
}

function emitInsufficientFundsError() {
  eventBus.$emit('open-alert', {
    type: 'error',
    message: 'Insufficient funds'
  });
}

function getAlgoBalance() {
  return store.getters['algorand/algoBalance'];
}

function getAssetBalances() {
  return store.getters['algorand/assetBalances'];
}

function getAccountAddress() {
  return store.getters['algorand/rawStore'].account;
}

function countAlgoSpending(txs) {
  let totalSpending = 0;
  txs.forEach((tx) => {
    if (tx.from !== getAccountAddress()) {
      return;
    }
    totalSpending += tx.fee;
    if (tx.amount && tx.type !== 'axfer') {
      totalSpending += tx.amount;
    }
  });
  return totalSpending;
}

function countAssetSpending(txs) {
  let spending = {};
  txs.forEach((tx) => {
    if (tx.from !== getAccountAddress()) {
      return;
    }
    if (tx.amount && tx.type === 'axfer') {
      if (!spending[tx.assetIndex]) {
        spending[tx.assetIndex] = 0;
      }
      spending[tx.assetIndex] += tx.amount;
    }
  });
  return spending;
}
