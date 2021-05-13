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
          Make an offer
        </div>
        <div class="mt-4">
          <NumberInput
            v-model="price"
            label="Your Price"
            component="t-currency-input"
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
          <p class="text-gray-400 text-sm font-light">
            Transaction fees: {{ fee }} Algos
          </p>
        </div>
        <hr class="my-4">
        <div class="text-gray-700 text-sm leading-5">
          <p>Before you confirm:</p>
          <ul class="list-disc list-outside ml-6">
            <li>
              Offer amount is held in escrow
            </li>
            <li>
              NFT is automatically transferred to your address when the offer is accepted by the
              owner
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
          :asset-ids="[assetData.asset_id]"
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
import { BID_PRICE } from '@/utils/constants';
import { checkIfOperationIsCompleted } from '@/utils/operations';
import { toRawValue } from '@/utils/precision';
import ModalWrapper from '@/components/modals/ModalWrapper';
import { validateAlgoBalance, validateAssetBalances } from '@/utils/validation';
import { USDC_ID } from '@/config';

export default {
  name: 'MakeOfferModal',
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
      buttonError: null
    };
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
      return !!(
        this.assetData['application_id'] && !this.userStates[this.assetData['application_id']]
      );
    },
    requiresAssetOptIn() {
      return !this.userAssets[this.assetData.asset_id];
    },
    fee() {
      const userData = this.userStates[this.assetData['application_id']];
      let userBid = 0;
      if (userData && userData[BID_PRICE]) {
        userBid = Number(userData[BID_PRICE]);
      }
      const targetBid = toRawValue(this.price);
      const priceDiff = targetBid - userBid;

      let fee = 0.002;
      if (priceDiff < 0) {
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
      const userData = this.userStates[this.assetData['application_id']];
      let userBid = 0;
      if (userData && userData[BID_PRICE]) {
        userBid = Number(userData[BID_PRICE]);
      }
      const currentPrice = Number(this.applicationData['A']);
      const newUserBid = toRawValue(this.price);
      const priceDiff = newUserBid - userBid;
      if (newUserBid <= 0) {
        this.error = 'Must be bigger than 0';
      } else if (newUserBid === userBid) {
        this.error = 'Must be different than current bid';
      } else if (currentPrice && newUserBid >= currentPrice) {
        this.error = 'Must be lower than the current price (use "Buy Now" to buy instantly)';
      }
      if (!validateAlgoBalance(this.fee, false)) {
        this.buttonError = 'Insufficient funds';
      }
      const assetSpendings = {};
      if (priceDiff > 0) {
        assetSpendings[USDC_ID] = priceDiff;
      }
      if (!validateAssetBalances(assetSpendings, false)) {
        this.buttonError = 'Insufficient funds';
      }
      return !this.error && !this.buttonError;
    },
    async onConfirm() {
      await this.onClose();
      const userData = this.userStates[this.assetData['application_id']];
      let userBid = 0;
      if (userData && userData[BID_PRICE]) {
        userBid = Number(userData[BID_PRICE]);
      }
      const targetBid = toRawValue(this.price);
      const priceDiff = targetBid - userBid;
      await this.$store.dispatch('algorand/QUEUE_ACTION', {
        actionMethod: async () => {
          return await this.rawStore.walletManager.bid(
            this.account,
            this.assetData['escrow_address'],
            this.assetData['application_id'],
            this.assetData.asset_id,
            priceDiff
          );
        },
        actionMessage: 'Making offer...',
        actionVerificationMethod: checkIfOperationIsCompleted
      });
    }
  }
};
</script>
