import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Users, Plus, Search, ChevronRight, ShieldAlert, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate, ROLE_CONFIG } from '@/lib/utils';
import Button from '@/components/common/Button';
import SearchInput from '@/components/common/SearchInput';
import Badge from '@/components/common/Badge';
import Card from '@/components/common/Card';
import { Pagination } from '@/components/common/Pagination';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '@/components/common/Table';

export default function UserList() {
  const { user, isCompanyAdmin, isPlatformOwner } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 0 });
  const [filters, setFilters] = useState({ role: 'all', status: 'all', search: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, [filters, user?.id, user?.company_id]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params: any = {
        role: filters.role,
        status: filters.status,
        search: filters.search,
        page: pagination.page,
        limit: pagination.limit,
      };
      if (isPlatformOwner()) {
        // can filter by company_id optionally
      } else if (isCompanyAdmin()) {
        // company admin sees their company only
      }
      const res = await api.get('/users', { params });
      setUsers(res.data.users || []);
      setPagination((prev) => ({ ...prev, ...res.data.pagination }));
    } catch (err: any) {
      console.error('Fetch users error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (u: any) => {
    const newStatus = u.status === 'active' ? 'inactive' : 'active';
    try {
      await api.put(`/users/${u.id}/status`, { status: newStatus });
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Gagal mengubah status.');
    }
  };

  const handleChangeRole = async (u: any) => {
    const newRole = window.prompt(`Ubah role untuk ${u.name} (COMPANY_ADMIN/EMPLOYEE):`, u.role);
    if (!newRole) return;
    try {
      await api.put(`/users/${u.id}/role`, { role: newRole });
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Gagal mengubah role.');
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-full">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4" />
        <p className="text-gray-400">Memuat pengguna...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Manajemen Pengguna</h1>
          <p className="text-gray-400">Kelola akun karyawan dan admin dalam perusahaan.</p>
        </div>
        {(isCompanyAdmin() || isPlatformOwner()) && (
          <Button variant="primary" onClick={() => navigate('/users/create')} className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Tambah Pengguna
          </Button>
        )}
      </div>

      <Card padded={false} className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <div className="col-span-1 sm:col-span-2 lg:col-span-3">
            <SearchInput value={filters.search} onChange={(v) => setFilters({ ...filters, search: v })} placeholder="Cari nama atau email..." />
          </div>
          <div>
            <select
              value={filters.role}
              onChange={(e) => setFilters({ ...filters, role: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg bg-gray-900/50 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Semua Role</option>
              <option value="COMPANY_ADMIN">Admin Perusahaan</option>
              <option value="EMPLOYEE">Karyawan</option>
            </select>
          </div>
          <div>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg bg-gray-900/50 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
          </div>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-700">
                <TableHead className="w-20">ID</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-center">Role</TableHead>
                <TableHead className="text-center">Jabatan</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Tugas Selesai</TableHead>
                <TableHead className="text-right w-24">Aksi</TableHead>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const roleConfig = ROLE_CONFIG[u.role] || ROLE_CONFIG.EMPLOYEE;
                return (
                  <TableRow key={u.id}>
                    <TableCell className="font-mono text-xs text-gray-500">{u.id.replace('usr_', '')}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center text-[10px] text-gray-300">
                          {u.name?.charAt(0)}
                        </div>
                        <span className="font-medium text-white">{u.name}</span>
                      </div>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </TableCell>
                    <TableCell className="font-medium text-white">{u.email}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={roleConfig.color === 'text-purple-400' ? 'primary' : roleConfig.color === 'text-blue-400' ? 'primary' : 'gray'}>
                        {roleConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center text-gray-400 text-xs">{u.job_title || '-'}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={u.status === 'active' ? 'success' : 'danger'}>
                        {u.status === 'active' ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center text-gray-400">
                      {u.completed_tasks_count ?? 0} / {u.assigned_tasks_count ?? 0}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {(isCompanyAdmin() || isPlatformOwner()) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(u)}
                            className="text-gray-400 hover:text-white p-1"
                          >
                            <ShieldAlert className="h-4 w-4" />
                          </Button>
                        )}
                        {(isCompanyAdmin() || isPlatformOwner()) && u.role !== 'PLATFORM_OWNER' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleChangeRole(u)}
                            className="text-blue-400 hover:text-blue-300 p-1"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {users.length === 0 && (
                <tr><td colSpan={8} className="text-center py-8 text-gray-500">Belum ada pengguna.</td></tr>
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
