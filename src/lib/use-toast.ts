import { toast } from 'sonner';

// Reusable toast functions for common patterns
export const showToast = {
  // Success patterns
  success: (message: string, description?: string) =>
    toast.success(message, { description }),

  actionSuccess: (action: string) =>
    toast.success(`${action} completed successfully!`),

  saveSuccess: (item: string = 'Changes') =>
    toast.success(`${item} saved successfully!`),

  deleteSuccess: (item: string = 'Item') =>
    toast.success(`${item} deleted successfully!`),

  // Error patterns
  error: (message: string, description?: string) =>
    toast.error(message, { description }),

  actionError: (action: string, error?: string) =>
    toast.error(`Failed to ${action.toLowerCase()}`, {
      description: error || 'Please try again later.',
    }),

  saveError: (item: string = 'Changes', error?: string) =>
    toast.error(`Failed to save ${item.toLowerCase()}`, {
      description: error || 'Please check your input and try again.',
    }),

  deleteError: (item: string = 'Item', error?: string) =>
    toast.error(`Failed to delete ${item.toLowerCase()}`, {
      description: error || 'Please try again later.',
    }),

  networkError: () =>
    toast.error('Network Error', {
      description: 'Please check your connection and try again.',
    }),

  validationError: (field?: string) =>
    toast.error('Validation Error', {
      description: field
        ? `Please check ${field} and try again.`
        : 'Please check your input and try again.',
    }),

  // Warning patterns
  warning: (message: string, description?: string) =>
    toast.warning(message, { description }),

  unsavedChanges: () =>
    toast.warning('Unsaved Changes', {
      description: 'You have unsaved changes. Are you sure you want to leave?',
    }),

  confirmationRequired: (action: string) =>
    toast.warning('Confirmation Required', {
      description: `Please confirm that you want to ${action.toLowerCase()}.`,
    }),

  dataLoss: () =>
    toast.warning('Data Loss Warning', {
      description:
        'This action cannot be undone. Are you sure you want to continue?',
    }),

  // Info patterns
  info: (message: string, description?: string) =>
    toast.info(message, { description }),

  loading: (message: string, description?: string) =>
    toast.loading(message, { description }),

  featureComingSoon: (feature: string) =>
    toast.info('Coming Soon', {
      description: `${feature} will be available in a future update.`,
    }),

  maintenanceMode: () =>
    toast.info('Maintenance Mode', {
      description:
        'The system is currently under maintenance. Some features may be unavailable.',
    }),

  // Utility functions
  dismiss: (toastId?: string | number) => toast.dismiss(toastId),

  promise: <T>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: unknown) => string);
    }
  ) => toast.promise(promise, { loading, success, error }),
};

// Hook for using toast functions
export const useToast = () => {
  return {
    toast: showToast,
  };
};

// Specialized hooks for common scenarios
export const useActionToast = () => {
  return {
    onSuccess: (action: string) => showToast.actionSuccess(action),
    onError: (action: string, error?: string) =>
      showToast.actionError(action, error),
    onLoading: (action: string) =>
      showToast.loading(
        `${action}...`,
        'Please wait while we process your request.'
      ),
  };
};

export const useSaveToast = () => {
  return {
    onSaveSuccess: (item?: string) => showToast.saveSuccess(item),
    onSaveError: (item?: string, error?: string) =>
      showToast.saveError(item, error),
    onSaveLoading: (item?: string) =>
      showToast.loading(`Saving ${item || 'changes'}...`),
  };
};

export const useDeleteToast = () => {
  return {
    onDeleteSuccess: (item?: string) => showToast.deleteSuccess(item),
    onDeleteError: (item?: string, error?: string) =>
      showToast.deleteError(item, error),
    onDeleteLoading: (item?: string) =>
      showToast.loading(`Deleting ${item || 'item'}...`),
    onDeleteWarning: (item?: string) =>
      showToast.confirmationRequired(`delete ${item || 'this item'}`),
  };
};

export const useValidationToast = () => {
  return {
    onValidationError: (field?: string) => showToast.validationError(field),
    onNetworkError: () => showToast.networkError(),
  };
};

// Export individual toast functions for convenience
export { toast };
