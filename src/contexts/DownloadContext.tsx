import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface Download {
  id: number;
  url: string;
  filename: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  created_at: string;
  completed_at?: string;
  file_path?: string;
  error_message?: string;
}

interface DownloadStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}

interface DownloadContextType {
  downloads: Download[];
  stats: DownloadStats;
  addDownload: (url: string) => Promise<void>;
  refreshDownloads: () => Promise<void>;
  downloadFile: (id: number) => Promise<void>;
  loading: boolean;
}

const DownloadContext = createContext<DownloadContextType | undefined>(undefined);

export const useDownload = () => {
  const context = useContext(DownloadContext);
  if (context === undefined) {
    throw new Error('useDownload must be used within a DownloadProvider');
  }
  return context;
};

interface DownloadProviderProps {
  children: ReactNode;
}

export const DownloadProvider: React.FC<DownloadProviderProps> = ({ children }) => {
  const [downloads, setDownloads] = useState<Download[]>([]);
  const [stats, setStats] = useState<DownloadStats>({
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0
  });
  const [loading, setLoading] = useState(false);

  const refreshDownloads = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/downloads');
      setDownloads(response.data.downloads);
      setStats(response.data.stats);
    } catch (error) {
      console.error('Failed to fetch downloads:', error);
    } finally {
      setLoading(false);
    }
  };

  const addDownload = async (url: string) => {
    try {
      await axios.post('/downloads', { url });
      await refreshDownloads();
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to add download');
    }
  };

  const downloadFile = async (id: number) => {
    try {
      const response = await axios.get(`/downloads/${id}/file`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'download';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to download file');
    }
  };

  useEffect(() => {
    refreshDownloads();
    
    // Set up polling for status updates
    const interval = setInterval(refreshDownloads, 5000);
    return () => clearInterval(interval);
  }, []);

  const value = {
    downloads,
    stats,
    addDownload,
    refreshDownloads,
    downloadFile,
    loading
  };

  return (
    <DownloadContext.Provider value={value}>
      {children}
    </DownloadContext.Provider>
  );
};