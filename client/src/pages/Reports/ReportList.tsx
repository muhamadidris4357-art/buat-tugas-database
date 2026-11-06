import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FileText, Plus, Search, ChevronRight, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate, STATUS_CONFIG, ROLE_CONFIG } from '@/lib/utils';
import Button from '@/components/common/Button';
import SearchInput from '@/components/common/SearchInput';
import Badge from '@/components/common/Badge';
import Card from '@/components/common/Card';
import { Pagination } from '@/components/common/Pagination';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '@/components/common/Table';

export default function ReportList() {
  const { user, isCompanyAdmin, isPlatformOwner, isEmployee } = useAuth();
  const navigate = useNavigate();

  const [reports, setReports] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 0 });
  const [filters, setFilters] = useState({ status: 'all', search: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, [filters, user?.id]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params: any = {
        status: filters.status,
        search: filters.search,
        page: pagination.page,
        limit: pagination.limit,
      };
      if (isPlatformOwner()) {
        // platform owner can filter by company via query, but default all
      } else if (isCompanyAdmin()) {
        // company admin sees their company only
      }
      const res = await api.get('/reports', { params });
      setReports(res.data.reports || []);
      setPagination((prev) => ({ ...prev, total: res.data.pagination?.total || 0 }));
    } catch (err: any) {
      console.error('Fetch reports error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = (report: any, status: string) => {
    const feedback = window.prompt(`Berikan feedback untuk status "${status}" (kosongkan jika tidak ada):`, '');
    if (feedback === null) return;
    api.put(`/reports/${report.id}/review`, { status, adminFeedback: feedback })
      .then(() => fetchReports())
      .catch((err) => alert(err.response?.data?.error || 'Gagal meninjau laporan.'));
  };

  if (loading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-full">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4" />
        <p className="text-gray-400">Memuat laporan...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Manajemen Laporan</h1>
          <p className="text-gray-400">
            {isEmployee() ? 'Laporan pekerjaan yang Anda kirim.' : 'Laporan pekerjaan karyawan perusahaan.'}
          </p>
        </div>
        <Button variant="primary" onClick={() => navigate('/reports/create')} className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> Buat Laporan
        </Button>
      </div>

      <Card padded={false} className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <div className="col-span-1 sm:col-span-2 lg:col-span-3">
            <SearchInput value={filters.search} onChange={(v) => setFilters({ ...filters, search: v })} placeholder="Cari laporan..." />
          </div>
          <div>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg bg-gray-900/50 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Semua Status</option>
              <option value="submitted">Diajukan</option>
              <option value="reviewed">Direview</option>
              <option value="approved">Disetujui</option>
              <option value="revision_requested">Revisi</option>
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
                <TableHead>Judul</TableHead>
                <TableHead>Karyawan</TableHead>
                <TableHead className="text-center">Tugas</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Tanggal</TableHead>
                <TableHead className="text-right w-20">Aksi</TableHead>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs text-gray-500">{r.id.replace('rep_', '')}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="font-medium text-white truncate block max-w-md" title={r.title}>{r.title}</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate max-w-md">{r.summary || '-'}</p>
                  </TableCell>
                  <TableCell className="font-medium text-white">{r.employee_name || '-'}</TableCell>
                  <TableCell className="text-center text-gray-400 text-xs">{r.task_title || '-'}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={r.status === 'approved' ? 'success' : r.status === 'submitted' ? 'primary' : r.status === 'revision_requested' ? 'warning' : 'gray'}>
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-xs text-gray-400">{formatDate(r.created_at)}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {isCompanyAdmin() && r.status === 'submitted' && (
                        <Button variant="ghost" size="sm" onClick={() => handleReview(r, 'approved')} className="text-green-400 hover:bg-green-500/10 p-1">
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      {isCompanyAdmin() && r.status === 'submitted' && (
                        <Button variant="ghost" size="sm" onClick={() => handleReview(r, 'revision_requested')} className="text-orange-400 hover:bg-orange-500/10 p-1">
                          <AlertCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/reports/${r.id}`)} className="text-blue-400 hover:text-blue-300 p-1">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {reports.length === 0 && (
                <tr><td colSpan={7} className="text-center py-8 text-gray-500">Belum ada laporan.</td></tr>
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
