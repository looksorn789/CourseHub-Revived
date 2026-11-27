import React from "react";
import Button from "../ui/Button";

function DeleteAccountModal({ onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
      <div className="bg-white p-6 rounded shadow-lg w-full max-w-sm">
        <h3 className="text-lg font-bold mb-4">Delete Account</h3>
        <p className="mb-4">
          Are you sure you want to delete your account? This action cannot be undone.
        </p>
        <div className="flex justify-end space-x-4">
          <Button onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2">
            Cancel
          </Button>
          <Button onClick={onConfirm} className="bg-red-600 text-white px-4 py-2">
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

export default DeleteAccountModal;
