/* global AlgoSigner:readonly */

import { isEqual } from 'lodash';
import { AlgoSignerWallet } from '@/services/algoSignerWallet';
import WalletManager from '@/services/walletManager';
import { ALGORAND_LEDGER } from '@/config';

export async function GET_WALLET_SERVICES({ commit, state, dispatch }) {
  if (typeof AlgoSigner !== 'undefined') {
    commit('ADD_WALLET_SERVICE', {
      walletName: 'algoSigner',
      walletService: new AlgoSignerWallet(AlgoSigner)
    });
    if (state.account && state.walletName === 'algoSigner') {
      await dispatch('CONNECT_TO_ALGOSIGNER');
    }
  } else {
    window.setTimeout(() => dispatch('GET_WALLET_SERVICES'), 5000);
  }
}

export async function CONNECT_TO_ALGOSIGNER({ commit, state, dispatch }) {
  if (state.walletServices['algoSigner']) {
    const walletManager = state.walletManager;
    await walletManager.setWallet(state.walletServices['algoSigner']);
    await walletManager.connect();
    await commit('SET_WALLET_NAME', 'algoSigner');
    await commit('SET_CONNECTED', true);
    const accountAddress = state.account;
    dispatch('FETCH_ACCOUNTS');
    if (accountAddress && state.account) {
      dispatch('FETCH_ACCOUNT_DATA', { accountAddress });
      await dispatch('internal/FETCH_USER_DATA', { accountAddress }, { root: true });
    }
  } else {
    commit('SET_CONNECTED', false);
  }
}

export async function CONNECT_TO_MYALGO({ commit, state, dispatch }) {
  if (state.walletServices['myAlgo']) {
    const walletManager = state.walletManager;
    await walletManager.setWallet(state.walletServices['myAlgo']);
    await walletManager.connect();
    await commit('SET_WALLET_NAME', 'myAlgo');
    await commit('SET_CONNECTED', true);
    const accountAddress = state.account;
    dispatch('FETCH_ACCOUNTS');
    if (accountAddress && state.account) {
      dispatch('FETCH_ACCOUNT_DATA', { accountAddress });
      await dispatch('internal/FETCH_USER_DATA', { accountAddress }, { root: true });
    }
  } else {
    commit('SET_CONNECTED', false);
  }
}

export async function DISCONNECT({ commit }) {
  await commit('SET_CONNECTED', false);
  await commit('SET_ACCOUNT', null);
  await commit('SET_WALLET_NAME', null);
  await commit('SET_CURRENT_ACCOUNT_DATA', null);
}

export async function SELECT_ACCOUNT({ commit, state, dispatch }, { accountAddress }) {
  const accountIds = state.accounts.map(value => value.address);
  if (accountIds.indexOf(accountAddress) === -1) {
    return;
  }
  await commit('SET_ACCOUNT', accountAddress);
  await dispatch('FETCH_ACCOUNT_DATA', { accountAddress });
  await dispatch('internal/FETCH_USER_DATA', { accountAddress }, { root: true });
}

export async function FETCH_ACCOUNTS({ commit, state, dispatch }) {
  if (!state.connected) {
    return;
  }
  const accounts = await state.walletManager.getAccounts();
  await commit('SET_ACCOUNTS', accounts);

  const accountIds = state.accounts.map(value => value.address);
  if (!state.account && accounts.length > 0) {
    await dispatch('SELECT_ACCOUNT', { accountAddress: accounts[0].address });
  } else if (state.account && accountIds.indexOf(state.account) === -1) {
    await commit('SET_ACCOUNT', null);
    await commit('SET_WALLET_NAME', null);
  }
}

export async function FETCH_ACCOUNT_DATA({ commit, state, dispatch }, { customAddress=null }) {
  let address = customAddress;
  if (!address) {
    address = state.account;
  }
  if (!address) {
    return;
  }
  let accountData;
  try {
    accountData = await state.walletManager.getAccountData(address);
  } catch (e) {
    dispatch('FETCH_ACCOUNTS');
    return;
  }
  if (customAddress) {
    await commit('CACHE_ACCOUNT_DATA', {
      accountAddress: address,
      accountData
    });
  } else {
    await commit('SET_CURRENT_ACCOUNT_DATA', accountData);
    await commit('CACHE_ACCOUNT_DATA', {
      accountAddress: address,
      accountData
    });
  }
}

