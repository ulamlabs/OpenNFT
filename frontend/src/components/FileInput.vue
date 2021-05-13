<template>
  <span @click="openDialog">
    <input
      ref="file"
      type="file"
      class="hidden"
      :value="value"
      @change="onChange"
    >
    <slot />
    <p
      v-if="typeof error === 'string'"
      class="text-red-500 text-center text-sm"
    >
      {{ error }}
    </p>
    <p
      v-for="err in error"
      v-else-if="typeof error === 'object'"
      :key="err"
      class="text-red-500 text-center text-sm"
    >
      {{ err }}
    </p>
  </span>
</template>
<script>
export default {
  name: 'FileInput',
  inheritAttrs: false,
  props: {
    error: {
      default: false,
      type: [Boolean, String, Array]
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
      const files = (e.target && e.target.files) || (e.dataTransfer && e.dataTransfer.files);
      if (!files || !files.length) {
        e.preventDefault();
        return;
      }
      this.filename = files[0].name;
      this.$emit('change', e);
    }
  }
};
</script>
