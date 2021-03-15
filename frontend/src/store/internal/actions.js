import { internalService } from '@/services/internal';

export async function FETCH_USER_DATA({ commit }, { accountAddress }) {
  try {
    const userData = await internalService.getUser(accountAddress);
    await commit('SET_USER_DATA', userData);
    await commit('SET_FETCHED_USER_DATA', true);
  } catch (e) {
    await commit('SET_USER_DATA', {});
    await commit('SET_FETCHED_USER_DATA', true);
    throw e;
  }
}

export async function FETCH_CSRF_TOKEN({ commit }) {
  try {
    const response = await internalService.getCsrfToken();
    await commit('SET_CSRF_TOKEN', response['token']);
  } catch (e) {
    await commit('SET_CSRF_TOKEN', '');
    throw e;
  }
}
