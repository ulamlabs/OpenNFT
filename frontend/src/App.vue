<template>
  <div id="app">
    <ActionModal
      v-if="rawStore.pendingUpdate || !!rawStore.pendingAction"
      :message="actionMessage"
    />
    <Navbar />
    <div class="relative w-full">
      <Alert
        v-if="alert.type && !rawStore.pendingAction && !rawStore.pendingUpdate"
        :header="alert.header"
        :message="alert.message"
        :alert-type="alert.type"
      />
    </div>
    <UpdateScheduler />
    <SelectAccountModal v-if="showSelectAccount" />
    <SelectWalletModal v-if="showSelectWallet" />
    <PageContainer>
      <router-view />
    </PageContainer>
    <div class="h-56">
      <Footer />
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { ALGORAND_LEDGER } from './config';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Alert from './components/Alert';
import UpdateScheduler from './components/UpdateScheduler';
import SelectAccountModal from './components/modals/SelectAccountModal';
import SelectWalletModal from './components/modals/SelectWalletModal';
import ActionModal from './components/modals/ActionModal';
import eventBus from './utils/eventBus';
import PageContainer from '@/components/PageContainer';

export default {
  name: 'App',
  components: {
    PageContainer,
    Navbar,
    Footer,
    UpdateScheduler,
    SelectAccountModal,
    SelectWalletModal,
    Alert,
    ActionModal
  },
  data() {
    return {
      showSelectAccount: false,
      showSelectWallet: false,
      alert: {}
    };
  },
  computed: {
    ...mapGetters({
      rawStore: 'algorand/rawStore'
    }),
    actionMessage() {
      if (this.rawStore.pendingAction) {
        if (this.rawStore.pendingActionMessage) {
          return this.rawStore.pendingActionMessage;
        } else {
          return 'Processing action...';
        }
      } else if (this.rawStore.pendingUpdate) {
        return 'Waiting for confirmation...';
      }
      return '';
    }
  },
  mounted() {
    eventBus.$on('open-select-account', this.openSelectAccount);
    eventBus.$on('open-select-wallet', this.openSelectWallet);
    eventBus.$on('close-modals', this.closeModals);
    eventBus.$on('open-alert', this.openAlert);
    eventBus.$on('close-alert', this.closeAlert);
    eventBus.$on('transaction-success', this.onTransactionSuccess);
    eventBus.$on('set-action-message', this.onSetActionMessage);
    this.$store.dispatch('algorand/GET_WALLET_SERVICES');
    this.$store.dispatch('internal/FETCH_CSRF_TOKEN');
  },
  methods: {
    openSelectAccount() {
      this.showSelectAccount = true;
    },
    openSelectWallet() {
      this.showSelectWallet = true;
    },
    closeModals() {
      this.showSelectAccount = false;
      this.showSelectWallet = false;
    },
    closeAlert() {
      this.alert = {};
    },
    openAlert(alert) {
      this.alert = alert;
      this.$forceUpdate();
      window.scrollTo(document.body.scrollWidth, 0);
    },
    onTransactionSuccess(txId) {
      let address;
      if (ALGORAND_LEDGER.toUpperCase() === 'TestNet') {
        address = 'https://testnet.algoexplorer.io/tx/';
      } else {
        address = 'https://testnet.algoexplorer.io/tx/';
      }
      eventBus.$emit('open-alert', {
        type: 'success',
        message: `Transaction has been successfully processed. Click <a href='${address}${txId}' target='_blank' class='underline'>here</a> to preview the transaction.`
      });
    },
    onSetActionMessage(actionMessage) {
      this.$store.commit('algorand/SET_PENDING_ACTION_MESSAGE', actionMessage);
    }
  }
};
</script>
<style>
body {
  background-color: #f9fafb;
}

#app {
  position: relative;
  min-width: 320px;
  min-height: 100vh;
}
</style>
