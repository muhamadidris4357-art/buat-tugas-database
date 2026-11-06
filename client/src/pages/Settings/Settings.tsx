import { useState } from 'react';
import { ShieldAlert, Building2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';

export default function Settings() {
  const { user, isPlatformOwner, isCompanyAdmin, state } = useAuth();
  const [tab, setTab] = useState('general');

  const tabs = [
    { id: 'general', label: 'Umum', icon: ShieldAlert },
    { id: 'company', label: 'Perusahaan', icon: Building2 },
    { id: 'security', label: 'Keamanan', icon: LockKey },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">Pengaturan</h1>

      <div className="flex gap-1 mb-6 border-b border-gray-700 pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border-b-2 transition-colors mb-[-2px]',
              tab === t.id
                ? 'border-blue-500 text-blue-400 bg-blue-900/20'
                : 'text-gray-400 hover:text-white border-transparent'
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'general' && (
        <Card>
          <h3 className="text-lg font-semibold text-white mb-4">Pengaturan Umum</h3>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
              <p className="text-sm font-medium text-white">Bahasa Antarmuka</p>
              <p className="text-sm text-gray-400">{user?.language === 'id' ? 'Bahasa Indonesia' : 'English'}</p>
            </div>
            <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
              <p className="text-sm font-medium text-white">Zona Waktu</p>
              <p className="text-sm text-gray-400">{user?.timezone}</p>
            </div>
            <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
              <p className="text-sm font-medium text-white">Format Tanggal</p>
              <p className="text-sm text-gray-400">{user?.date_format}</p>
            </div>
            <Button variant="secondary" onClick={() => setTab('general')}>
              Simpan Pengaturan Umum
            </Button>
          </div>
        </Card>
      )}

      {tab === 'company' && state.company && (
        <Card>
          <h3 className="text-lg font-semibold text-white mb-4">Pengaturan Perusahaan</h3>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
              <p className="text-sm font-medium text-white">Nama Perusahaan</p>
              <p className="text-sm text-gray-400">{state.company.name}</p>
              <p className="text-xs text-gray-500 mt-1">Kode undangan: {state.company.code}</p>
            </div>
            <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
              <p className="text-sm font-medium text-white">Status Perusahaan</p>
              <span className="text-sm text-green-400 font-medium">{state.company.status}</span>
            </div>
            {isCompanyAdmin() && (
              <Button variant="primary">
                Kelola Kode Perusahaan
              </Button>
            )}
          </div>
        </Card>
      )}

      {tab === 'security' && (
        <Card>
          <h3 className="text-lg font-semibold text-white mb-4">Pengaturan Keamanan</h3>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
              <p className="text-sm font-medium text-white">Sesi Aktif</p>
              <p className="text-sm text-gray-400">Anda sedang login dengan akun ini.</p>
            </div>
            <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
              <p className="text-sm font-medium text-white">Kebijakan Kata Sandi</p>
              <p className="text-sm text-gray-400">Minimal 8 karakter, disarankan kombinasi huruf dan angka.</p>
            </div>
            <Button variant="secondary">
              Lihat Riwayat Login
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

function cn(...classes: (string | undefined | null | boolean)[]): string {
  return classes.filter(Boolean).join(' ');
}
