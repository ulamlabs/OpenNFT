<template>
  <div class="flex items-end mb-8">
    <h1 class="text-3xl leading-8 font-extrabold whitespace-nowrap tracking-tight">
      {{ title }}
    </h1>
    <div
      class="ml-2 w-full"
      aria-hidden="true"
    >
      <div class="w-full border-t border-gray-300" />
    </div>
  </div>
</template>
<script>
export default {
  name: 'AssetTitle',
  props: {
    title: {
      type: String,
      required: true
    }
  }
};
</script>
