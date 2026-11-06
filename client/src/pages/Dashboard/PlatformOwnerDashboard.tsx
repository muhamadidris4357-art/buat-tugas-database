import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Building2,
  Users,
  ClipboardList,
  FileText,
  TrendingUp,
  AlertCircle,
  ShieldAlert,
  Activity,
  ChevronRight,
} from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate, COMPANY_STATUS_CONFIG, ROLE_CONFIG } from '@/lib/utils';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '@/components/common/Table';

interface StatCard {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ElementType;
  color: string;
}

const STAT_CONFIG: Record<string, StatCard> = {
  companies: {
    title: 'Total Perusahaan',
    value: 0,
    subtitle: 'Perusahaan terdaftar di platform',
    icon: Building2,
    color: 'text-purple-400 bg-purple-900/30 border border-purple-500/30',
  },
  users: {
    title: 'Total Pengguna',
    value: 0,
    subtitle: 'Admin dan karyawan aktif',
    icon: Users,
    color: 'text-blue-400 bg-blue-900/30 border border-blue-500/30',
  },
  tasks: {
    title: 'Total Tugas',
    value: 0,
    subtitle: 'Seluruh tugas di platform',
    icon: ClipboardList,
    color: 'text-green-400 bg-green-900/30 border border-green-500/30',
  },
  reports: {
    title: 'Total Laporan',
    value: 0,
    subtitle: 'Laporan pekerjaan yang dikirim',
    icon: FileText,
    color: 'text-orange-400 bg-orange-900/30 border border-orange-500/30',
  },
};

export default function PlatformOwnerDashboard() {
  const { user, state } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [companies, setCompanies] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, companiesRes, actsRes] = await Promise.all([
        api.get('/stats/dashboard'),
        api.get('/companies'),
        api.get('/activities?limit=8'),
      ]);
      setStats(statsRes.data);
      setCompanies(companiesRes.data.companies || []);
      setRecentActivities(actsRes.data.activities || []);
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
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Platform Owner Dashboard</h1>
          <p className="text-gray-400">Ringkasan seluruh perusahaan dan pengguna di platform TaskSphere.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="primary" onClick={() => navigate('/companies')}>
            Kelola Perusahaan
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[STAT_CONFIG.companies, STAT_CONFIG.users, STAT_CONFIG.tasks, STAT_CONFIG.reports].map((card) => {
          const key = card.title.toLowerCase().includes('perusahaan') ? 'companies'
            : card.title.toLowerCase().includes('pengguna') ? 'users'
            : card.title.toLowerCase().includes('tugas') ? 'tasks' : 'reports';
          const value = key === 'companies' ? s?.companies?.total
            : key === 'users' ? s?.users?.total
            : key === 'tasks' ? s?.tasks?.total
            : s?.reports?.total;
          return (
            <Card key={key} padded={false} className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">{card.title}</p>
                  <p className="text-3xl font-bold text-white">{value ?? 0}</p>
                  <p className="text-xs text-gray-500 mt-1">{card.subtitle}</p>
                </div>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center {card.color.split(' ')[1] ?? 'bg-gray-800'}">
                  <card.icon className="h-5 w-5 {card.color.split(' ')[0]}" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Companies */}
        <Card className="col-span-1 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Perusahaan Terbaru</h2>
            <Link to="/companies" className="text-sm text-blue-400 hover:text-blue-300">Lihat semua <ChevronRight className="ml-1 h-4 w-4" /></Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-700">
                  <TableHead>Nama Perusahaan</TableHead>
                  <TableHead>Kode</TableHead>
                  <TableHead>Industri</TableHead>
                  <TableHead>Negara</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Anggota</TableHead>
                </tr>
              </thead>
              <tbody>
                {(companies || []).slice(0, 8).map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium text-white">{c.name}</TableCell>
                    <TableCell className="text-gray-400 font-mono">{c.code}</TableCell>
                    <TableCell className="text-gray-400">{c.industry}</TableCell>
                    <TableCell className="text-gray-400">{c.country}</TableCell>
                    <TableCell>
                      <Badge variant={c.status === 'active' ? 'success' : c.status === 'suspended' ? 'danger' : 'warning'}>
                        {c.status === 'active' ? 'Aktif' : c.status === 'suspended' ? 'Suspend' : 'Trial'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-gray-400">{c.user_count ?? 0}</TableCell>
                  </TableRow>
                ))}
                {(companies || []).length === 0 && (
                  <tr><td colSpan={6} className="text-center py-4 text-gray-500">Belum ada perusahaan terdaftar.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Quick Stats / Role info */}
        <Card className="col-span-1 lg:col-span-1">
          <h2 className="text-lg font-semibold text-white mb-4">Informasi Akun Anda</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 border border-gray-700">
              <ShieldAlert className="h-5 w-5 text-purple-400" />
              <div>
                <p className="text-sm font-medium text-white">{user?.name}</p>
                <p className="text-xs text-gray-400">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 border border-gray-700">
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', ROLE_CONFIG[user?.role || 'PLATFORM_OWNER'].bg)}>
                <span className={cn('text-xs font-bold', ROLE_CONFIG[user?.role || 'PLATFORM_OWNER'].color)}>{user?.role}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-white">Platform Owner</p>
                <p className="text-xs text-gray-400">Akses penuh ke seluruh platform</p>
              </div>
            </div>
            <div className="pt-4 border-t border-gray-700">
              <p className="text-xs text-gray-500 mb-2">Perusahaan Aktif</p>
              <p className="text-lg font-bold text-green-400">{s?.companies?.active ?? 0}</p>
              <p className="text-xs text-red-400 mt-1">{s?.companies?.suspended ?? 0} perusahaan dinonaktifkan</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Aktivitas Platform Terkini</h2>
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
              {(recentActivities || []).slice(0, 10).map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="text-gray-400 text-xs">{formatDate(a.created_at)}</TableCell>
                  <TableCell className="font-medium text-white">{a.user_name || '-'}</TableCell>
                  <TableCell className="text-gray-300">{a.action}</TableCell>
                  <TableCell className="text-gray-400 text-xs truncate max-w-xs">{a.details || '-'}</TableCell>
                </TableRow>
              ))}
              {(recentActivities || []).length === 0 && (
                <tr><td colSpan={4} className="text-center py-4 text-gray-500">Belum ada aktivitas tercatat.</td></tr>
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
