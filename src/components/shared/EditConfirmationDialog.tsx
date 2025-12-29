import { useState } from 'react';
import { AlertCircle, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EditConfirmationDialogProps {
  isOpen: boolean;
  requesterName: string;
  contentType: string;
  action: 'edit' | 'delete';
  originalData?: any;
  newData?: any;
  changeDescription?: string;
  onApprove: (editId: string) => Promise<void>;
  onReject: (editId: string) => Promise<void>;
  onClose: () => void;
  editId: string;
}

export function EditConfirmationDialog({
  isOpen,
  requesterName,
  contentType,
  action,
  originalData,
  newData,
  changeDescription,
  onApprove,
  onReject,
  onClose,
  editId,
}: EditConfirmationDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleApprove = async () => {
    setIsLoading(true);
    try {
      await onApprove(editId);
      toast.success(`✓ Approved! Changes will be applied.`);
      onClose();
    } catch (error) {
      toast.error('Failed to approve');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    setIsLoading(true);
    try {
      await onReject(editId);
      toast.success('✗ Rejected! No changes made.');
      onClose();
    } catch (error) {
      toast.error('Failed to reject');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            {action === 'edit' ? 'Confirm Edit' : 'Confirm Delete'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Requester Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>{requesterName}</strong> wants to {action === 'edit' ? 'edit your' : 'delete your'}{' '}
              <strong>{contentType}</strong>
            </p>
          </div>

          {/* Change Description */}
          {changeDescription && (
            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Reason for change:
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{changeDescription}</p>
            </div>
          )}

          {/* Data Comparison (for edits) */}
          {action === 'edit' && originalData && newData && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Changes:</p>
              <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-300">
                  <strong>Original:</strong> {JSON.stringify(originalData).slice(0, 100)}
                  {JSON.stringify(originalData).length > 100 ? '...' : ''}
                </p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                <p className="text-sm text-green-700 dark:text-green-300">
                  <strong>New:</strong> {JSON.stringify(newData).slice(0, 100)}
                  {JSON.stringify(newData).length > 100 ? '...' : ''}
                </p>
              </div>
            </div>
          )}

          {/* Delete Warning */}
          {action === 'delete' && (
            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-700 dark:text-red-300">
                ⚠️ <strong>Warning:</strong> This action will permanently delete the {contentType}.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Deny
          </Button>
          <Button
            onClick={handleApprove}
            disabled={isLoading}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            <Check className="h-4 w-4" />
            Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
