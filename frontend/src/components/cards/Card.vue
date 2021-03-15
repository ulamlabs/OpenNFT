<template>
  <div class="flex flex-col items-center px-2 py-2">
    <div class="bg-white shadow-md w-full">
      <slot />
    </div>
  </div>
</template>
<script>
export default {
  name: 'Card'
};
</script>
