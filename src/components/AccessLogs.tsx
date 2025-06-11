import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface AccessLog {
  id: number;
  status: string;
  user: string;
  location: string;
  timestamp: string;
  deviceId: string;
  image?: string;
}

const AccessLogs: React.FC = () => {
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8000/api/access/logs');
      setLogs(response.data);
    } catch (err) {
      console.error('خطأ في جلب سجل المحاولات:', err);
      setError('فشل في جلب سجل المحاولات. حاولي مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div>جاري التحميل...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">سجل الوصول</h1>
      <div className="space-y-4">
        {logs.map((log) => (
          <div
            key={log.id}
            className="flex justify-between items-center p-4 bg-gray-800 rounded-lg shadow-md"
          >
            <span className={log.status === 'Success' ? 'text-green-500' : 'text-red-500'}>
              {log.status === 'Success' ? 'نجاح' : 'فشل'}
            </span>
            <span>{log.user}</span>
            <span>{log.location}</span>
            <span>{new Date(log.timestamp).toLocaleString('ar-EG')}</span>
            <span>{log.deviceId}</span>
            {log.image && (
              <img src={log.image} alt="محاولة التعرف" className="w-12 h-12 rounded-full" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AccessLogs;