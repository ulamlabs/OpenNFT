import WalletManager from '@/services/walletManager';
import { ALGORAND_LEDGER } from '@/config';
import { MyAlgoWallet } from '@/services/myAlgoWallet';
import MyAlgo from '@randlabs/myalgo-connect';

export default function() {
  return {
    walletManager: new WalletManager(ALGORAND_LEDGER),
    walletServices: {
      myAlgo: new MyAlgoWallet(new MyAlgo())
    },
    connected: false,
    walletName: localStorage.getItem('wallet'),
    accounts: [],
    fetchedAccounts: false,
    account: localStorage.getItem('account'),
    accountDataCache: {},
    accountData: null,
    currentApplicationId: null,
    applicationDataCache: {},
    // Action queue
    actionQueue: [],
    actionResult: {},
    pendingUpdate: false,
    pendingAction: null,
    pendingActionMessage: null,
    pendingVerificationFunc: null
  };
}