export async function FETCH_APPLICATION_DATA({ commit }, { appId }) {
  await commit('SET_CURRENT_APPLICATION_ID', appId);
  const applicationData = await WalletManager.getApplicationData(ALGORAND_LEDGER, appId);
  await commit('CACHE_APPLICATION_DATA', {
    applicationIndex: appId,
    applicationData: {
      ...applicationData,
      fetchDate: new Date()
    }
  });
}

async function defaultVerificationFunc({ dispatch, getters }) {
  const prevState = Object.assign({}, getters.userState);
  const prevAssets = Object.assign({}, getters.userAssets);

  await dispatch('FETCH_ACCOUNT_DATA', {});

  const newState = getters.userState;
  const newAssets = getters.userAssets;
  if (!isEqual(prevState, newState)) {
    return true;
  } else if (!isEqual(prevAssets, newAssets)) {
    return true;
  }
  return false;
}

export async function RUN_VERIFICATION_FUNC({ commit, dispatch, state, getters }) {
  if (state.pendingUpdate && state.pendingVerificationFunc) {
    const verified = await state.pendingVerificationFunc({ commit, dispatch, state, getters });
    if (verified) {
      commit('SET_PENDING_UPDATE', false);
      commit('SET_PENDING_VERIFICATION_FUNC', null);
      if (state.actionQueue.length > 0) {
        dispatch('EXECUTE_PENDING_ACTION');
      }
    }
  }
}

export async function QUEUE_ACTION({ commit, dispatch, state }, {
  actionMethod,
  actionMessage = null,
  actionVerificationMethod = null,
  requiresVerification = true,
  backgroundAction = false
}) {
  let queue = Object.assign([], state.actionQueue);
  queue.push({ actionMethod, actionMessage, actionVerificationMethod, backgroundAction, requiresVerification });
  await commit('SET_ACTION_QUEUE', queue);
  if (state.actionQueue.length === 1) {
    dispatch('EXECUTE_PENDING_ACTION');
  }
}

export async function EXECUTE_PENDING_ACTION({ state, dispatch, commit }) {
  if (state.actionQueue.length === 0 || state.pendingAction || state.pendingUpdate) {
    return;
  }
  let queue = Object.assign([], state.actionQueue);
  const { actionMethod, actionVerificationMethod, actionMessage, backgroundAction, requiresVerification } = queue.shift();
  await commit('SET_ACTION_QUEUE', queue);
  if (backgroundAction) {
    actionMethod();
    dispatch('EXECUTE_PENDING_ACTION');
    return;
  }
  try {
    if (actionVerificationMethod) {
      await commit('SET_PENDING_VERIFICATION_FUNC', actionVerificationMethod);
    } else {
      await commit('SET_PENDING_VERIFICATION_FUNC', defaultVerificationFunc);
    }
    await commit('SET_PENDING_ACTION', true);
    await commit('SET_PENDING_ACTION_MESSAGE', actionMessage);
    const result = await actionMethod();
    await commit('SET_ACTION_RESULT', result);
    if (requiresVerification) {
      await commit('SET_PENDING_UPDATE', true);
    }
    await commit('SET_PENDING_ACTION', false);
    dispatch('FETCH_ACCOUNT_DATA', {});
    return result;
  } catch (e) {
    commit('SET_PENDING_UPDATE', false);
    commit('SET_PENDING_ACTION', false);
    commit('SET_PENDING_ACTION_MESSAGE', null);
    commit('SET_ACTION_QUEUE', []);
    throw e;
  } finally {
    commit('SET_PENDING_ACTION', false);
    commit('SET_PENDING_ACTION_MESSAGE', null);
  }
}
