import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';

export default function TaskCreate() {
  const { user, isCompanyAdmin, isPlatformOwner } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
    targetScope: 'single',
    assignedUserIds: [] as string[],
    category: 'General',
    estimatedHours: '',
  });

  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/users', { params: { role: 'EMPLOYEE', status: 'active', limit: 100 } });
      setEmployees(res.data.users || []);
    } catch (err: any) {
      console.error('Fetch employees error:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/tasks', {
        title: form.title,
        description: form.description,
        priority: form.priority,
        dueDate: form.dueDate || null,
        targetScope: form.targetScope,
        assignedUserIds: form.targetScope === 'all' ? [] : form.assignedUserIds,
        category: form.category,
        estimatedHours: form.estimatedHours || 0,
      });
      navigate('/tasks');
    } catch (err: any) {
      setLoading(false);
      setError(err.response?.data?.error || 'Gagal membuat tugas.');
    }
  };

  const handleToggleUser = (userId: string) => {
    setForm((prev) => ({
      ...prev,
      assignedUserIds: prev.assignedUserIds.includes(userId)
        ? prev.assignedUserIds.filter((id) => id !== userId)
        : [...prev.assignedUserIds, userId],
    }));
  };

  const isAllScope = form.targetScope === 'all';

  if (loading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-full">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4" />
        <p className="text-gray-400">Memuat data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={() => navigate('/tasks')} className="text-gray-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Kembali
        </Button>
        <h1 className="text-xl font-bold text-white">Buat Tugas Baru</h1>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <div className="bg-gray-900/60 border border-gray-700 rounded-2xl p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input
              label="Judul Tugas *"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Contoh: Selesaikan desain halaman login"
              required
            />
            <Input
              label="Kategori"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="General"
            />
          </div>

          <Input
            label="Deskripsi"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Detail tugas yang harus diselesaikan..."
            multiline
            rows={3}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Prioritas</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg bg-gray-900/50 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Rendah</option>
                <option value="medium">Sedang</option>
                <option value="high">Tinggi</option>
                <option value="urgent">Mendesak</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Tanggal Jatuh Tempo</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg bg-gray-900/50 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Estimasi Jam</label>
              <input
                type="number"
                value={form.estimatedHours}
                onChange={(e) => setForm({ ...form, estimatedHours: e.target.value })}
                placeholder="0"
                className="w-full px-4 py-2.5 rounded-lg bg-gray-900/50 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="border-t border-gray-700 pt-5">
            <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-400" />
              Target Scope
            </h3>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-2 rounded-lg border border-gray-700 bg-gray-800/50 cursor-pointer hover:border-blue-500/50 transition-colors">
                <input
                  type="radio"
                  name="targetScope"
                  value="single"
                  checked={form.targetScope === 'single'}
                  onChange={() => setForm({ ...form, targetScope: 'single', assignedUserIds: [] })}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-300">Satu karyawan</span>
              </label>
              <label className="flex items-center gap-3 p-2 rounded-lg border border-gray-700 bg-gray-800/50 cursor-pointer hover:border-blue-500/50 transition-colors">
                <input
                  type="radio"
                  name="targetScope"
                  value="multiple"
                  checked={form.targetScope === 'multiple'}
                  onChange={() => setForm({ ...form, targetScope: 'multiple' })}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-300">Beberapa karyawan</span>
              </label>
              <label className="flex items-center gap-3 p-2 rounded-lg border border-gray-700 bg-gray-800/50 cursor-pointer hover:border-blue-500/50 transition-colors">
                <input
                  type="radio"
                  name="targetScope"
                  value="all"
                  checked={form.targetScope === 'all'}
                  onChange={() => setForm({ ...form, targetScope: 'all' })}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-300">Semua karyawan</span>
              </label>
            </div>
          </div>

          {!isAllScope && employees.length > 0 && (
            <div className="border-t border-gray-700 pt-5">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">Pilih Karyawan</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {employees.map((emp) => (
                  <label key={emp.id} className="flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={form.assignedUserIds.includes(emp.id)}
                      onChange={() => handleToggleUser(emp.id)}
                      className="text-blue-600 focus:ring-blue-500 h-4 w-4 shrink-0"
                    />
                    <span className="text-sm text-gray-300 truncate">{emp.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <Button type="submit" variant="primary" className="w-full" isLoading={loading}>
            Buat Tugas
          </Button>
        </form>
      </div>
    </div>
  );
}

function cn(...classes: (string | undefined | null | boolean)[]): string {
  return classes.filter(Boolean).join(' ');
}
