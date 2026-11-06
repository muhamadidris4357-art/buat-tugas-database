import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Clock, CheckCircle, AlertCircle, User, ChevronRight } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate } from '@/lib/utils';
import Badge from '@/components/common/Badge';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';

export default function ReminderList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reminders, setReminders] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReminders();
  }, [filter, user?.id]);

  const fetchReminders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reminders', { params: { unreadOnly: filter === 'unread' ? 'true' : undefined } });
      setReminders(res.data.reminders || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      console.error('Fetch reminders error:', err);
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (id: string) => {
    try {
      await api.put(`/reminders/${id}/read`);
      fetchReminders();
    } catch (err) {
      // ignore
    }
  };

  const markAllRead = async () => {
    try {
      await api.put('/reminders/read-all');
      fetchReminders();
    } catch (err) {
      // ignore
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-full">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4" />
        <p className="text-gray-400">Memuat pengingat...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Manajemen Pengingat</h1>
          <p className="text-gray-400">Notifikasi dan pengingat tugas serta laporan untuk Anda.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={markAllRead} className="text-xs px-3 py-2 text-gray-400 hover:text-white">
            Tandai semua dibaca
          </Button>
        </div>
      </div>

      <div className="flex gap-3 mb-2">
        <button
          onClick={() => setFilter('all')}
          className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-colors', filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700')}
        >
          Semua ({reminders.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-colors', filter === 'unread' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700')}
        >
          Belum Dibaca ({unreadCount})
        </button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Judul</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Pesan</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase text-center">Prioritas</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase text-center">Tanggal</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase text-center">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {reminders.map((r) => (
                <tr key={r.id} className={cn('border-b border-gray-700 hover:bg-gray-800/30 transition-colors', r.is_read ? '' : 'bg-blue-900/10')}>
                  <td className="px-4 py-3">
                    <span className="font-medium text-white">{r.title}</span>
                    {r.creator_name && (
                      <p className="text-xs text-gray-500 mt-1">Oleh: {r.creator_name}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-300 truncate max-w-xs">{r.message}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={r.priority === 'urgent' ? 'danger' : r.priority === 'warning' ? 'warning' : 'info'}>
                      {r.priority}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-400 text-xs">
                    {formatDate(r.due_date)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={r.is_read ? 'success' : 'gray'}>
                      {r.is_read ? 'Dibaca' : 'Baru'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!r.is_read && (
                      <Button variant="ghost" size="sm" onClick={() => markRead(r.id)} className="text-blue-400 hover:text-blue-300 p-1">
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {reminders.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-gray-500">Belum ada pengingat.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function cn(...classes: (string | undefined | null | boolean)[]): string {
  return classes.filter(Boolean).join(' ');
}
