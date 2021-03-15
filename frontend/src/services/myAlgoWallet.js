import { emitError } from '@/utils/errors';
import eventBus from '@/utils/eventBus';
import MyAlgo from '@randlabs/myalgo-connect';
import { algoExplorer } from '@/services/algoExplorer';
import { base64ToUint8Array, Uint8ArrayToBase64 } from '@/utils/encoding';
import { TX_FORMAT, unwrapTxs } from '@/utils/transactions';
import { handleNodeExceptions } from '@/services/base';

function NoAccounts() {
  return new Error('No accounts');
}

NoAccounts.prototype = Object.create(Error.prototype);

export class MyAlgoWallet {
  constructor() {
    this.myAlgoWallet = new MyAlgo();
    this.accountList = [];
  }

  async connect() {
    try {
      this.accountList = await this.myAlgoWallet.connect();
    } catch (e) {
      emitError('Could not connect to myAlgo');
      throw e;
    }
  }

  async sign(txs, description=null, separate=false) {
    try {
      const txsCount = txs.length;
      if (description) {
        if (txsCount > 1) {
          eventBus.$emit('set-action-message', `Signing ${description}...`);
        } else {
          eventBus.$emit('set-action-message', `Signing ${description}s...`);
        }
      }
      let signedTxs = [];

      if (separate && txsCount > 1) {
        let count = 1;
        for (const tx of txs) {
          eventBus.$emit('set-action-message', `Signing ${count} of ${txs.length} ${description}s...`);
          signedTxs.push((await this.sign([tx]))[0]);
          count += 1;
        }
        return signedTxs;
      }
      txs = unwrapTxs(txs, TX_FORMAT.MyAlgo);

      signedTxs = await this.myAlgoWallet.signTransaction(txs.length === 1 ? txs[0] : txs);
      if (signedTxs.constructor === Object)
      {
        return [{
          blob: Uint8ArrayToBase64(signedTxs.blob)
        }];
      } else {
        return signedTxs.map((tx) => {
          tx.blob = Uint8ArrayToBase64(tx.blob);
          return tx;
        });
      }
    } catch (e) {
      if (e.message === 'Can not open popup window - blocked') {
        emitError('Your browser is blocking the pop-up windows on this site. Please adjust your browser settings');
      } else {
        emitError('Transactions could not be signed');
      }
      throw e;
    }
  }

  // eslint-disable-next-line no-unused-vars
  async accounts(params) {
    if (this.accountList.length > 0) {
      return this.accountList;
    } else {
      emitError('Could not get information about accounts');
      throw new NoAccounts();
    }
  }

  async algod(params) {
    try {
      return algoExplorer.get(params.path);
    } catch (e) {
      emitError('Could not get information from the Algorand blockchain');
      throw e;
    }
  }

  async send(params, showSucess = true) {
    try {
      eventBus.$emit('set-action-message', 'Sending...');
      const tx = await algoExplorer.post('/v2/transactions', base64ToUint8Array(params.tx), {
        'Content-Type': 'application/x-binary'
      });
      if (showSucess) {
        eventBus.$emit('transaction-success', tx.txId);
      }
      return tx;
    } catch (e) {
      try {
        e.message = (await e.response.json())['message'];
      } finally {
        await handleNodeExceptions(e);
      }
    }
  }
}
