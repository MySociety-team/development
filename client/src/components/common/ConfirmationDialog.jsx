import Modal from "./Modal";
import Button from "./Button";

function ConfirmationDialog({
  isOpen,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  loading = false
}) {
  return (
    <Modal isOpen={isOpen} title={title} onClose={onCancel}>
      <p className="text-sm text-gray-600">{message}</p>

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="secondary" onClick={onCancel} disabled={loading}>
          {cancelText}
        </Button>

        <Button variant="danger" onClick={onConfirm} loading={loading}>
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
}

export default ConfirmationDialog;
