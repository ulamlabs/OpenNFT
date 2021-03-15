<template>
  <ModalWrapper>
    <div
      class="overflow-visible inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-headline"
    >
      <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
        <h2 class="text-gray-700 font-semibold tracking-wide mb-2">
          Buy Now
        </h2>
        <div class="mt-4">
          <NumberInput
            v-model="price"
            label="Price"
            component="t-currency-input"
            disabled
          >
            <template v-slot:append>
              <span class="hidden xs:block z-10 h-full leading-snug font-normal absolute text-center text-gray-300 absolute bg-transparent rounded text-base items-center justify-center right-0 pr-3 py-2.5">
                USDC
              </span>
            </template>
          </NumberInput>
          <p class="mt-4">
            Transaction fees: {{ fee }} Algos
          </p>
        </div>
        <hr class="mt-4 mb-4">
        <p>Before you confirm:</p>
        <ul class="list-disc list-inside">
          <li>
            NFT is automatically transferred to your
            address
          </li>
        </ul>
      </div>
      <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row justify-center">
        <button
          type="button"
          class="mt-3 w-full justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:mr-3 sm:w-auto sm:text-sm"
          @click="onClose"
        >
          Cancel
        </button>
        <ActionButton
          label="Confirm"
          :execute="onConfirm"
          :validate="validate"
          :application-id="assetData['application_id']"
          :asset-ids="[assetData.asset_id]"
          component="modal-button"
        />
      </div>
    </div>
  </ModalWrapper>
</template>
<script>
import eventBus from '@/utils/eventBus';
import NumberInput from '@/components/NumberInput';
import ActionButton from '@/components/ActionButton';
import { mapGetters } from 'vuex';
import { BID_PRICE } from '@/utils/constants';
import { checkIfOperationIsCompleted } from '@/utils/operations';
import ModalWrapper from '@/components/modals/ModalWrapper';
import { validateAlgoBalance, validateAssetBalances } from '@/utils/validation';
import { emitError } from '@/utils/errors';
import { USDC_ID } from '@/config';
import { base64ToUint8Array } from '@/utils/encoding';
import algosdk from 'algosdk';

export default {
  name: 'BuyNowModal',
  components: {
    ModalWrapper,
    ActionButton,
    NumberInput,
  },
  props: {
    assetData: {
      type: Object,
      required: true
    }
  },
  computed: {
    ...mapGetters({
      rawStore: 'algorand/rawStore',
      account: 'algorand/account',
      userStates: 'algorand/userStates',
      applicationData: 'algorand/applicationData',
      userAssets: 'algorand/userAssets'
    }),
    requiresApplicationOptIn() {
      return !!(this.assetData['application_id'] && !this.userStates[this.assetData['application_id']]);
    },
    requiresAssetOptIn() {
      return !this.userAssets[this.assetData.asset_id];
    },
    fee() {
      let fee = 0.005;
      if (this.requiresApplicationOptIn) {
        fee += 0.001;
      }
      if (this.requiresAssetOptIn) {
        fee += 0.001;
      }
      return fee;
    },
    price() {
      return Number(this.applicationData['A']);
    },
    contractOwnerAddress() {
      if (this.applicationData['O'] === 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=') {
        return null;
      }
      return this.applicationData['O'] ? algosdk.encodeAddress(base64ToUint8Array(this.applicationData['O'])) : null;
    },
  },
  methods: {
    onClose() {
      eventBus.$emit('close-asset-modals');
    },
    validate() {
      if (!this.applicationData['A']) {
        emitError('There are no sellers to buy from');
        return false;
      }
      validateAlgoBalance(this.fee);
      const assetSpending = {};
      assetSpending[USDC_ID] = this.price;
      validateAssetBalances(assetSpending);
      return true;
    },
    async onConfirm() {
      await this.onClose();
      const userData = this.userStates[this.assetData['application_id']];
      let userBid = 0;
      if (userData && userData[BID_PRICE]) {
        userBid = Number(userData[BID_PRICE]);
      }
      const priceDiff = this.price - userBid;
      await this.$store.dispatch('algorand/QUEUE_ACTION', {
        actionMethod: async () => {
          return await this.rawStore.walletManager.buyNow(
            this.account,
            this.assetData['escrow_address'],
            this.assetData['application_id'],
            this.assetData.asset_id,
            priceDiff,
            this.contractOwnerAddress,
            this.applicationData['A']
          );
        },
        actionMessage: 'Buying now...',
        actionVerificationMethod: checkIfOperationIsCompleted
      });
    }
  },
};
</script>
