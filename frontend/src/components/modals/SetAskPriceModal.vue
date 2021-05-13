<template>
  <ModalWrapper>
    <div
      class="overflow-visible inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-headline"
    >
      <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 rounded-lg">
        <div class="text-indigo-500 text-3xl leading-9 font-extrabold tracking-tight">
          Set a price
        </div>
        <div class="mt-4">
          <NumberInput
            v-model="price"
            component="t-currency-input"
            label="Your Price"
            :error="error"
            @input="validate"
          >
            <template v-slot:append>
              <span
                class="hidden xs:block z-10 h-full leading-snug font-normal absolute text-center text-gray-300 absolute bg-transparent rounded text-base items-center justify-center right-0 pr-3 py-2.5"
              >
                USDC
              </span>
            </template>
          </NumberInput>
        </div>
        <p class="text-gray-400 text-sm font-light">
          Transaction fees: {{ totalFee }} Algos
        </p>
        <hr class="my-4">
        <div class="text-gray-700 text-sm leading-5">
          <p>Before you confirm:</p>
          <ul class="list-disc list-outside ml-6">
            <li>
              The NFT is held in escrow
            </li>
            <li>
              Cash is automatically transferred to your address when the buyer accepts your price
            </li>
          </ul>
        </div>
      </div>
      <div class="px-4 py-3 sm:px-6 sm:flex sm:flex-row sm:space-x-8 justify-center">
        <ActionButton
          label="Confirm"
          :execute="onConfirm"
          :validate="validate"
          :application-id="assetData['application_id']"
          :asset-ids="[usdcId]"
          :error="buttonError || !!error"
          component="modal-button"
        />
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
import NumberInput from '@/components/NumberInput';
import ActionButton from '@/components/ActionButton';
import { mapGetters } from 'vuex';
import { USDC_ID } from '@/config';
import { checkIfOperationIsCompleted } from '@/utils/operations';
import { toRawValue } from '@/utils/precision';
import algosdk from 'algosdk';
import { base64ToUint8Array } from '@/utils/encoding';
import ModalWrapper from '@/components/modals/ModalWrapper';
import { validateAlgoBalance } from '@/utils/validation';

export default {
  name: 'SetAskPriceModal',
  components: {
    ModalWrapper,
    ActionButton,
    NumberInput
  },
  props: {
    assetData: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      price: 0,
      error: null,
      buttonError: null,
      usdcId: USDC_ID
    };
  },
  computed: {
    ...mapGetters({
      rawStore: 'algorand/rawStore',
      account: 'algorand/account',
      applicationData: 'algorand/applicationData',
      userStates: 'algorand/userStates',
      userAssets: 'algorand/userAssets'
    }),
    contractOwnerAddress() {
      return this.applicationData['O']
        ? algosdk.encodeAddress(base64ToUint8Array(this.applicationData['O']))
        : null;
    },
    requiresApplicationOptIn() {
      return !!(
        this.assetData['application_id'] && !this.userStates[this.assetData['application_id']]
      );
    },
    requiresAssetOptIn() {
      return !this.userAssets[USDC_ID];
    },
    totalFee() {
      const shouldDepositAsset = this.assetData.owner_address !== this.account;
      let fee = 0.001;
      if (shouldDepositAsset) {
        fee += 0.001;
      }
      if (this.requiresApplicationOptIn) {
        fee += 0.001;
      }
      if (this.requiresAssetOptIn) {
        fee += 0.001;
      }
      return fee;
    }
  },
  methods: {
    onClose() {
      eventBus.$emit('close-asset-modals');
    },
    clearError() {
      this.error = null;
      this.buttonError = null;
    },
    validate() {
      this.clearError();
      const price = toRawValue(this.price);
      const highestBid = this.assetData['highest_bid']
        ? Number(this.assetData['highest_bid'].value)
        : 0;
      if (price <= 0) {
        this.error = 'Must be bigger than 0';
      } else if (price === this.applicationData['A']) {
        this.error = 'Must be different than current price';
      } else if (highestBid && price && price <= highestBid) {
        this.error = 'Must be bigger than the highest bid (use "Sell Now" to sell instantly)';
      }
      if (!validateAlgoBalance(this.totalFee, false)) {
        this.buttonError = 'Insufficient funds';
      }
      return !this.error && !this.buttonError;
    },
    async onConfirm() {
      await this.onClose();
      const price = toRawValue(this.price);
      const shouldDepositAsset = this.assetData.owner_address !== this.account;
      await this.$store.dispatch('algorand/QUEUE_ACTION', {
        actionMethod: async () => {
          return await this.rawStore.walletManager.setPrice(
            this.account,
            this.assetData['escrow_address'],
            this.assetData['application_id'],
            this.assetData.asset_id,
            price,
            shouldDepositAsset
          );
        },
        actionMessage: 'Setting ask price...',
        actionVerificationMethod: checkIfOperationIsCompleted
      });
    }
  }
};
</script>
