<template>
  <ModalWrapper>
    <div
      class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-headline"
    >
      <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
        <div>
          <div>
            <t-button
              classes="block tracking-widest border-2 rounded-lg focus:border-indigo-700 hover:border-indigo-600 focus:outline-none	w-full uppercase text-center text-black bg-white text-xs py-3 px-10 disabled:opacity-50 disabled:cursor-not-allowed"
              @click="connectToMyAlgo"
            >
              MyAlgo Wallet
            </t-button>
            <t-button
              :classes="algoSignerClasses"
              @click="connectToAlgoSigner"
            >
              AlgoSigner
            </t-button>
          </div>
        </div>
      </div>
      <div class="px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse justify-center">
        <cancel-modal-button
          type="button"
          @click="onClose"
        >
          Cancel
        </cancel-modal-button>
      </div>
    </div>
  </ModalWrapper>
</template>
<script>
import eventBus from '@/utils/eventBus';
import { mapGetters } from 'vuex';
import ModalWrapper from '@/components/modals/ModalWrapper';

export default {
  name: 'SelectAccountModal',
  components: { ModalWrapper },
  data() {
    return {
      selectedAccount: null
    };
  },
  computed: {
    ...mapGetters({
      rawStore: 'algorand/rawStore',
      accounts: 'algorand/accounts'
    }),
    algoSignerClasses() {
      if (this.rawStore.walletServices['algoSigner']) {
        return 'block mt-2 tracking-widest border-2 rounded-lg focus:border-indigo-700 hover:border-indigo-600 focus:outline-none w-full uppercase text-center text-black bg-white text-xs py-3 px-10 disabled:opacity-50 disabled:cursor-not-allowed';
      }
      return 'block mt-2 tracking-widest border-2 rounded-lg focus:border-indigo-700 hover:border-indigo-600 focus:outline-none w-full uppercase text-center text-black bg-gray-100 text-xs py-3 px-10 disabled:opacity-50 disabled:cursor-not-allowed';
    }
  },
  mounted() {
    if (this.accounts) {
      if (this.accounts.indexOf(this.rawStore.account) !== -1) {
        this.selectedAccount = this.rawStore.account;
      } else {
        this.selectedAccount = this.accounts[0];
      }
    }
  },
  methods: {
    openAlgoSignerWebsite() {
      window.open(
        'https://chrome.google.com/webstore/detail/algosigner/kmmolakhbgdlpkjkcjkebenjheonagdm',
        '_blank'
      );
    },
    onClose() {
      eventBus.$emit('close-modals');
    },
    connectToMyAlgo() {
      this.$store.dispatch('algorand/CONNECT_TO_MYALGO');
      this.onClose();
    },
    connectToAlgoSigner() {
      if (this.rawStore.walletServices['algoSigner']) {
        this.$store.dispatch('algorand/CONNECT_TO_ALGOSIGNER');
      } else {
        this.openAlgoSignerWebsite();
      }
      this.onClose();
    }
  }
};
</script>
