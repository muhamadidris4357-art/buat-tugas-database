import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.success) {
      navigate('/dashboard', { replace: true });
    } else {
      setError(result.error || 'Login gagal.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080D1A] px-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <span className="text-white text-lg font-bold">T</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">TaskSphere</h1>
          <p className="text-gray-400 text-sm">Platform Manajemen Tugas Perusahaan</p>
        </div>

        {/* Card */}
        <div className="bg-gray-900/60 border border-gray-700 rounded-2xl p-8 shadow-2xl backdrop-blur-md">
          <h2 className="mb-6 text-xl font-semibold text-white">Masuk ke Akun</h2>

          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@perusahaan.com"
              required
            />
            <Input
              label="Kata Sandi"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <Button type="submit" variant="primary" className="w-full" isLoading={loading}>
              Masuk
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-400">
            Belum punya akun?{' '}
            <button
              onClick={() => navigate('/register')}
              className="text-blue-400 hover:text-blue-300 font-medium"
            >
              Buat Akun
            </button>
          </p>
        </div>

        {/* Demo hint */}
        <div className="mt-6 p-4 rounded-xl bg-gray-800/50 border border-gray-700 text-xs text-gray-400">
          <p className="mb-2"><span className="font-semibold text-gray-300">Tip:</span> Gunakan tombol "Demo Login" di halaman register untuk coba cepat, atau buat akun perusahaan baru.</p>
        </div>
      </div>
    </div>
  );
}
