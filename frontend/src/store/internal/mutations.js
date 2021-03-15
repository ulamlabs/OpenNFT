export function SET_USER_DATA(state, userData) {
  state.userData = userData;
}

export function SET_CSRF_TOKEN(state, csrfToken) {
  state.csrfToken = csrfToken;
}

export function SET_FETCHED_USER_DATA(state, fetchedUserData) {
  state.fetchedUserData = fetchedUserData;
}
