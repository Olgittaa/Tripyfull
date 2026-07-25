import { reactive } from 'vue';

export const confirmState = reactive({ open: false, options: {}, _resolve: null });

/**
 * Imperative confirm. Returns a Promise<boolean> (true = confirmed).
 *   confirm('Delete this?')
 *   confirm({ title, message, tone: 'danger', confirmLabel: 'Delete' }).then(ok => …)
 */
export function confirm(options) {
  const opts = typeof options === 'string' ? { message: options } : options || {};
  confirmState.options = {
    title: 'Are you sure?',
    message: '',
    tone: 'primary',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    ...opts,
  };
  confirmState.open = true;
  return new Promise((resolve) => {
    confirmState._resolve = resolve;
  });
}

export function resolveConfirm(value) {
  confirmState.open = false;
  const r = confirmState._resolve;
  confirmState._resolve = null;
  if (r) r(value);
}
