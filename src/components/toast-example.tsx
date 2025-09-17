import { Button } from '@/components/ui/button';
import {
  useToast,
  useActionToast,
  useSaveToast,
  useDeleteToast,
  useValidationToast,
  showToast,
} from '@/lib/use-toast';

export function ToastExample() {
  const { toast } = useToast();
  const actionToast = useActionToast();
  const saveToast = useSaveToast();
  const deleteToast = useDeleteToast();
  const validationToast = useValidationToast();

  // Basic toast examples
  const handleBasicSuccess = () => {
    toast.success('Success!', 'Your action was completed successfully.');
  };

  const handleBasicError = () => {
    toast.error('Error!', 'Something went wrong. Please try again.');
  };

  const handleBasicWarning = () => {
    toast.warning('Warning!', 'Please check your input before proceeding.');
  };

  const handleBasicInfo = () => {
    toast.info('Info', "Here's some helpful information for you.");
  };

  // Reusable function examples
  const handleActionSuccess = () => {
    showToast.actionSuccess('Generate Schedule');
  };

  const handleActionError = () => {
    showToast.actionError('Save Configuration', 'Database connection failed');
  };

  const handleSaveSuccess = () => {
    showToast.saveSuccess('Team Settings');
  };

  const handleSaveError = () => {
    showToast.saveError('Match Results', 'Invalid team number format');
  };

  const handleDeleteSuccess = () => {
    showToast.deleteSuccess('Match');
  };

  const handleDeleteError = () => {
    showToast.deleteError(
      'Alliance',
      'Cannot delete alliance with active matches'
    );
  };

  const handleNetworkError = () => {
    showToast.networkError();
  };

  const handleValidationError = () => {
    showToast.validationError('Team Number');
  };

  const handleUnsavedChanges = () => {
    showToast.unsavedChanges();
  };

  const handleConfirmationRequired = () => {
    showToast.confirmationRequired('delete all matches');
  };

  const handleDataLoss = () => {
    showToast.dataLoss();
  };

  const handleFeatureComingSoon = () => {
    showToast.featureComingSoon('Live Match Streaming');
  };

  const handleMaintenanceMode = () => {
    showToast.maintenanceMode();
  };

  // Hook examples
  const handleActionHook = () => {
    actionToast.onLoading('Processing');
    setTimeout(() => {
      actionToast.onSuccess('Process');
    }, 2000);
  };

  const handleSaveHook = () => {
    saveToast.onSaveLoading('Alliance');
    setTimeout(() => {
      saveToast.onSaveSuccess('Alliance');
    }, 1500);
  };

  const handleDeleteHook = () => {
    deleteToast.onDeleteWarning('Team');
    setTimeout(() => {
      deleteToast.onDeleteLoading('Team');
      setTimeout(() => {
        deleteToast.onDeleteSuccess('Team');
      }, 1000);
    }, 1000);
  };

  const handleValidationHook = () => {
    validationToast.onValidationError('Match Time');
  };

  // Promise example
  const handlePromise = () => {
    const promise = new Promise((resolve, reject) => {
      setTimeout(() => {
        Math.random() > 0.5 ? resolve('Success!') : reject('Failed!');
      }, 2000);
    });

    showToast.promise(promise, {
      loading: 'Processing...',
      success: 'Operation completed successfully!',
      error: 'Operation failed. Please try again.',
    });
  };

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold">Toast Examples</h2>

      {/* Basic Toasts */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Basic Toasts</h3>
        <div className="grid grid-cols-2 gap-4">
          <Button onClick={handleBasicSuccess} variant="default">
            Basic Success
          </Button>
          <Button onClick={handleBasicError} variant="destructive">
            Basic Error
          </Button>
          <Button onClick={handleBasicWarning} variant="outline">
            Basic Warning
          </Button>
          <Button onClick={handleBasicInfo} variant="secondary">
            Basic Info
          </Button>
        </div>
      </div>

      {/* Reusable Function Examples */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Reusable Functions</h3>
        <div className="grid grid-cols-2 gap-4">
          <Button onClick={handleActionSuccess} variant="default">
            Action Success
          </Button>
          <Button onClick={handleActionError} variant="destructive">
            Action Error
          </Button>
          <Button onClick={handleSaveSuccess} variant="default">
            Save Success
          </Button>
          <Button onClick={handleSaveError} variant="destructive">
            Save Error
          </Button>
          <Button onClick={handleDeleteSuccess} variant="default">
            Delete Success
          </Button>
          <Button onClick={handleDeleteError} variant="destructive">
            Delete Error
          </Button>
          <Button onClick={handleNetworkError} variant="destructive">
            Network Error
          </Button>
          <Button onClick={handleValidationError} variant="destructive">
            Validation Error
          </Button>
        </div>
      </div>

      {/* Warning Examples */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Warning Patterns</h3>
        <div className="grid grid-cols-2 gap-4">
          <Button onClick={handleUnsavedChanges} variant="outline">
            Unsaved Changes
          </Button>
          <Button onClick={handleConfirmationRequired} variant="outline">
            Confirmation Required
          </Button>
          <Button onClick={handleDataLoss} variant="outline">
            Data Loss Warning
          </Button>
        </div>
      </div>

      {/* Info Examples */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Info Patterns</h3>
        <div className="grid grid-cols-2 gap-4">
          <Button onClick={handleFeatureComingSoon} variant="secondary">
            Feature Coming Soon
          </Button>
          <Button onClick={handleMaintenanceMode} variant="secondary">
            Maintenance Mode
          </Button>
        </div>
      </div>

      {/* Hook Examples */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Specialized Hooks</h3>
        <div className="grid grid-cols-2 gap-4">
          <Button onClick={handleActionHook} variant="default">
            Action Hook
          </Button>
          <Button onClick={handleSaveHook} variant="default">
            Save Hook
          </Button>
          <Button onClick={handleDeleteHook} variant="outline">
            Delete Hook
          </Button>
          <Button onClick={handleValidationHook} variant="destructive">
            Validation Hook
          </Button>
        </div>
      </div>

      {/* Promise Example */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Promise Toast</h3>
        <div className="grid grid-cols-2 gap-4">
          <Button onClick={handlePromise} variant="default">
            Promise Toast
          </Button>
        </div>
      </div>
    </div>
  );
}
