import {
  getMappedGlobalState,
  getMappedUserAssets,
  getMappedUserCreatedAssets,
  getMappedUserStates
} from '@/utils/format';

export function rawStore(state) {
  return {
    walletManager: state.walletManager,
    connected: state.connected,
    accounts: state.accounts,
    account: state.account,
    accountData: state.accountData,
    accountDataCache: state.accountData,
    fetchedAccounts: state.fetchedAccounts,
    currentApplicationId: state.currentApplicationId,
    applicationDataCache: state.applicationDataCache,
    walletServices: state.walletServices,
    walletName: state.walletName,
    // Action queue
    pendingAction: state.pendingAction,
    pendingActionMessage: state.pendingActionMessage,
    pendingUpdate: state.pendingUpdate,
    actionResult: state.actionResult
  };
}

export function account(state) {
  return state.account;
}

export function userStates(state) {
  if (!state.accountData) {
    return {};
  }
  return getMappedUserStates(state.accountData);
}

export function userAssets(state) {
  if (!state.accountData) {
    return {};
  }
  return getMappedUserAssets(state.accountData);
}

export function userCreatedAssets(state) {
  if (!state.accountData) {
    return {};
  }
  return getMappedUserCreatedAssets(state.accountData);
}

export function accounts(state) {
  if (!state.accounts) {
    return [];
  }
  return state.accounts.map((value) => {
    return value.address;
  });
}

export function isReady(state) {
  return state.account && state.accountData;
}

export function isReadyToTransact(state) {
  return state.account && state.accountData && !state.pendingUpdate;
}

export function algoBalance(state) {
  if (!state.accountData) {
    return 0;
  }
  const amount = state.accountData['amount-without-pending-rewards'];
  if (!amount) {
    return 0;
  }
  return amount;
}

export function assetBalances(state, getters) {
  if (!state.accountData) {
    return {};
  }
  let balances = {};
  Object.keys(getters.userAssets).forEach((assetIndex) => {
    let userAsset = getters.userAssets[assetIndex];
    balances[assetIndex] = userAsset.amount;
  });
  return balances;
}

export function applicationData(state) {
  if (!state.currentApplicationId) {
    return {};
  }
  if(!state.applicationDataCache[state.currentApplicationId]) {
    return {};
  }
  return getMappedGlobalState(state.applicationDataCache[state.currentApplicationId]);
}
