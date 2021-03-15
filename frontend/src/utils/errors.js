import eventBus from '@/utils/eventBus';

export function emitError(message) {
  eventBus.$emit('open-alert', {
    type: 'error',
    message: message
  });
  eventBus.$emit('close-asset-modals');
  eventBus.$emit('close-modals');
}
