import { emitError } from '@/utils/errors';
import { InvalidResponse } from '@/services/base';
import { ALGORAND_LEDGER } from '@/config';

export class AlgoExplorer {
  constructor(ledger) {
    if (ledger.toUpperCase() === 'TESTNET') {
      this.url = 'https://api.testnet.algoexplorer.io';
    } else {
      this.url = 'https://api.algoexplorer.io';
    }
  }

  async get(path) {
    try {
      const response = await fetch(`${this.url}${path}`);
      if (response.status !== 200) {
        throw new InvalidResponse(response);
      }
      return await response.json();
    } catch (e) {
      emitError('Could not get information from the Algorand blockchain');
      throw e;
    }
  }

  async post(path, payload, headers={}) {
    try {
      const response = await fetch(`${this.url}${path}`, {
        method: 'POST',
        body: payload,
        headers,
      });
      if (response.status !== 200) {
        throw new InvalidResponse(response);
      }
      return await response.json();
    } catch (e) {
      emitError('Could not broadcast information to the Algorand blockchain');
      throw e;
    }
  }
}

export const algoExplorer = new AlgoExplorer(ALGORAND_LEDGER);
