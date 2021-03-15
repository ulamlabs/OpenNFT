<template>
  <div class="mx-auto px-4 py-4 max-w-md mb-16">
    <div class="mx-auto">
      <img
        v-if="image"
        :src="image"
        class="object-contain w-full shadow-md"
        alt="NFT Logo"
      >
      <ImagePlaceholder
        v-else
        width="640"
        height="640"
        class="object-contain w-full shadow-md"
      />
    </div>
  </div>
</template>
<script>
import ImagePlaceholder from 'vue-image-placeholder';

export default {
  name: 'TopImage',
  components: {
    ImagePlaceholder,
  },
  props: {
    image: {
      type: [String, Number],
      required: false,
      default: null
    }
  }
};
</script>
