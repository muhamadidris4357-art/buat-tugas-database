import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ClipboardList,
  User,
  Clock,
  AlertCircle,
  CheckCircle,
  MoreHorizontal,
  Edit,
  Trash2,
} from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate, STATUS_CONFIG, PRIORITY_CONFIG, ROLE_CONFIG } from '@/lib/utils';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import Card from '@/components/common/Card';

export default function TaskDetail() {
  const { id } = useParams();
  const { user, isCompanyAdmin, isPlatformOwner, isEmployee } = useAuth();
  const navigate = useNavigate();

  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTask();
  }, [id]);

  const fetchTask = async () => {
    try {
      const res = await api.get(`/tasks/${id}`);
      setTask(res.data.task);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Gagal memuat tugas.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-full">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4" />
        <p className="text-gray-400">Memuat detail tugas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-white">{error}</h2>
        <Button variant="primary" onClick={() => navigate('/tasks')}>Kembali ke Daftar Tugas</Button>
      </div>
    );
  }

  const myAssign = task.my_assignment || (task.assignments?.[0]);
  const canUpdate = isCompanyAdmin() || isPlatformOwner() || (isEmployee() && !!myAssign);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={() => navigate('/tasks')} className="text-gray-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Kembali
        </Button>
        <h1 className="text-xl font-bold text-white">Detail Tugas</h1>
      </div>

      {/* Header card */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white">{task.title}</h2>
            <p className="text-gray-400 text-sm">{task.description || 'Tanpa deskripsi'}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={task.priority === 'urgent' ? 'danger' : task.priority === 'high' ? 'warning' : task.priority === 'medium' ? 'primary' : 'gray'}>
              {task.priority}
            </Badge>
            <Badge variant={task.status === 'completed' ? 'success' : task.status === 'in_progress' ? 'primary' : task.status === 'blocked' ? 'danger' : 'gray'}>
              {task.status}
            </Badge>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-700">
            <p className="text-xs text-gray-500">Dibuat oleh</p>
            <p className="text-sm font-medium text-white">{task.creator_name || '-'}</p>
          </div>
          <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-700">
            <p className="text-xs text-gray-500">Tanggal jatuh tempo</p>
            <p className="text-sm font-medium text-white">{task.due_date ? formatDate(task.due_date) : '-'}</p>
          </div>
          <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-700">
            <p className="text-xs text-gray-500">Kategori</p>
            <p className="text-sm font-medium text-white">{task.category}</p>
          </div>
        </div>
      </Card>

      {/* Assignments */}
      <Card>
        <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
          <User className="h-4 w-4 text-blue-400" />
          Penugasan Karyawan
        </h3>
        <div className="space-y-3">
          {(task.assignments || []).map((a: any) => (
            <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 border border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-xs text-gray-300">
                  {a.user_name?.charAt(0) || '?'}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{a.user_name}</p>
                  <p className="text-xs text-gray-400">{a.user_job_title || 'Karyawan'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={a.status === 'completed' ? 'success' : a.status === 'in_progress' ? 'primary' : a.status === 'blocked' ? 'danger' : 'gray'}>
                  {a.status}
                </Badge>
                <span className="text-xs text-gray-400">{a.progress_percent ?? 0}%</span>
                {(isCompanyAdmin() || isPlatformOwner()) && (
                  <Button variant="ghost" size="sm" onClick={() => updateAssignment(a.id)} className="text-gray-400 hover:text-white p-1">
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
          {(task.assignments || []).length === 0 && (
            <p className="text-center py-3 text-gray-500 text-sm">Belum ada karyawan yang ditugaskan.</p>
          )}
        </div>
      </Card>

      {/* Employee status update */}
      {isEmployee() && myAssign && (
        <Card>
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Perbarui Status Pengerjaan Anda</h3>
          <div className="space-y-3">
            <select
              value={myAssign.status}
              onChange={(e) => updateMyStatus(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-gray-900/50 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="pending">Tertunda</option>
              <option value="in_progress">Dikerjakan</option>
              <option value="in_review">Direview</option>
              <option value="completed">Selesai</option>
              <option value="blocked">Diblokir</option>
            </select>
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-400">Progres (%)</label>
              <input
                type="number"
                value={myAssign.progress_percent || 0}
                onChange={(e) => updateMyProgress(e.target.value)}
                min="0" max="100"
                className="w-20 px-3 py-2 rounded-lg bg-gray-900/50 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </Card>
      )}

      {/* Reports */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-300">Laporan Pekerjaan</h3>
          {(isCompanyAdmin() || isPlatformOwner() || isEmployee()) && (
            <Button variant="ghost" size="sm" onClick={() => navigate(`/reports/create?taskId=${task.id}`)} className="text-blue-400 hover:text-blue-300">
              Buat Laporan
            </Button>
          )}
        </div>
        <div className="space-y-3">
          {(task.reports || []).map((r: any) => (
            <div key={r.id} className="p-3 rounded-lg bg-gray-800/50 border border-gray-700">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-white">{r.employee_name}</span>
                <Badge variant={r.status === 'approved' ? 'success' : r.status === 'submitted' ? 'primary' : r.status === 'revision_requested' ? 'warning' : 'gray'}>
                  {r.status}
                </Badge>
              </div>
              <p className="text-sm text-gray-300">{r.summary}</p>
              {r.admin_feedback && (
                <p className="text-xs text-gray-400 mt-1">Feedback: {r.admin_feedback}</p>
              )}
            </div>
          ))}
          {(task.reports || []).length === 0 && (
            <p className="text-center py-3 text-gray-500 text-sm">Belum ada laporan.</p>
          )}
        </div>
      </Card>

      {canUpdate && (
        <div className="flex gap-3">
          <Button variant="danger" onClick={() => deleteTask()} className="text-red-400 hover:bg-red-500/10">
            <Trash2 className="h-4 w-4 mr-2" /> Hapus Tugas
          </Button>
        </div>
      )}
    </div>
  );

  function updateAssignment(assignmentId: string) {
    const status = window.prompt('Masukkan status baru (pending/in_progress/in_review/completed/blocked):', myAssign?.status || 'pending');
    if (!status) return;
    const progress = window.prompt('Masukkan progres (0-100):', myAssign?.progress_percent || 0);
    if (progress === null) return;
    api.put(`/tasks/${id}/assignment`, { status, progressPercent: parseInt(progress) || 0, targetUserId: myAssign?.user_id })
      .then(() => fetchTask())
      .catch((err) => alert(err.response?.data?.error || 'Gagal memperbarui.'));
  }

  function updateMyStatus(status: string) {
    api.put(`/tasks/${id}/assignment`, { status, progressPercent: status === 'completed' ? 100 : myAssign?.progress_percent || 0 })
      .then(() => fetchTask())
      .catch((err) => alert(err.response?.data?.error || 'Gagal memperbarui status.'));
  }

  function updateMyProgress(val: string) {
    api.put(`/tasks/${id}/assignment`, { progressPercent: parseInt(val) || 0 })
      .then(() => fetchTask())
      .catch((err) => alert(err.response?.data?.error || 'Gagal memperbarui progres.'));
  }

  function deleteTask() {
    if (!window.confirm('Yakin ingin menghapus tugas ini?')) return;
    api.delete(`/tasks/${id}`)
      .then(() => navigate('/tasks'))
      .catch((err) => alert(err.response?.data?.error || 'Gagal menghapus.'));
  }
}
