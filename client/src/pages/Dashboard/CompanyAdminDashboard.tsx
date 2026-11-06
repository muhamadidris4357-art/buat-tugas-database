import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  FileText,
  Bell,
  Users,
  Building2,
  Activity,
  BarChart3,
  ChevronRight,
  Clock,
} from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate, ROLE_CONFIG } from '@/lib/utils';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '@/components/common/Table';

export default function CompanyAdminDashboard() {
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
  const tasks = s?.tasks || {};
  const team = s?.team || {};
  const reports = s?.reports || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Perusahaan Dashboard</h1>
          <p className="text-gray-400">Kelola tugas, karyawan, dan laporan untuk perusahaan Anda.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="primary" onClick={() => navigate('/tasks')}>
            Buat Tugas Baru
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Tugas"
          value={tasks.total ?? 0}
          subtitle="Semua tugas perusahaan"
          icon={ClipboardList}
          color="text-blue-400 bg-blue-900/30 border border-blue-500/30"
        />
        <StatCard
          title="Selesai"
          value={tasks.completed ?? 0}
          subtitle={tasks.completionRate ? `(${tasks.completionRate}% selesai)` : ''}
          icon={Clock}
          color="text-green-400 bg-green-900/30 border border-green-500/30"
        />
        <StatCard
          title="Anggota Aktif"
          value={team.active ?? 0}
          subtitle="Karyawan dalam perusahaan"
          icon={Users}
          color="text-green-400 bg-green-900/30 border border-green-500/30"
        />
        <StatCard
          title="Pengingat Belum Dibaca"
          value={s?.unreadReminders ?? 0}
          subtitle="Notifikasi baru"
          icon={Bell}
          color="text-orange-400 bg-orange-900/30 border border-orange-500/30"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Overview */}
        <Card className="col-span-1 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Tugas Perusahaan</h2>
            <Link to="/tasks" className="text-sm text-blue-400 hover:text-blue-300">Kelola semua tugas <ChevronRight className="ml-1 h-4 w-4" /></Link>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <MiniStat label="Tertunda" value={tasks.pending ?? 0} color="text-gray-400 bg-gray-800/50 border border-gray-700" />
            <MiniStat label="Dikerjakan" value={tasks.in_progress ?? 0} color="text-blue-400 bg-blue-900/30 border border-blue-500/30" />
            <MiniStat label="Direview" value={0} color="text-purple-400 bg-purple-900/30 border border-purple-500/30" />
            <MiniStat label="Diblokir" value={tasks.blocked ?? 0} color="text-red-400 bg-red-900/30 border border-red-500/30" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-700">
                  <TableHead>Prioritas</TableHead>
                  <TableHead>Jumlah</TableHead>
                </tr>
              </thead>
              <tbody>
                {(s?.priorityBreakdown || []).map((p: any) => (
                  <TableRow key={p.priority}>
                    <TableCell className="font-medium text-white">{p.priority}</TableCell>
                    <TableCell className="text-right text-gray-300">{p.count}</TableCell>
                  </TableRow>
                ))}
                {(s?.priorityBreakdown || []).length === 0 && (
                  <tr><td colSpan={2} className="text-center py-4 text-gray-500">Belum ada data prioritas.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Team Overview */}
        <Card className="col-span-1 lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Tim Perusahaan</h2>
            <Link to="/users" className="text-sm text-blue-400 hover:text-blue-300">Kelola karyawan <ChevronRight className="ml-1 h-4 w-4" /></Link>
          </div>
          <div className="space-y-3">
            {(s?.teamOverview || []).map((member: any) => (
              <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-800/30 border border-gray-700/50">
                <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-xs text-gray-300">
                  {member.name?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{member.name}</p>
                  <p className="text-xs text-gray-400 truncate">{member.job_title}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-blue-400">{member.completed_count ?? 0}</p>
                  <p className="text-xs text-gray-500">selesai</p>
                </div>
              </div>
            ))}
            {(s?.teamOverview || []).length === 0 && (
              <p className="text-center py-3 text-gray-500 text-sm">Belum ada karyawan.</p>
            )}
          </div>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Aktivitas Perusahaan Terkini</h2>
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

function StatCard({ title, value, subtitle, icon: Icon, color }: { title: string; value: number; subtitle: string; icon: React.ElementType; color: string }) {
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

function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={cn('p-3 rounded-lg border', color.split(' ')[1] ?? 'bg-gray-800')}>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm font-bold text-white">{value}</p>
    </div>
  );
}

function cn(...classes: (string | undefined | null | boolean)[]): string {
  return classes.filter(Boolean).join(' ');
}
