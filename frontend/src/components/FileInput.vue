<template>
  <div>
    <div class="border px-2 py-2 rounded mb-1 inline-flex max-w-md w-full">
      <t-button
        classes="tracking-widest whitespace-nowrap uppercase text-center shadow bg-indigo-600 hover:bg-indigo-700 focus:shadow-outline focus:outline-none text-white text-xs py-2 px-5 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        @click="openDialog"
      >
        Select file
      </t-button>
      <div class="px-2 text-sm truncate">
        {{ filename || "No file chosen..." }}
      </div>
    </div>
    <input
      ref="file"
      type="file"
      class="hidden"
      :value="value"
      @change="onChange"
    >
    <p
      v-if="typeof error === 'string'"
      class="text-red-900 text-sm"
    >
      {{ error }}
    </p>
    <p
      v-for="err in error"
      v-else-if="typeof error === 'object'"
      :key="err"
      class="text-red-900 text-sm"
    >
      {{ err }}
    </p>
  </div>
</template>
<script>
export default {
  name: 'FileInput',
  inheritAttrs: false,
  props: {
    error: {
      default: false,
      type: [Boolean, String, Array],
    },
    value: {
      type: String,
      required: false,
      default: ''
    }
  },
  data() {
    return {
      filename: null
    };
  },
  methods: {
    openDialog() {
      this.$refs.file.click();
    },
    onChange(e) {
      const files = e.target && e.target.files || e.dataTransfer && e.dataTransfer.files;
      if (!files || !files.length) {
        e.preventDefault();
        return;
      }
      this.filename = files[0].name;
      this.$emit('change', e);
    }
  },
};
</script>
