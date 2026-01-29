'use client';

import { toastStore } from './toast.store';

export function useToast() {
  const showToast = toastStore((state) => state.showToast);
  const showSuccessToast = toastStore((state) => state.showSuccessToast);
  const showErrorToast = toastStore((state) => state.showErrorToast);
  const showInfoToast = toastStore((state) => state.showInfoToast);
  return { showToast, showSuccessToast, showErrorToast, showInfoToast };
}
