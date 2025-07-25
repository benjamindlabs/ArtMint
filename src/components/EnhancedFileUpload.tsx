import { useState, useCallback, useRef } from 'react';
import { FiUpload, FiX, FiFile, FiImage, FiVideo, FiMusic, FiAlertCircle } from 'react-icons/fi';

interface FileWithPreview extends File {
  preview?: string;
  id: string;
}

interface EnhancedFileUploadProps {
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  acceptedTypes?: string[];
  maxSize?: number; // in MB
  currentFile?: File | null;
  className?: string;
}

export default function EnhancedFileUpload({
  onFileSelect,
  onFileRemove,
  acceptedTypes = ['image/*', 'video/*', 'audio/*'],
  maxSize = 100,
  currentFile,
  className = ''
}: EnhancedFileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File validation
  const validateFile = (file: File): string | null => {
    // Size check
    if (file.size > maxSize * 1024 * 1024) {
      return `File size must be less than ${maxSize}MB`;
    }

    // Type check
    const isValidType = acceptedTypes.some(type => {
      if (type.endsWith('/*')) {
        const category = type.split('/')[0];
        return file.type.startsWith(category);
      }
      return file.type === type;
    });

    if (!isValidType) {
      return `File type not supported. Accepted types: ${acceptedTypes.join(', ')}`;
    }

    return null;
  };

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    onFileSelect(file);

    // Create preview for images and videos
    if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
    } else {
      setPreview(null);
    }
  }, [onFileSelect, maxSize, acceptedTypes]);

  // Handle file removal
  const handleFileRemove = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }
    setError(null);
    onFileRemove();
  };

  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, [handleFileSelect]);

  // File input change handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  // Get file icon
  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return FiImage;
    if (file.type.startsWith('video/')) return FiVideo;
    if (file.type.startsWith('audio/')) return FiMusic;
    return FiFile;
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`w-full ${className}`}>
      {!currentFile ? (
        // Upload area
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
            dragActive
              ? 'border-purple-400 bg-purple-50 dark:bg-purple-900/20'
              : error
              ? 'border-red-300 bg-red-50 dark:bg-red-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-purple-400 hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={acceptedTypes.join(',')}
            onChange={handleInputChange}
          />

          <div className="space-y-4">
            <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center ${
              error ? 'bg-red-100 dark:bg-red-900/30' : 'bg-gray-100 dark:bg-gray-700'
            }`}>
              {error ? (
                <FiAlertCircle className="w-6 h-6 text-red-500" />
              ) : (
                <FiUpload className="w-6 h-6 text-gray-400" />
              )}
            </div>

            <div>
              <h3 className={`text-lg font-medium ${
                error ? 'text-red-900 dark:text-red-300' : 'text-gray-900 dark:text-white'
              }`}>
                {error ? 'Upload Error' : 'Drop files here or click to browse'}
              </h3>
              <p className={`mt-1 text-sm ${
                error ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
              }`}>
                {error || `Supports ${acceptedTypes.join(', ')} up to ${maxSize}MB`}
              </p>
            </div>

            {!error && (
              <div className="text-xs text-gray-400 space-y-1">
                <p>Recommended: High resolution images (1000x1000px or larger)</p>
                <p>Supported formats: JPG, PNG, GIF, MP4, WebM, MP3, WAV</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        // File preview
        <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
          <div className="flex items-start space-x-4">
            {/* Preview */}
            <div className="flex-shrink-0">
              {preview ? (
                currentFile.type.startsWith('image/') ? (
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                ) : currentFile.type.startsWith('video/') ? (
                  <video
                    src={preview}
                    className="w-20 h-20 object-cover rounded-lg"
                    muted
                  />
                ) : null
              ) : (
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  {(() => {
                    const IconComponent = getFileIcon(currentFile);
                    return <IconComponent className="w-8 h-8 text-gray-400" />;
                  })()}
                </div>
              )}
            </div>

            {/* File info */}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {currentFile.name}
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {formatFileSize(currentFile.size)} • {currentFile.type}
              </p>
              
              {currentFile.type.startsWith('image/') && (
                <p className="text-xs text-gray-400 mt-1">
                  Ready for NFT creation
                </p>
              )}
            </div>

            {/* Remove button */}
            <button
              onClick={handleFileRemove}
              className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
