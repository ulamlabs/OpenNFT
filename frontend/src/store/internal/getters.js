export function isStaff(state) {
  return state.userData['is_staff'] || false;
}

export function isFetched(state) {
  return state.fetchedUserData;
}

export function csrfToken(state) {
  return state.csrfToken;
}
