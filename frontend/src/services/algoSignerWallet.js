import { emitError } from '@/utils/errors';
import eventBus from '@/utils/eventBus';
import { TX_FORMAT, unwrapTxs } from '@/utils/transactions';
import { handleNodeExceptions } from '@/services/base';

export class AlgoSignerWallet {
  constructor(algoSignerWallet) {
    this.algoSignerWallet = algoSignerWallet;
  }

  async blockingCall(func, retry = true) {
    // Ugly but works
    while (this.promise) {
      await this.promise;
    }
    try {
      this.promise = func();
      try {
        return await this.promise;
      } catch (e) {
        if (e.message === 'Another query processing' && retry) {
          return new Promise(resolve => {
            window.setTimeout(
              async () => {
                resolve(await this.blockingCall(func, false));
              }, 500
            );
          });
        } else {
          throw e;
        }
      }
    } finally {
      this.promise = null;
    }
  }

  async connect() {
    try {
      return await this.algoSignerWallet.connect();
    } catch (e) {
      emitError('Could not connect to AlgoSignerWallet');
      throw e;
    }
  }

  // eslint-disable-next-line no-unused-vars
  async sign(txs, description=null, separate=true) {
    try {
      txs = unwrapTxs(txs, TX_FORMAT.Signer);
      const signedTxs = [];
      let count = 1;
      const txsCount = txs.length;
      for (const tx of txs) {
        if (description) {
          if (txsCount > 1) {
            eventBus.$emit('set-action-message', `Signing ${count} of ${txs.length} ${description}s...`);
          } else {
            eventBus.$emit('set-action-message', `Signing ${description}...`);
          }
        }
        signedTxs.push(await this.blockingCall(async () => await this.algoSignerWallet.sign(tx)));
        count += 1;
      }
      return signedTxs;
    } catch (e) {
      emitError('Transaction could not be signed');
      throw e;
    }
  }

  async accounts(params) {
    try {
      return await this.blockingCall(() => this.algoSignerWallet.accounts(params));
    } catch (e) {
      emitError('Could not get information about accounts');
      throw e;
    }
  }

  async algod(params) {
    try {
      return await this.blockingCall(() => this.algoSignerWallet.algod(params));
    } catch (e) {
      emitError('Could not get information from the Algorand blockchain');
      throw e;
    }
  }

  async send(params, showSucess = true) {
    try {
      eventBus.$emit('set-action-message', 'Sending...');
      const tx = await this.blockingCall(async () => await this.algoSignerWallet.send({
        ledger: params.ledger,
        tx: params.tx
      }));
      if (showSucess) {
        eventBus.$emit('transaction-success', tx.txId);
      }
      return tx;
    } catch (e) {
      await handleNodeExceptions(e);
    }
  }
}
