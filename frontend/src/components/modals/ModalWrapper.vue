<template>
  <div class="fixed z-10 inset-0 overflow-y-auto modal-wrapper">
    <div
      class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0"
    >
      <div
        class="fixed inset-0 transition-opacity"
        aria-hidden="true"
      >
        <div class="absolute inset-0 bg-gray-500 opacity-75" />
      </div>
      <!-- This element is to trick the browser into centering the modal contents. -->
      <span
        class="hidden sm:inline-block sm:align-middle sm:h-screen"
        aria-hidden="true"
      >&#8203;</span>
      <slot />
    </div>
  </div>
</template>
<script>
export default {
  name: 'ModalWrapper',
  mounted() {
    if (window.innerWidth < 320) {
      window.scroll(0, 0);
    }
  }
};
</script>
<style>
@media screen and (max-width: 320px) {
  .modal-wrapper {
    position: absolute !important;
    min-width: 320px;
    overflow: hidden !important;
    top: 0;
  }
}
</style>
