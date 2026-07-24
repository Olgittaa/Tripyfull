import { reactive } from 'vue';

let seq = 0;
export const toasts = reactive([]);

export function pushToast(opts) {
  const base = typeof opts === 'string' ? { title: opts } : opts;
  const t = { id: ++seq, tone: 'neutral', duration: 4000, ...base };
  toasts.push(t);
  if (t.duration > 0) setTimeout(() => dismissToast(t.id), t.duration);
  return t.id;
}
export function dismissToast(id) {
  const i = toasts.findIndex((t) => t.id === id);
  if (i !== -1) toasts.splice(i, 1);
}

export const toast = {
  show: (o) => pushToast(o),
  success: (title, message) => pushToast({ tone: 'success', title, message }),
  warning: (title, message) => pushToast({ tone: 'warning', title, message }),
  danger: (title, message) => pushToast({ tone: 'danger', title, message }),
  info: (title, message) => pushToast({ tone: 'neutral', title, message }),
};
