<template>
  <div class="px-4 mx-3">
    <button
      class="mt-4 py-2 px-2 rounded-xl bg-white border hover:bg-gray-300 border-gray-400 focus:outline-none asset-card"
      @click="onClick"
    >
      <span class="text-gray-400 text-base leading-6 font-medium">
        View All
      </span>
    </button>
  </div>
</template>
<script>
export default {
  name: 'ViewMore',
  methods: {
    onClick() {
      this.$emit('click');
    }
  }
};
</script>
<style scoped>
.asset-card {
  width: 13.85rem;
  height: 13.85rem;
  overflow: hidden;
}
</style>
