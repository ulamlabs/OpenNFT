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
          Cancel offer
        </h2>
        <p class="mt-4">
          Transaction fees: {{ fee }} Algos
        </p>
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
          component="modal-button"
        />
      </div>
    </div>
  </ModalWrapper>
</template>
<script>
import eventBus from '@/utils/eventBus';
import ActionButton from '@/components/ActionButton';
import ModalWrapper from '@/components/modals/ModalWrapper';

export default {
  name: 'CancelModal',
  components: {
    ModalWrapper,
    ActionButton,
  },
  props: {
    validate: {
      type: Function,
      default: null,
      required: false,
    },
    execute: {
      type: Function,
      required: true,
    },
    fee: {
      type: Number,
      required: true
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
    async onConfirm() {
      await this.onClose();
      await this.execute();
    }
  },
};
</script>
