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
          Sell now
        </div>
        <div class="mt-4">
          <NumberInput
            v-model="price"
            label="Your Price"
            component="t-currency-input"
            disabled
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
              You are going to sell the NFT instantly and transfer the ownership to a new person
            </li>
            <li>
              Cash is automatically transferred to your address
            </li>
          </ul>
        </div>
      </div>
      <div class="px-4 py-3 sm:px-6 sm:flex sm:flex-row sm:space-x-8 justify-center">
        <ActionButton
          label="Confirm"
          :execute="onConfirm"
          :validate="validate"
          :asset-ids="[usdcId]"
          :application-id="assetData['application_id']"
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
      return !!(
        this.assetData['application_id'] && !this.userStates[this.assetData['application_id']]
      );
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
      return this.applicationData['O']
        ? algosdk.encodeAddress(base64ToUint8Array(this.applicationData['O']))
        : null;
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
    }
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
      if (!this.userHasAsset) {
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
  }
};
</script>
