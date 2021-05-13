<template>
  <!-- eslint-disable vue/no-v-html -->
  <div
    :class="wrapperClass"
    role="alert"
  >
    <span :class="badgeClass">{{ badgeLabel }}</span>
    <span
      class="font-semibold mr-2 text-left flex-auto"
      v-html="message"
    />
    <span @click="closeAlert">
      <svg
        class="fill-current h-6 w-6 text-red-500"
        role="button"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
      >
        <title>Close</title>
        <path
          d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"
        />
      </svg>
    </span>
  </div>
</template>
<script>
import eventBus from '@/utils/eventBus';

export default {
  name: 'Alert',
  props: {
    message: {
      type: String,
      required: true
    },
    alertType: {
      type: String,
      default: 'success'
    }
  },
  computed: {
    wrapperClass() {
      return 'p-2 bg-indigo-500 items-center text-white leading-none flex w-full absolute z-10';
    },
    badgeClass() {
      if (this.alertType === 'success') {
        return 'flex rounded-full bg-green-500 uppercase px-2 py-1 text-xs font-bold mr-3';
      } else {
        return 'flex rounded-full bg-red-500 uppercase px-2 py-1 text-xs font-bold mr-3';
      }
    },
    badgeLabel() {
      return this.alertType;
    }
  },
  methods: {
    closeAlert() {
      eventBus.$emit('close-alert');
    }
  }
};
</script>
