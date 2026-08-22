import { useCallback, useState } from "react";

/**
 * Boolean open/close state for modals, bottom sheets, dropdowns.
 *
 * @param {boolean} initial - initial open state
 * @returns {Object} { isOpen, open, close, toggle }
 */
export function useDisclosure(initial = false) {
  const [isOpen, setIsOpen] = useState(initial);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);
  return { isOpen, open, close, toggle };
}