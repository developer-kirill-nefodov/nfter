import {useEffect, useRef, type ReactNode} from 'react';
import {createPortal} from 'react-dom';

import {Backdrop, CloseButton, Dialog} from './styles';

interface IModal {
  open: boolean;
  onClose: () => void;
  label: string;
  children: ReactNode;
}

/**
 * A dialog that behaves like one: Escape closes it, a click on the backdrop
 * closes it, focus moves into it and comes back out to whatever opened it, and
 * the page behind stops scrolling. None of that is optional — a modal that traps
 * a keyboard user is worse than no modal at all.
 */
const Modal = ({open, onClose, label, children}: IModal) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<Element | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    openerRef.current = document.activeElement;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', onKeyDown);

    const {overflow} = document.body.style;
    document.body.style.overflow = 'hidden';

    dialogRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = overflow;

      // Send focus back where it came from, or the keyboard user is stranded at
      // the top of the document.
      (openerRef.current as HTMLElement | null)?.focus?.();
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return createPortal(
    <Backdrop onClick={onClose}>
      <Dialog
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <CloseButton type="button" onClick={onClose} aria-label="Close">
          ×
        </CloseButton>
        {children}
      </Dialog>
    </Backdrop>,
    document.body,
  );
};

export default Modal;
