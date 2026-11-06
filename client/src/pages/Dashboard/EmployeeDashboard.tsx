import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  FileText,
  Bell,
  Clock,
  ShieldAlert,
  Activity,
  ChevronRight,
} from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate } from '@/lib/utils';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '@/components/common/Table';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get('/stats/dashboard');
      setStats(res.data);
    } catch (err: any) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4" />
        <p className="text-gray-400">Memuat dashboard...</p>
      </div>
    );
  }

  const s = stats;
  const assignments = s?.assignments || {};
  const reports = s?.reports || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard Karyawan</h1>
          <p className="text-gray-400">Kelola tugas yang diberikan, laporan, dan pengingat Anda.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="primary" onClick={() => navigate('/reports')}>
            Kirim Laporan
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Tugas Saya" value={assignments.total ?? 0} icon={ClipboardList} color="text-blue-400 bg-blue-900/30 border border-blue-500/30" />
        <StatCard title="Selesai" value={assignments.completed ?? 0} icon={Clock} color="text-green-400 bg-green-900/30 border border-green-500/30" subtitle={assignments.completionRate ? `(${assignments.completionRate}%)` : ''} />
        <StatCard title="Laporan Diajukan" value={reports.total ?? 0} icon={FileText} color="text-orange-400 bg-orange-900/30 border border-orange-500/30" />
        <StatCard title="Pengingat Baru" value={s?.unreadReminders ?? 0} icon={Bell} color="text-purple-400 bg-purple-900/30 border border-purple-500/30" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Tasks */}
        <Card className="col-span-1 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Tugas Terdekat</h2>
            <Link to="/tasks" className="text-sm text-blue-400 hover:text-blue-300">Lihat semua tugas <ChevronRight className="ml-1 h-4 w-4" /></Link>
          </div>
          <div className="space-y-3">
            {(s?.upcomingTasks || []).slice(0, 6).map((t: any) => (
              <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-900 border border-gray-700">
                  <ClipboardList className="h-5 w-5 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{t.title}</p>
                  <p className="text-xs text-gray-400 truncate">{t.description || 'Tanpa deskripsi'}</p>
                </div>
                <div className="text-right">
                  <Badge variant={t.my_status === 'completed' ? 'success' : t.my_status === 'in_progress' ? 'primary' : 'gray'}>
                    {t.my_status === 'completed' ? 'Selesai' : t.my_status === 'in_progress' ? 'Dikerjakan' : 'Tertunda'}
                  </Badge>
                  <p className="text-xs text-gray-500 mt-1">{t.progress_percent ?? 0}%</p>
                </div>
              </div>
            ))}
            {(s?.upcomingTasks || []).length === 0 && (
              <p className="text-center py-4 text-gray-500">Belum ada tugas yang diberikan.</p>
            )}
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="col-span-1 lg:col-span-1">
          <h2 className="text-lg font-semibold text-white mb-4">Aksi Cepat</h2>
          <div className="space-y-3">
            <Button variant="primary" onClick={() => navigate('/tasks')} className="w-full">
              Lihat Tugas Saya
            </Button>
            <Button variant="secondary" onClick={() => navigate('/reports')} className="w-full">
              Kirim Laporan Pekerjaan
            </Button>
            <Button variant="ghost" onClick={() => navigate('/reminders')} className="w-full">
              Lihat Pengingat
            </Button>
            <Button variant="ghost" onClick={() => navigate('/profile')} className="w-full">
              Profil Saya
            </Button>
          </div>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Aktivitas Terkini</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-700">
                <TableHead>Waktu</TableHead>
                <TableHead>Pengguna</TableHead>
                <TableHead>Aksi</TableHead>
                <TableHead>Detail</TableHead>
              </tr>
            </thead>
            <tbody>
              {(s?.recentActivities || []).slice(0, 8).map((a: any) => (
                <TableRow key={a.id}>
                  <TableCell className="text-gray-400 text-xs">{formatDate(a.created_at)}</TableCell>
                  <TableCell className="font-medium text-white">{a.user_name || '-'}</TableCell>
                  <TableCell className="text-gray-300">{a.action}</TableCell>
                  <TableCell className="text-gray-400 text-xs truncate max-w-xs">{a.details || '-'}</TableCell>
                </TableRow>
              ))}
              {(s?.recentActivities || []).length === 0 && (
                <tr><td colSpan={4} className="text-center py-4 text-gray-500">Belum ada aktivitas tercatat.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, subtitle }: { title: string; value: number; icon: React.ElementType; color: string; subtitle?: string }) {
  return (
    <Card padded={false} className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className="w-10 h-10 rounded-lg flex items-center justify-center {color.split(' ')[1] ?? 'bg-gray-800'}">
          <Icon className={cn('h-5 w-5', color.split(' ')[0])} />
        </div>
      </div>
    </Card>
  );
}

function cn(...classes: (string | undefined | null | boolean)[]): string {
  return classes.filter(Boolean).join(' ');
}
