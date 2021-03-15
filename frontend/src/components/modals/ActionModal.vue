<template>
  <div class="fixed inset-0 overflow-y-auto z-50">
    <div
      class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0"
    >
      <div
        class="fixed inset-0 transition-opacity"
        aria-hidden="true"
      >
        <div class="absolute inset-0 bg-gray-500 opacity-75" />
      </div>

      <!-- This element is to trick the browser into centering the modal contents. -->
      <span
        class="hidden sm:inline-block sm:align-middle sm:h-screen"
        aria-hidden="true"
      >&#8203;</span>
      <div
        class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-headline"
      >
        <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div class="sm:flex sm:items-start">
            <div class="w-full">
              <Spinner :message="message || 'Waiting for confirmation...'" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import Spinner from 'vue-simple-spinner';

export default {
  name: 'ActionModal',
  components: {
    Spinner
  },
  props: {
    message: {
      required: false,
      type: String,
      default: null
    }
  },
};
</script>
