import { type ReactNode, useEffect, useRef } from 'react';
import { FaTimes } from 'react-icons/fa';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  actions?: ReactNode;
}

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  actions,
}: ModalProps) => {
  const modalRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;

    if (isOpen) {
      modal.showModal();
    } else {
      modal.close();
    }
  }, [isOpen]);

  const handleClose = () => {
    onClose();
  };

  return (
    <dialog ref={modalRef} className="modal" onClose={handleClose}>
      <div className="modal-box">
        {title && <h3 className="font-bold text-lg mb-4">{title}</h3>}

        <div className="py-4">{children}</div>

        {actions && <div className="modal-action">{actions}</div>}

        <form method="dialog">
          <button
            className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
            onClick={handleClose}
          >
            <FaTimes />
          </button>
        </form>
      </div>

      <form method="dialog" className="modal-backdrop">
        <button onClick={handleClose}>close</button>
      </form>
    </dialog>
  );
};
