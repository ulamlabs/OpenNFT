<template>
  <div class="w-full flex flex-col items-center">
    <div class="max-w-4xl min-w-12-rem bg-white shadow-md w-full">
      <slot />
    </div>
  </div>
</template>
<script>
export default {
  name: 'PageCard'
};
</script>
<style scoped>
.min-w-12-rem {
  min-width: 12rem;
}
</style>
