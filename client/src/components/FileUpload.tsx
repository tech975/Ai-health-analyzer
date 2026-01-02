import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, X } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  selectedFile: File | null;
  isLoading?: boolean;
  uploadProgress?: number;
  error?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  onFileRemove,
  selectedFile,
  isLoading = false,
  uploadProgress = 0,
  error,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = ['application/pdf'];

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Only PDF files are allowed';
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return 'File size must be less than 10MB';
    }
    
    return null;
  };

  const handleFileSelect = useCallback((file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      // You might want to show this error through a prop or context
      console.error(validationError);
      return;
    }
    
    onFileSelect(file);
  }, [onFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoading) {
      setIsDragOver(true);
    }
  }, [isLoading]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    if (isLoading) return;
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect, isLoading]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleClick = useCallback(() => {
    if (!isLoading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [isLoading]);

  const handleRemoveFile = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onFileRemove();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onFileRemove]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {!selectedFile ? (
        <div
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-lg p-6 sm:p-8 text-center cursor-pointer transition-colors ${
            isDragOver
              ? 'border-blue-500 bg-blue-50'
              : isLoading
              ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }`}
          role="button"
          tabIndex={isLoading ? -1 : 0}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !isLoading) {
              e.preventDefault();
              handleClick();
            }
          }}
          aria-label="Upload health report file. Click to browse or drag and drop a PDF file here."
          aria-describedby="upload-instructions"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleInputChange}
            disabled={isLoading}
            className="sr-only"
            aria-describedby="upload-instructions"
          />
          
          <Upload className={`mx-auto h-10 w-10 sm:h-12 sm:w-12 ${
            isDragOver ? 'text-blue-500' : 'text-gray-400'
          }`} aria-hidden="true" />
          
          <div className="mt-3 sm:mt-4">
            <p className={`text-base sm:text-lg font-medium ${
              isDragOver ? 'text-blue-600' : 'text-gray-900'
            }`}>
              {isDragOver ? 'Drop your file here' : 'Upload Health Report'}
            </p>
            <p id="upload-instructions" className="mt-2 text-sm text-gray-500 px-2">
              Drag and drop your PDF file here, or click to browse
            </p>
            <p className="mt-1 text-xs text-gray-400">
              PDF files only, max 10MB
            </p>
          </div>
          
          {isLoading && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg" aria-live="polite">
              <div className="text-center">
                <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600 mx-auto" role="status" aria-label="Processing file"></div>
                <p className="mt-2 text-sm text-gray-600">Processing...</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg p-3 sm:p-4 bg-gray-50" role="region" aria-label="Selected file">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
              <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-red-500 flex-shrink-0" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
              </div>
            </div>
            
            {!isLoading && (
              <button
                onClick={handleRemoveFile}
                className="p-1 hover:bg-gray-200 rounded-full transition-colors flex-shrink-0 ml-2"
                title="Remove file"
                aria-label={`Remove file ${selectedFile.name}`}
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" aria-hidden="true" />
              </button>
            )}
          </div>
          
          {isLoading && uploadProgress > 0 && (
            <div className="mt-3" aria-live="polite">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Uploading...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2" role="progressbar" aria-valuenow={Math.round(uploadProgress)} aria-valuemin={0} aria-valuemax={100} aria-label={`Upload progress: ${Math.round(uploadProgress)}%`}>
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      
      <div className="text-xs text-gray-500">
        <p>• Only PDF files are supported</p>
        <p>• Maximum file size: 10MB</p>
        <p>• Ensure the document is clear and readable for best analysis results</p>
      </div>
    </div>
  );
};

export default FileUpload;