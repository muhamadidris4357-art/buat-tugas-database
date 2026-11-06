import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';

export default function ReportCreate() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: '',
    summary: '',
    workDone: '',
    blockers: '',
    hoursSpent: '',
    taskId: searchParams.get('taskId') || '',
  });

  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await api.get('/tasks');
      setTasks(res.data.tasks || []);
    } catch (err) {
      // ignore
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/reports', {
        title: form.title,
        summary: form.summary,
        workDone: form.workDone,
        blockers: form.blockers,
        hoursSpent: parseFloat(form.hoursSpent) || 0,
        taskId: form.taskId || null,
      });
      navigate('/reports');
    } catch (err: any) {
      setLoading(false);
      setError(err.response?.data?.error || 'Gagal mengirim laporan.');
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-full">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4" />
        <p className="text-gray-400">Memuat data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={() => navigate('/reports')} className="text-gray-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Kembali
        </Button>
        <h1 className="text-xl font-bold text-white">Kirim Laporan Pekerjaan</h1>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <div className="bg-gray-900/60 border border-gray-700 rounded-2xl p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Tugas Terkait</label>
            <select
              value={form.taskId}
              onChange={(e) => setForm({ ...form, taskId: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg bg-gray-900/50 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Pilih tugas (opsional)</option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          </div>

          <Input
            label="Judul Laporan *"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Contoh: Laporan mingguan pengembangan fitur login"
            required
          />

          <Input
            label="Ringkasan *"
            value={form.summary}
            onChange={(e) => setForm({ ...form, summary: e.target.value })}
            placeholder="Ringkasan singkat pekerjaan yang telah dilakukan..."
            required
          />

          <Input
            label="Pencapaian"
            value={form.workDone}
            onChange={(e) => setForm({ ...form, workDone: e.target.value })}
            multiline
            rows={3}
            placeholder="Apa yang telah diselesaikan?"
          />

          <Input
            label="Hambatan"
            value={form.blockers}
            onChange={(e) => setForm({ ...form, blockers: e.target.value })}
            multiline
            rows={3}
            placeholder="Apa yang menghambat pekerjaan? (kosongkan jika tidak ada)"
          />

          <Input
            label="Jam yang Dihabiskan"
            type="number"
            value={form.hoursSpent}
            onChange={(e) => setForm({ ...form, hoursSpent: e.target.value })}
            placeholder="0"
          />

          <Button type="submit" variant="primary" className="w-full" isLoading={loading}>
            Kirim Laporan
          </Button>
        </form>
      </div>
    </div>
  );
}

function cn(...classes: (string | undefined | null | boolean)[]): string {
  return classes.filter(Boolean).join(' ');
}
