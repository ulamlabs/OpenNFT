<template>
  <div class="w-full aspect-w-10 aspect-h-10">
    <img
      v-if="image"
      :src="image"
      class="object-cover rounded-lg"
      alt="NFT Logo"
    >
    <ImagePlaceholder
      v-else
      width="640"
      height="640"
      class="object-cover rounded-lg"
    />
  </div>
</template>
<script>
import ImagePlaceholder from 'vue-image-placeholder';

export default {
  name: 'TopImage',
  components: {
    ImagePlaceholder
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
