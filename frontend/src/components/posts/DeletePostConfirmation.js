import { useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import Button from '../ui/Button';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/Dialog';


export function DeletePostConfirmation({ onConfirm, postTitle, trigger }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleConfirm = (e) => {
    e.stopPropagation();
    onConfirm();
    setIsOpen(false);
  };

  const handleOpenChange = (open) => {
    setIsOpen(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-[425px]"
        onClick={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-500">
            <AlertTriangle className="h-5 w-5" />
            Confirm Deletion
          </DialogTitle>
          <DialogDescription className="text-gray-500">
            Are you sure you want to delete this post? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 p-4 bg-red-50 rounded-md">
          <p className="text-sm font-medium text-red-800">
            You are about to delete:
          </p>
          <p className="mt-1 text-sm text-red-700">
            "{postTitle}"
          </p>
        </div>
        <DialogFooter className="mt-6">
          <Button
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            className="bg-red-500 hover:bg-red-600"
          >
            Delete Post
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
