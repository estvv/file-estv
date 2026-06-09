import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

export function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    slug: string;
    url: string;
    originalName: string;
    size: number;
    expiresAt: string;
  } | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setError('');
      setUploadResult(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: false
  });

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Upload failed');
      }

      const data = await response.json();
      setUploadResult({
        slug: data.slug,
        url: `${window.location.origin}/d/${data.slug}`,
        originalName: data.originalName,
        size: data.size,
        expiresAt: new Date(data.expiresAt).toLocaleString()
      });
      setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleCopy = async () => {
    if (!uploadResult) return;
    
    try {
      await navigator.clipboard.writeText(uploadResult.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleUploadAnother = () => {
    setUploadResult(null);
    setFile(null);
    setError('');
  };

  if (uploadResult) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="max-w-md w-full px-6">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-neutral-900">Transfer</h1>
            <p className="text-neutral-400 text-sm mt-1">File uploaded successfully</p>
          </div>

          <div className="border border-neutral-200 rounded-lg p-6 mb-4">
            <div className="mb-4">
              <div className="text-sm text-neutral-500 mb-1">File</div>
              <div className="text-neutral-900 font-medium">{uploadResult.originalName}</div>
              <div className="text-neutral-400 text-sm">{formatSize(uploadResult.size)}</div>
            </div>

            <div className="mb-4">
              <div className="text-sm text-neutral-500 mb-1">Expires at</div>
              <div className="text-neutral-900">{uploadResult.expiresAt}</div>
            </div>

            <div className="bg-neutral-50 rounded p-3 border border-neutral-200">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 overflow-hidden">
                  <div className="text-neutral-900 text-sm font-medium truncate">{uploadResult.url}</div>
                </div>
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 border border-neutral-200 rounded transition-colors whitespace-nowrap"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={handleUploadAnother}
            className="w-full px-4 py-3 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors"
          >
            Upload another file
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="max-w-md w-full px-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-neutral-900">Transfer</h1>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-neutral-500 bg-neutral-50'
              : 'border-neutral-200 hover:border-neutral-400'
          }`}
        >
          <input {...getInputProps()} />
          
          {file ? (
            <div>
              <div className="text-neutral-900 font-medium mb-1">{file.name}</div>
              <div className="text-neutral-400 text-sm">{formatSize(file.size)}</div>
            </div>
          ) : (
            <div>
              <div className="text-neutral-600 mb-2">
                {isDragActive ? 'Drop the file here' : 'Drag and drop a file'}
              </div>
              <div className="text-neutral-400 text-sm">or click to browse (max 50MB)</div>
            </div>
          )}
        </div>

        {file && (
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full mt-4 px-4 py-3 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        )}
      </div>
    </div>
  );
}