import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Building2, Clock, AlertCircle, Save, Lock } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import { ROLE_CONFIG } from '@/lib/utils';

export default function Profile() {
  const { user, state, updateProfile, changePassword } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    job_title: user?.job_title || '',
    avatar_url: user?.avatar_url || '',
    language: user?.language || 'en',
    timezone: user?.timezone || 'Asia/Jakarta',
    date_format: user?.date_format || 'DD/MM/YYYY',
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
  });

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await updateProfile(profileForm);
    setLoading(false);
    if (result.success) {
      setError('');
      alert('Profil berhasil diperbarui.');
    } else {
      setError(result.error || 'Gagal memperbarui profil.');
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
    setLoading(false);
    if (result.success) {
      setPasswordForm({ currentPassword: '', newPassword: '' });
      alert('Password berhasil diubah.');
    } else {
      setError(result.error || 'Gagal mengubah password.');
    }
  };

  const roleConfig = user ? ROLE_CONFIG[user.role] : ROLE_CONFIG.EMPLOYEE;

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-white">Profil & Pengaturan Akun</h1>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <Card>
            <div className="flex flex-col items-center gap-3 mb-6">
              <div className="w-24 h-24 rounded-full bg-gray-800 border border-gray-600 flex items-center justify-center overflow-hidden relative">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-white">{user.name?.charAt(0) || 'U'}</span>
                )}
              </div>
              <h2 className="text-lg font-bold text-white">{user.name}</h2>
              <Badge variant={user.role === 'PLATFORM_OWNER' ? 'primary' : user.role === 'COMPANY_ADMIN' ? 'primary' : 'success'}>
                {roleConfig.label}
              </Badge>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                <Mail className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-300">{user.email}</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                <Phone className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-300">{user.phone || '-'}</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                <Building2 className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-300">{state.company?.name || '-'}</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                <Clock className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-300">{user.timezone}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Profile Form */}
        <div className="lg:col-span-2">
          <Card>
            <h3 className="text-lg font-semibold text-white mb-6">Edit Profil</h3>
            <form onSubmit={handleProfileSubmit} className="space-y-5">
              <Input
                label="Nama Lengkap"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
              />
              <Input
                label="Jabatan"
                value={profileForm.job_title}
                onChange={(e) => setProfileForm({ ...profileForm, job_title: e.target.value })}
              />
              <Input
                label="Nomor Telepon"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              />
              <Input
                label="Avatar URL"
                value={profileForm.avatar_url}
                onChange={(e) => setProfileForm({ ...profileForm, avatar_url: e.target.value })}
                placeholder="https://..."
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Bahasa</label>
                  <select
                    value={profileForm.language}
                    onChange={(e) => setProfileForm({ ...profileForm, language: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg bg-gray-900/50 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="en">English</option>
                    <option value="id">Bahasa Indonesia</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                    <option value="ja">日本語</option>
                    <option value="zh">中文（简体）</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Zona Waktu</label>
                  <select
                    value={profileForm.timezone}
                    onChange={(e) => setProfileForm({ ...profileForm, timezone: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg bg-gray-900/50 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Asia/Jakarta">Asia/Jakarta</option>
                    <option value="Asia/Bangkok">Asia/Bangkok</option>
                    <option value="Asia/Singapore">Asia/Singapore</option>
                    <option value="Asia/Tokyo">Asia/Tokyo</option>
                    <option value="Europe/London">Europe/London</option>
                    <option value="America/New_York">America/New_York</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Format Tanggal</label>
                  <select
                    value={profileForm.date_format}
                    onChange={(e) => setProfileForm({ ...profileForm, date_format: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg bg-gray-900/50 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY/MM/DD">YYYY/MM/DD</option>
                  </select>
                </div>
              </div>
              <Button type="submit" variant="primary" className="w-full" isLoading={loading}>
                <Save className="h-4 w-4 mr-2" /> Simpan Perubahan
              </Button>
            </form>
          </Card>
        </div>
      </div>

      {/* Change Password */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Ubah Kata Sandi</h3>
        </div>
        <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
          <Input
            label="Kata Sandi Saat Ini"
            type="password"
            value={passwordForm.currentPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
          />
          <Input
            label="Kata Sandi Baru"
            type="password"
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
          />
          <Button type="submit" variant="primary" className="w-full" isLoading={loading}>
            <Lock className="h-4 w-4 mr-2" /> Ubah Kata Sandi
          </Button>
        </form>
      </Card>
    </div>
  );
}

function cn(...classes: (string | undefined | null | boolean)[]): string {
  return classes.filter(Boolean).join(' ');
}
