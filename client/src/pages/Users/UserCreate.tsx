import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ArrowLeft, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';

export default function UserCreate() {
  const { user, isCompanyAdmin, isPlatformOwner } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    jobTitle: 'Team Member',
    role: 'EMPLOYEE',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/users', {
        name: form.name,
        email: form.email,
        password: form.password,
        jobTitle: form.jobTitle,
        role: form.role,
      });
      navigate('/users');
    } catch (err: any) {
      setLoading(false);
      setError(err.response?.data?.error || 'Gagal membuat pengguna.');
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={() => navigate('/users')} className="text-gray-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Kembali
        </Button>
        <h1 className="text-xl font-bold text-white">Tambah Pengguna</h1>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <div className="bg-gray-900/60 border border-gray-700 rounded-2xl p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Nama Lengkap *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            label="Email *"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <Input
            label="Kata Sandi Awal *"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <Input
            label="Jabatan"
            value={form.jobTitle}
            onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg bg-gray-900/50 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="EMPLOYEE">Karyawan</option>
              {isPlatformOwner() && <option value="COMPANY_ADMIN">Admin Perusahaan</option>}
            </select>
          </div>
          <Button type="submit" variant="primary" className="w-full" isLoading={loading}>
            Buat Akun Pengguna
          </Button>
        </form>
      </div>
    </div>
  );
}

function cn(...classes: (string | undefined | null | boolean)[]): string {
  return classes.filter(Boolean).join(' ');
}
