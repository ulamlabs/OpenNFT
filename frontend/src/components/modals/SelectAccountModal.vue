<template>
  <ModalWrapper>
    <div
      class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-headline"
    >
      <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
        <div class="sm:flex sm:items-start">
          <div
            class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full sm:mx-0 sm:h-10 sm:w-10"
          >
            <!-- Heroicon name: adjustments -->
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
              />
            </svg>
          </div>
          <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
            <div class="text-rose-500 text-3xl leading-9 font-extrabold tracking-tight">
              Select account
            </div>
            <div class="mt-2">
              <p class="text-sm text-gray-500">
                Select an account that you would like to use from the list below:
              </p>
              <t-select
                v-model="selectedAccount"
                class="mt-2"
                :options="accounts"
                fixed-classes="overflow-ellipsis break-all"
              />
            </div>
          </div>
        </div>
      </div>
      <div class="px-4 py-3 sm:px-6 sm:flex sm:flex-row sm:space-x-8 justify-center">
        <red-modal-button
          type="button"
          @click="onSelect"
        >
          Select
        </red-modal-button>
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
    })
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
    onClose() {
      eventBus.$emit('close-modals');
    },
    onSelect() {
      eventBus.$emit('close-modals');
      if (this.selectedAccount) {
        this.$store.dispatch('algorand/SELECT_ACCOUNT', { accountAddress: this.selectedAccount });
      }
    }
  }
};
</script>
