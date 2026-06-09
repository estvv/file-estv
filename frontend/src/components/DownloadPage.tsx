import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

interface FileInfo {
  originalName: string;
  size: number;
  mimeType: string;
  downloads: number;
  expiresAt: string;
  remainingTime: string;
  isExpired: boolean;
}

export function DownloadPage() {
  const { slug } = useParams<{ slug: string }>();
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchFileInfo();
    }
  }, [slug]);

  const fetchFileInfo = async () => {
    try {
      const response = await fetch(`/api/info/${slug}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError('File not found');
        } else if (response.status === 410) {
          setError('File has expired');
        } else {
          setError('Failed to load file info');
        }
        return;
      }

      const data = await response.json();
      setFileInfo(data);
    } catch (err) {
      setError('Failed to load file info');
    } finally {
      setLoading(false);
    }
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDownload = async () => {
    if (!slug || downloading) return;

    setDownloading(true);
    
    try {
      const response = await fetch(`/api/download/${slug}`);
      
      if (!response.ok) {
        setError('Failed to download file');
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileInfo?.originalName || 'download';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Failed to download file');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-neutral-400">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="max-w-md w-full px-6">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">Transfer</h1>
            <p className="text-red-600">{error}</p>
          </div>
          <a
            href="/"
            className="block w-full px-4 py-3 bg-neutral-900 text-white text-center rounded-lg font-medium hover:bg-neutral-800 transition-colors"
          >
            Upload a new file
          </a>
        </div>
      </div>
    );
  }

  if (!fileInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-neutral-400">File not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="max-w-md w-full px-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-neutral-900">Transfer</h1>
          <p className="text-neutral-400 text-sm mt-1">Download your file</p>
        </div>

        <div className="border border-neutral-200 rounded-lg p-6 mb-4">
          <div className="mb-4">
            <div className="text-sm text-neutral-500 mb-1">File name</div>
            <div className="text-neutral-900 font-medium">{fileInfo.originalName}</div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-sm text-neutral-500 mb-1">Size</div>
              <div className="text-neutral-900">{formatSize(fileInfo.size)}</div>
            </div>
            <div>
              <div className="text-sm text-neutral-500 mb-1">Downloads</div>
              <div className="text-neutral-900">{fileInfo.downloads}</div>
            </div>
          </div>

          <div className="mb-4">
            <div className="text-sm text-neutral-500 mb-1">Expires in</div>
            <div className="text-neutral-900">{fileInfo.remainingTime}</div>
          </div>

          {fileInfo.isExpired && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">This file has expired</p>
            </div>
          )}
        </div>

        {!fileInfo.isExpired && (
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="w-full px-4 py-3 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {downloading ? 'Downloading...' : 'Download'}
          </button>
        )}

        <a
          href="/"
          className="block w-full mt-3 px-4 py-3 text-center text-neutral-600 hover:text-neutral-900"
        >
          Upload a new file
        </a>
      </div>
    </div>
  );
}