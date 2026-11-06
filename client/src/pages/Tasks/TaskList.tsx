import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ClipboardList,
  Plus,
  Search,
  Filter,
  User,
  ChevronRight,
  MoreHorizontal,
  Clock,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate, STATUS_CONFIG, PRIORITY_CONFIG, ROLE_CONFIG } from '@/lib/utils';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import SearchInput from '@/components/common/SearchInput';
import Badge from '@/components/common/Badge';
import Card from '@/components/common/Card';
import { Pagination } from '@/components/common/Pagination';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '@/components/common/Table';

export default function TaskList() {
  const { user, isCompanyAdmin, isPlatformOwner, isEmployee } = useAuth();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 0 });
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    search: '',
    category: 'all',
  });
  const [loading, setLoading] = useState(true);

  const CATEGORIES = ['General', 'Development', 'Design', 'Marketing', 'Operations', 'HR'];

  useEffect(() => {
    fetchTasks();
  }, [filters, user?.id]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const params: any = {
        status: filters.status,
        priority: filters.priority,
        search: filters.search,
        category: filters.category,
        page: pagination.page,
        limit: pagination.limit,
      };
      if (isPlatformOwner() && filters.status !== 'all') params.status = filters.status;
      const res = await api.get('/tasks', { params });
      setTasks(res.data.tasks || []);
      setPagination((prev) => ({ ...prev, ...res.data.pagination }));
    } catch (err: any) {
      console.error('Fetch tasks error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    navigate('/tasks/create');
  };

  const handleView = (task: any) => {
    navigate(`/tasks/${task.id}`);
  };

  const handleStatusUpdate = async (task: any, status: string) => {
    const myAssignment = task.assignments?.find((a: any) => a.user_id === user?.id);
    if (!myAssignment) return;
    try {
      await api.put(`/tasks/${task.id}/assignment`, {
        status,
        progressPercent: status === 'completed' ? 100 : myAssignment.progress_percent,
      });
      fetchTasks();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Gagal memperbarui status.');
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-full">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4" />
        <p className="text-gray-400">Memuat tugas...</p>
      </div>
    );
  }

  const roleConfig = user ? ROLE_CONFIG[user.role] : ROLE_CONFIG.EMPLOYEE;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Manajemen Tugas</h1>
          <p className="text-gray-400">
            {isEmployee() ? 'Tugas yang ditugaskan kepada Anda.' : 'Kelola tugas dan anggota tim perusahaan.'}
          </p>
        </div>
        {(isCompanyAdmin() || isPlatformOwner()) && (
          <Button variant="primary" onClick={handleCreate} className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Buat Tugas
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card padded={false} className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className="col-span-1 sm:col-span-2 lg:col-span-3">
            <SearchInput value={filters.search} onChange={(v) => setFilters({ ...filters, search: v })} placeholder="Cari tugas..." />
          </div>
          <div>
            <Input
              label="Status"
              type="select"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="all">Semua Status</option>
              <option value="pending">Tertunda</option>
              <option value="in_progress">Dikerjakan</option>
              <option value="in_review">Direview</option>
              <option value="completed">Selesai</option>
              <option value="blocked">Diblokir</option>
            </Input>
          </div>
          <div>
            <Input
              label="Prioritas"
              type="select"
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
            >
              <option value="all">Semua Prioritas</option>
              <option value="low">Rendah</option>
              <option value="medium">Sedang</option>
              <option value="high">Tinggi</option>
              <option value="urgent">Mendesak</option>
            </Input>
          </div>
          <div className="col-span-1 sm:col-span-2 lg:col-span-2">
            <Input
              label="Kategori"
              type="select"
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            >
              <option value="all">Semua Kategori</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Input>
          </div>
          <div className="col-span-1 sm:col-span-2 lg:col-span-1 flex items-end">
            <Button variant="ghost" onClick={() => setFilters({ status: 'all', priority: 'all', search: '', category: 'all' })} className="w-full">
              Reset
            </Button>
          </div>
        </div>
      </Card>

      {/* Tasks Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-700">
                <TableHead className="w-20">ID</TableHead>
                <TableHead>Judul</TableHead>
                <TableHead className="text-center">Prioritas</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Tanggal Jatuh Tempo</TableHead>
                {isEmployee() ? (
                  <TableHead className="text-center">Status Saya</TableHead>
                ) : (
                  <TableHead className="text-center">Ditugaskan</TableHead>
                )}
                <TableHead className="text-right w-20">Aksi</TableHead>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t) => {
                const myAssign = t.my_assignment || (t.assignments?.[0]);
                return (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-xs text-gray-500">{t.id.replace('tsk_', '')}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="font-medium text-white truncate block max-w-md" title={t.title}>{t.title}</span>
                      </div>
                      <p className="text-xs text-gray-500 truncate max-w-md">{t.description || '-'}</p>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={PRIORITY_CONFIG[t.priority]?.color === 'text-orange-400' ? 'danger' : t.priority === 'high' ? 'warning' : t.priority === 'medium' ? 'primary' : 'gray'}>
                        {t.priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={t.status === 'completed' ? 'success' : t.status === 'in_progress' ? 'primary' : t.status === 'blocked' ? 'danger' : 'gray'}>
                        {t.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={cn('text-xs', t.due_date ? 'text-gray-300' : 'text-gray-500')}>
                        {t.due_date ? formatDate(t.due_date) : '-'}
                      </span>
                    </TableCell>
                    {isEmployee() ? (
                      <TableCell className="text-center">
                        <Badge variant={myAssign?.status === 'completed' ? 'success' : myAssign?.status === 'in_progress' ? 'primary' : 'gray'}>
                          {myAssign?.status || 'pending'}
                        </Badge>
                      </TableCell>
                    ) : (
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          {(t.assignments || []).slice(0, 3).map((a: any) => (
                            <div key={a.user_id} className="w-6 h-6 rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center text-[10px] text-gray-300">
                              {a.user_name?.charAt(0) || '?'}
                            </div>
                          ))}
                          {t.assignments?.length > 3 && (
                            <div className="w-6 h-6 rounded-full bg-gray-800 border border-gray-600 flex items-center justify-center text-[10px] text-gray-400">
                              +{t.assignments.length - 3}
                            </div>
                          )}
                        </div>
                      </TableCell>
                    )}
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleView(t)} className="text-blue-400 hover:text-blue-300 p-1.5">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {tasks.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-500">
                    Belum ada tugas yang sesuai.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          limit={pagination.limit}
          onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
        />
      </Card>
    </div>
  );
}

function cn(...classes: (string | undefined | null | boolean)[]): string {
  return classes.filter(Boolean).join(' ');
}
