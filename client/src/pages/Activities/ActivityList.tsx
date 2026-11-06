import { useState, useEffect } from 'react';
import { Activity, Search, ChevronRight, ShieldAlert, Clock } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate } from '@/lib/utils';
import Card from '@/components/common/Card';
import SearchInput from '@/components/common/SearchInput';
import Badge from '@/components/common/Badge';

export default function ActivityList() {
  const { user, isPlatformOwner } = useAuth();
  const [activities, setActivities] = useState<any[]>([]);
  const [filters, setFilters] = useState({ entityType: 'all', search: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, [filters, user?.id]);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const params: any = {
        entityType: filters.entityType,
        search: filters.search,
        limit: 50,
      };
      const res = await api.get('/activities', { params });
      setActivities(res.data.activities || []);
    } catch (err: any) {
      console.error('Fetch activities error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-full">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4" />
        <p className="text-gray-400">Memuat aktivitas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Riwayat Aktivitas</h1>
          <p className="text-gray-400">Pantau aktivitas pengguna dan perusahaan di platform.</p>
        </div>
      </div>

      <Card padded={false} className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <div className="col-span-1 sm:col-span-2 lg:col-span-3">
            <SearchInput value={filters.search} onChange={(v) => setFilters({ ...filters, search: v })} placeholder="Cari aksi atau detail..." />
          </div>
          <div>
            <select
              value={filters.entityType}
              onChange={(e) => setFilters({ ...filters, entityType: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg bg-gray-900/50 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Semua Tipe</option>
              <option value="task">Tugas</option>
              <option value="report">Laporan</option>
              <option value="company">Perusahaan</option>
              <option value="user">Pengguna</option>
              <option value="reminder">Pengingat</option>
              <option value="auth">Autentikasi</option>
            </select>
          </div>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Waktu</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Pengguna</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Perusahaan</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase text-center">Tipe Entitas</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Aksi</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Detail</th>
              </tr>
            </thead>
            <tbody>
              {activities.map((a) => (
                <tr key={a.id} className="border-b border-gray-700/50">
                  <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(a.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center text-[10px] text-gray-300">
                        {a.user_name?.charAt(0) || '?'}
                      </div>
                      <span className="text-sm text-gray-300">{a.user_name || '-'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{a.company_name || '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant="gray">{a.entity_type}</Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-300">{a.action}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs truncate max-w-xs">{a.details || '-'}</td>
                </tr>
              ))}
              {activities.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-gray-500">Belum ada aktivitas tercatat.</td></tr>
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
