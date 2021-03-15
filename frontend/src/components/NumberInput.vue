<template>
  <div>
    <NInput
      input="tel"
      v-bind="$attrs"
      :value="value"
      :placeholder="placeholder"
      :error="error"
      :label="label"
      :component="component"
      @input="onInput"
      @keypress="onKeyPress"
      @change="onChange"
    >
      <template v-slot:prepend>
        <slot name="prepend" />
      </template>
      <template v-slot:append>
        <slot name="append" />
      </template>
    </NInput>
  </div>
</template>
<script>
import NInput from '@/components/NInput';
import { USDC_DECIMAL_POINTS } from '@/config';
export default {
  name: 'NumberInput',
  components: {
    NInput
  },
  inheritAttrs: false,
  props: {
    label: {
      type: String,
      default: null,
      required: false,
    },
    error: {
      default: false,
      type: [String, Boolean, Number],
    },
    value: {
      type: [String, Number],
      required: false,
      default: null
    },
    placeholder: {
      type: String,
      required: false,
      default: '0.0'
    },
    component: {
      type: String,
      default: 't-input'
    },
    allowedDecimals: {
      type: Number,
      default: USDC_DECIMAL_POINTS
    }
  },
  methods: {
    onChange(value) {
      this.$emit('change', value);
    },
    onInput(value) {
      if (this.allowedDecimals) {
        let counter = 0;
        value = String(value).replaceAll('.', () => {
          counter++;
          return counter > 1 ? '' : '.';
        });
        value = value.replace(/[^.0-9]+/g, '');
        const dotIndex = value.indexOf('.');
        if (dotIndex !== -1) {
          value = value.substring(0, dotIndex + this.allowedDecimals + 1);
        }
      } else {
        value = String(value).replace(/[^0-9]+/g, '');
      }
      this.$emit('input', value);
      this.$forceUpdate();
    },
    onKeyPress(e) {
      let allowedKeys = /[0-9]|\./g;
      if (!this.allowedDecimals) {
        allowedKeys = /[0-9]/g;
      }
      if (!allowedKeys.test(e.key)) {
        e.preventDefault();
      }
    }
  },
};
</script>
