import { emitError } from '@/utils/errors';
import { InvalidResponse } from '@/services/base';
import store from '@/store/index';
import { NeedsToRetry, retryWhenNeeded } from '@/utils/retry';
import { BACKEND_URL } from '@/config';

class InternalService {
  constructor() {
    this.url = BACKEND_URL;
  }

  async getCompiledProxy(proxyId) {
    return await this.retryingPost('/api/contracts/compile_proxy/', JSON.stringify({
      proxy_id: proxyId
    }), {
      'Content-Type': 'application/json'
    });
  }

  async getCompiledClear() {
    return await this.retryingPost('/api/contracts/compile_clear/', null, {
      'Content-Type': 'application/json'
    });
  }

  async getCompiledManager() {
    return await this.retryingPost('/api/contracts/compile_manager/', null, {
      'Content-Type': 'application/json'
    });
  }

  async getCompiledEscrow(appId, usdcId, nftId) {
    return await this.retryingPost('/api/contracts/compile_escrow/', JSON.stringify({
      app_id: appId,
      usdc_id: usdcId,
      nft_id: nftId
    }), {
      'Content-Type': 'application/json'
    });
  }

  async getAsset(guid) {
    return await this.get(`/api/assets/${guid}/`);
  }

  async getUser(address) {
    return await this.get(`/api/users/${address}/`, {}, {}, false);
  }

  async getAssets(params={}) {
    return await this.get('/api/assets/', {}, params);
  }

  async getOperations(params={}) {
    return await this.get('/api/operations/', {}, params);
  }

  async getOperation(operationId) {
    return await this.get(`/api/operations/${operationId}`);
  }

  async getCsrfToken(params={}) {
    return await this.get('/api/token/', {}, params);
  }

  async validateAsset(data) {
    const formData = new FormData();
    for (const key in data) {
      formData.append(key, data[key]);
    }
    return await this.post('/api/assets/validate_asset/', formData, {}, {}, false);
  }

  async sendOperationTx(data) {
    return await this.retryingPost('/api/operations/send_tx/', JSON.stringify(data), {
      'Content-Type': 'application/json'
    });
  }

  async submitContract(data) {
    return await this.retryingPost('/api/contracts/submit_contract/', JSON.stringify(data), {
      'Content-Type': 'application/json'
    });
  }

  async submitConfiguration(data) {
    return await this.retryingPost('/api/contracts/submit_configuration/', JSON.stringify(data), {
      'Content-Type': 'application/json'
    });
  }

  async submitAsset(data) {
    const formData = new FormData();
    for (const key in data) {
      formData.append(key, data[key]);
    }
    return await this.retryingPost('/api/assets/submit_asset/', formData, {});
  }

  getDefaultHeaders() {
    if (store.getters['algorand/account']) {
      return {
        'X-View-As': store.getters['algorand/account']
      };
    } else {
      return {};
    }
  }

  async get(path, headers={}, params={}, throwExceptions=true) {
    try {
      return await this.baseRequest('GET', path, undefined, headers, params, throwExceptions);
    } catch (e) {
      emitError('Could not get information from internal service');
      throw e;
    }
  }

  async addCsrfToken(headers) {
    let csrfToken = store.getters['internal/csrfToken'];
    if (!csrfToken) {
      await this.store.dispatch('internal/FETCH_CSRF_TOKEN');
      csrfToken = store.getters['internal/csrfToken'];
    }
    return Object.assign({}, headers, {
      'X-CSRFToken': csrfToken
    });
  }

  async retryingPost(path, payload, headers={}, params={}, throwExceptions=true) {
    try {
      return await retryWhenNeeded(async () => {
        return await this.baseRequest('POST', path, payload, await this.addCsrfToken(headers), params, throwExceptions);
      });
    } catch (e) {
      emitError('Could not broadcast information to internal service');
      throw e;
    }
  }

  async post(path, payload, headers={}, params={}, throwExceptions=true) {
    try {
      return await this.baseRequest('POST', path, payload, await this.addCsrfToken(headers), params, throwExceptions);
    } catch (e) {
      emitError('Could not broadcast information to internal service');
      throw e;
    }
  }

  async baseRequest(method, path, payload, headers={}, params={}, throwExceptions=true) {
    let fullPath = `${this.url}${path}`;
    if (Object.keys(params).length > 0) {
      fullPath = `${fullPath}?${new URLSearchParams(params).toString()}`;
    }
    const response = await fetch(fullPath, {
      method: method,
      body: payload,
      mode: 'cors',
      headers: Object.assign({}, this.getDefaultHeaders(), headers)
    });
    return await this.processResponse(response, throwExceptions);
  }

  async processResponse(response, throwExceptions) {
    let responseJson;
    try {
      responseJson = await response.json();
    } catch(e) {
      if (response.status === 500) {
        throw new NeedsToRetry();
      } else if (response.status !== 200 && response.status !== 201 && throwExceptions) {
        throw new InvalidResponse(response);
      }
      return;
    }
    if (responseJson && responseJson.retry) {
      throw new NeedsToRetry();
    } else if (response.status !== 200 && response.status !== 201 && throwExceptions) {
      throw new InvalidResponse(response);
    }
    return responseJson;
  }
}

export const internalService = new InternalService();
