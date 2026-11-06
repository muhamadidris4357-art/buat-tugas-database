import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Search, ChevronRight, ShieldAlert, AlertCircle, Activity } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate, COMPANY_STATUS_CONFIG } from '@/lib/utils';
import Button from '@/components/common/Button';
import SearchInput from '@/components/common/SearchInput';
import Badge from '@/components/common/Badge';
import Card from '@/components/common/Card';
import { Pagination } from '@/components/common/Pagination';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '@/components/common/Table';

export default function CompanyList() {
  const { user, isPlatformOwner } = useAuth();
  const navigate = useNavigate();

  const [companies, setCompanies] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 0 });
  const [filters, setFilters] = useState({ status: 'all', search: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompanies();
  }, [filters, user?.id]);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const params: any = {
        status: filters.status,
        search: filters.search,
        page: pagination.page,
        limit: pagination.limit,
      };
      if (!isPlatformOwner()) {
        // non-owner should not be here, but guard
      }
      const res = await api.get('/companies', { params });
      setCompanies(res.data.companies || []);
      setPagination((prev) => ({ ...prev, ...res.data.pagination }));
    } catch (err: any) {
      console.error('Fetch companies error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (c: any) => {
    const newStatus = c.status === 'active' ? 'suspended' : 'active';
    try {
      await api.put(`/companies/${c.id}/status`, { status: newStatus });
      fetchCompanies();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Gagal mengubah status perusahaan.');
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-full">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4" />
        <p className="text-gray-400">Memuat perusahaan...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Manajemen Perusahaan</h1>
          <p className="text-gray-400">Kelola seluruh perusahaan yang terdaftar di platform.</p>
        </div>
      </div>

      <Card padded={false} className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <div className="col-span-1 sm:col-span-2 lg:col-span-3">
            <SearchInput value={filters.search} onChange={(v) => setFilters({ ...filters, search: v })} placeholder="Cari nama atau kode perusahaan..." />
          </div>
          <div>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg bg-gray-900/50 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="suspended">Suspend</option>
              <option value="trial">Trial</option>
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
                <TableHead>Nama Perusahaan</TableHead>
                <TableHead className="text-center">Kode</TableHead>
                <TableHead>Industri</TableHead>
                <TableHead>Negara</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Anggota</TableHead>
                <TableHead className="text-center">Tugas</TableHead>
                <TableHead className="text-right w-24">Aksi</TableHead>
              </tr>
            </thead>
            <tbody>
              {companies.map((c) => {
                const statusConfig = COMPANY_STATUS_CONFIG[c.status] || COMPANY_STATUS_CONFIG.active;
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs text-gray-500">{c.id.replace('comp_', '')}</TableCell>
                    <TableCell className="font-medium text-white">{c.name}</TableCell>
                    <TableCell className="text-center text-gray-400 font-mono">{c.code}</TableCell>
                    <TableCell className="text-gray-400">{c.industry}</TableCell>
                    <TableCell className="text-gray-400">{c.country}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={statusConfig.color === 'text-green-400' ? 'success' : statusConfig.color === 'text-red-400' ? 'danger' : 'warning'}>
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center text-gray-400">{c.user_count ?? 0}</TableCell>
                    <TableCell className="text-center text-gray-400">{c.task_count ?? 0}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(c)}
                          className="text-gray-400 hover:text-white p-1"
                        >
                          <ShieldAlert className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {companies.length === 0 && (
                <tr><td colSpan={9} className="text-center py-8 text-gray-500">Belum ada perusahaan.</td></tr>
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
