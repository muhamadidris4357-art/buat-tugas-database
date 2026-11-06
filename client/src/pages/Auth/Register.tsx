import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User as UserIcon, Building2, Key, AlertCircle, KeyRound } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';

type Mode = 'create' | 'join';

export default function Register() {
  const [mode, setMode] = useState<Mode>('create');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { registerCompany, joinCompany } = useAuth();

  // Create company form
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('Technology');
  const [country, setCountry] = useState('Indonesia');
  const [timezone, setTimezone] = useState('Asia/Jakarta');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // Join company form
  const [companyCode, setCompanyCode] = useState('');
  const [empName, setEmpName] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empPassword, setEmpPassword] = useState('');
  const [empJobTitle, setEmpJobTitle] = useState('Team Member');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await registerCompany({
      companyName,
      industry,
      country,
      timezone,
      adminName,
      email: adminEmail,
      password: adminPassword,
    });
    setLoading(false);
    if (result.success) {
      navigate('/dashboard', { replace: true });
    } else {
      setError(result.error || 'Gagal membuat perusahaan.');
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await joinCompany({
      companyCode,
      name: empName,
      email: empEmail,
      password: empPassword,
      jobTitle: empJobTitle,
    });
    setLoading(false);
    if (result.success) {
      navigate('/dashboard', { replace: true });
    } else {
      setError(result.error || 'Gagal bergabung perusahaan.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080D1A] px-4">
      <div className="w-full max-w-2xl">
        <div className="bg-gray-900/60 border border-gray-700 rounded-2xl p-8 shadow-2xl backdrop-blur-md">
          <div className="flex flex-col items-center gap-2 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <span className="text-white text-lg font-bold">T</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">TaskSphere</h1>
            <p className="text-gray-400 text-sm">Buat akun untuk platform manajemen tugas</p>
          </div>

          {/* Mode toggle */}
          <div className="flex gap-1 mb-6">
            <button
              onClick={() => setMode('create')}
              className={cn(
                'flex-1 py-3 rounded-lg text-sm font-medium transition-colors',
                mode === 'create'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              )}
            >
              <Building2 className="h-4 w-4 mr-1" />
              Buat Perusahaan Baru
            </button>
            <button
              onClick={() => setMode('join')}
              className={cn(
                'flex-1 py-3 rounded-lg text-sm font-medium transition-colors',
                mode === 'join'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              )}
            >
              <KeyRound className="h-4 w-4 mr-1" />
              Bergabung Perusahaan
            </button>
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {mode === 'create' ? (
            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <Input
                  label="Nama Perusahaan"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Contoh: PT Teknologi Maju"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <Input
                  label="Industri"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="Technology"
                />
              </div>
              <div className="md:col-span-2">
                <Input
                  label="Negara"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Indonesia"
                />
              </div>
              <div className="md:col-span-2">
                <Input
                  label="Zona Waktu"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  placeholder="Asia/Jakarta"
                />
              </div>
              <div>
                <Input
                  label="Nama Admin (Anda)"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  required
                />
              </div>
              <div>
                <Input
                  label="Email Admin"
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@perusahaan.com"
                  required
                />
              </div>
              <div>
                <Input
                  label="Kata Sandi"
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <Button type="submit" variant="primary" className="w-full" isLoading={loading}>
                  Buat Perusahaan & Akun Admin
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleJoin} className="space-y-6">
              <div>
                <Input
                  label="Kode Perusahaan"
                  value={companyCode}
                  onChange={(e) => setCompanyCode(e.target.value)}
                  placeholder="Contoh: TECH-1234"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">Dapatkan kode dari Admin perusahaan Anda.</p>
              </div>
              <div>
                <Input
                  label="Nama Lengkap"
                  value={empName}
                  onChange={(e) => setEmpName(e.target.value)}
                  placeholder="Contoh: Sarah Dewi"
                  required
                />
              </div>
              <div>
                <Input
                  label="Email"
                  type="email"
                  value={empEmail}
                  onChange={(e) => setEmpEmail(e.target.value)}
                  placeholder="sarah@perusahaan.com"
                  required
                />
              </div>
              <div>
                <Input
                  label="Kata Sandi"
                  type="password"
                  value={empPassword}
                  onChange={(e) => setEmpPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              <div>
                <Input
                  label="Jabatan"
                  value={empJobTitle}
                  onChange={(e) => setEmpJobTitle(e.target.value)}
                  placeholder="Team Member"
                />
              </div>

              <Button type="submit" variant="primary" className="w-full" isLoading={loading}>
                Bergabung ke Perusahaan
              </Button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-gray-400">
            Sudah punya akun?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-blue-400 hover:text-blue-300 font-medium"
            >
              Masuk
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

function cn(...classes: (string | undefined | null | boolean)[]): string {
  return classes.filter(Boolean).join(' ');
}
