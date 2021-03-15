import Vue from 'vue';

export function SET_SERVICE_INSTANCE(state, instance) {
  state.walletManager = instance;
}

export function SET_CONNECTED(state, isConnected) {
  state.connected = isConnected;
}

export function SET_ACCOUNTS(state, accounts) {
  state.accounts = accounts;
  state.fetchedAccounts = true;
}

export function SET_ACCOUNT(state, account) {
  state.account = account;
  if (account) {
    localStorage.setItem('account', account);
  } else {
    localStorage.removeItem('account');
  }
}

export function SET_CURRENT_ACCOUNT_DATA(state, accountData) {
  state.accountData = accountData;
}

export function SET_CURRENT_APPLICATION_ID(state, applicationId) {
  state.currentApplicationId = applicationId;
}

export function CACHE_ACCOUNT_DATA(state, { accountAddress, accountData }) {
  Vue.set(state.accountDataCache, accountAddress, accountData);
}

export function CACHE_APPLICATION_DATA(state, { applicationIndex, applicationData }) {
  Vue.set(state.applicationDataCache, applicationIndex, applicationData);
}

export function SET_PENDING_UPDATE(state, pendingUpdate) {
  state.pendingUpdate = pendingUpdate;
}

export function SET_PENDING_ACTION(state, pendingAction) {
  state.pendingAction = pendingAction;
}

export function SET_ACTION_RESULT(state, actionResult) {
  state.actionResult = actionResult;
}

export function SET_PENDING_VERIFICATION_FUNC(state, verificationFunc) {
  state.pendingVerificationFunc = verificationFunc;
}

export function SET_PENDING_ACTION_MESSAGE(state, pendingActionMessage) {
  state.pendingActionMessage = pendingActionMessage;
}

export function SET_ACTION_QUEUE(state, queue) {
  state.actionQueue = queue;
}

export function ADD_WALLET_SERVICE(state, { walletName, walletService }) {
  Vue.set(state.walletServices, walletName, walletService);
}

export function SET_WALLET_NAME(state, walletName) {
  state.walletName = walletName;
  if (walletName) {
    localStorage.setItem('wallet', walletName);
  } else {
    localStorage.removeItem('wallet');
  }
}
