export function getMappedUserAssets(accountData) {
  const assets = accountData['assets'];
  return Object.assign({}, ...assets.map((value) => {
    return {
      [value['asset-id']]: value
    };
  }));
}

export function getMappedUserCreatedAssets(accountData) {
  const assets = accountData['created-assets'];
  return Object.assign({}, ...assets.map((value) => {
    return {
      [value['index']]: value
    };
  }));
}

export function getMappedGlobalState(applicationData) {
  if (!applicationData || !applicationData['params'] || !applicationData['params']['global-state']) {
    return {};
  }
  const state = applicationData['params']['global-state'];
  return decodeState(state);
}

export function decodeState(state) {
  return Object.assign({}, ...state.map(rawValue => {
    const key = atob(rawValue.key);
    let value;
    if (rawValue.value.type === 1) {
      value = rawValue.value.bytes;
    } else if (rawValue.value.type === 2) {
      value = Number(rawValue.value.uint);
    }
    return {
      [key]: value
    };
  }));
}

export function getMappedUserStates(accountData) {
  const appStates = accountData['apps-local-state'];
  return Object.assign({}, ...appStates.map(value => {
    return {
      [value.id]: getMappedUserState(value)
    };
  }));
}

function getMappedUserState(state) {
  if (!state) {
    return {};
  }
  const keyValues = state['key-value'];
  return decodeState(keyValues);
}
