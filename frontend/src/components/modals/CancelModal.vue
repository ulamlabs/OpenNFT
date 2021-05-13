<template>
  <ModalWrapper>
    <div
      class="overflow-visible inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-headline"
    >
      <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 rounded-lg">
        <div class="text-rose-500 text-3xl leading-9 font-extrabold tracking-tight">
          Cancel offer
        </div>
        <p class="mt-4 text-gray-400 text-sm font-light">
          Transaction fees: {{ fee }} Algos
        </p>
      </div>
      <hr class="my-4">
      <div class="px-4 py-3 sm:px-6 sm:flex sm:flex-row sm:space-x-8 justify-center">
        <ActionButton
          label="Confirm"
          :execute="onConfirm"
          :validate="validate"
          component="red-modal-button"
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
import ActionButton from '@/components/ActionButton';
import ModalWrapper from '@/components/modals/ModalWrapper';

export default {
  name: 'CancelModal',
  components: {
    ModalWrapper,
    ActionButton
  },
  props: {
    validate: {
      type: Function,
      default: null,
      required: false
    },
    execute: {
      type: Function,
      required: true
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
  }
};
</script>
