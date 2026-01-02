import React from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';

interface BulkActionsProps {
  selectedCount: number;
  onBulkDelete: () => void;
  isLoading?: boolean;
}

const BulkActions: React.FC<BulkActionsProps> = ({
  selectedCount,
  onBulkDelete,
  isLoading = false,
}) => {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-sm font-medium text-blue-900">
            {selectedCount} report{selectedCount > 1 ? 's' : ''} selected
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onBulkDelete}
            disabled={isLoading}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <TrashIcon className="h-4 w-4 mr-2" />
            {isLoading ? 'Deleting...' : 'Delete Selected'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkActions;