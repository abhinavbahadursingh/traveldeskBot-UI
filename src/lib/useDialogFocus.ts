import { RefObject, useEffect } from 'react';

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

/** Moves focus into the dialog on mount and returns it to the trigger on unmount. */
export function useDialogFocus(ref: RefObject<HTMLElement>) {
  useEffect(() => {
    const trigger = document.activeElement as HTMLElement | null;
    const first = ref.current?.querySelector<HTMLElement>(FOCUSABLE);
    first?.focus({ preventScroll: true });
    return () => {
      if (trigger && trigger.isConnected && !(trigger as HTMLButtonElement).disabled) {
        trigger.focus({ preventScroll: true });
      }
    };
  }, [ref]);
}
