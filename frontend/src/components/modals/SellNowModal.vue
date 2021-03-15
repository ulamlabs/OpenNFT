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
          Sell Now
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
            You are going to sell the NFT instantly and transfer the ownership to a new person
          </li>
          <li>
            Cash is automatically transferred to your address
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
          :asset-ids="[usdcId]"
          :application-id="assetData['application_id']"
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
import { checkIfOperationIsCompleted } from '@/utils/operations';
import ModalWrapper from '@/components/modals/ModalWrapper';
import { validateAlgoBalance } from '@/utils/validation';
import { emitError } from '@/utils/errors';
import { USDC_ID } from '@/config';
import algosdk from 'algosdk';
import { base64ToUint8Array } from '@/utils/encoding';

export default {
  name: 'SellNowModal',
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
  data() {
    return {
      usdcId: USDC_ID
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
      return !!(this.assetData['application_id'] && !this.userStates[this.assetData['application_id']]);
    },
    requiresUSDCOptIn() {
      return !this.userAssets[USDC_ID];
    },
    fee() {
      let fee = 0.004;
      if (this.requiresApplicationOptIn) {
        fee += 0.001;
      }
      if (this.requiresUSDCOptIn) {
        fee += 0.001;
      }
      return fee;
    },
    price() {
      const highestBid = this.assetData['highest_bid'];
      return highestBid.value;
    },
    contractOwnerAddress() {
      if (this.applicationData['O'] === 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=') {
        return null;
      }
      return this.applicationData['O'] ? algosdk.encodeAddress(base64ToUint8Array(this.applicationData['O'])) : null;
    },
    userHasAsset() {
      const userAsset = this.userAssets[String(this.assetData.asset_id)];
      if (userAsset && userAsset.amount > 0) {
        return true;
      } else if (this.account && this.contractOwnerAddress === this.account) {
        return true;
      }
      return false;
    },
    hasBid() {
      return !!(this.assetData['highest_bid'] && this.assetData['highest_bid'].value);
    },
  },
  methods: {
    onClose() {
      eventBus.$emit('close-asset-modals');
    },
    validate() {
      validateAlgoBalance(this.fee);
      return this.checkIfUserHasAsset() && this.checkIfHasBid();
    },
    checkIfHasBid() {
      if (!this.hasBid) {
        emitError('There must be a bid');
        return false;
      }
      return true;
    },
    checkIfUserHasAsset() {
      if(!this.userHasAsset) {
        emitError('You must own the NFT');
        return false;
      }
      return true;
    },
    async onConfirm() {
      await this.onClose();
      let assetInEscrow = false;
      if (this.contractOwnerAddress === this.account) {
        assetInEscrow = true;
      }
      const highestBid = this.assetData['highest_bid'];
      const price = highestBid.value;
      const buyerAddress = highestBid.sender;
      await this.$store.dispatch('algorand/QUEUE_ACTION', {
        actionMethod: async () => {
          return await this.rawStore.walletManager.sellNow(
            this.account,
            this.assetData['escrow_address'],
            buyerAddress,
            this.assetData['application_id'],
            this.assetData.asset_id,
            price,
            assetInEscrow
          );
        },
        actionMessage: 'Selling now...',
        actionVerificationMethod: checkIfOperationIsCompleted
      });
    }
  },
};
</script>

