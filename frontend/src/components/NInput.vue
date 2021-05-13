<template>
  <div>
    <label
      v-if="label"
      class="text-sm leading-5 font-medium"
      :class="labelClass"
    >{{
      label
    }}</label>
    <slot name="input">
      <div class="relative flex w-full flex-wrap items-stretch mb-1">
        <slot name="prepend" />
        <component
          :is="component"
          v-bind="$attrs"
          :variant="variant"
          :value="value"
          :placeholder="placeholder"
          v-on="inputListeners"
          @input="onInput"
          @change="onChange"
        />
        <slot name="append" />
      </div>
    </slot>
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
  name: 'NInput',
  inheritAttrs: false,
  props: {
    label: {
      type: String,
      default: null,
      required: false
    },
    error: {
      default: false,
      type: [Boolean, String, Array, Number]
    },
    value: {
      type: [String, Number],
      required: false,
      default: null
    },
    placeholder: {
      type: String,
      required: false,
      default: ''
    },
    component: {
      type: [Object, String],
      default: 't-input'
    }
  },
  computed: {
    variant() {
      return this.error ? 'danger' : '';
    },
    labelClass() {
      return this.error ? 'text-red-800' : 'text-gray-700';
    },
    inputListeners() {
      return this.$listeners;
    }
  },
  methods: {
    onChange(value) {
      this.$emit('change', value);
    },
    onInput(value) {
      this.$emit('input', value);
    }
  }
};
</script>
