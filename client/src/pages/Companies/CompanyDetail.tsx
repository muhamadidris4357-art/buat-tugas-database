import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Users, ShieldAlert, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate, COMPANY_STATUS_CONFIG } from '@/lib/utils';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import Card from '@/components/common/Card';

export default function CompanyDetail() {
  const { id } = useParams();
  const { user, isPlatformOwner } = useAuth();
  const navigate = useNavigate();

  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCompany();
  }, [id]);

  const fetchCompany = async () => {
    try {
      const res = await api.get(`/companies/my`);
      setCompany(res.data.company);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Gagal memuat perusahaan.');
    } finally {
      setLoading(false);
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

  if (error) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-white">{error}</h2>
        <Button variant="primary" onClick={() => navigate('/dashboard')}>Kembali</Button>
      </div>
    );
  }

  const statusConfig = COMPANY_STATUS_CONFIG[company.status] || COMPANY_STATUS_CONFIG.active;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Kembali
        </Button>
        <h1 className="text-xl font-bold text-white">Profil Perusahaan</h1>
      </div>

      <Card>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{company.name}</h2>
            <p className="text-gray-400 text-sm">{company.code}</p>
          </div>
          <div className="ml-auto">
            <Badge variant={statusConfig.color === 'text-green-400' ? 'success' : statusConfig.color === 'text-red-400' ? 'danger' : 'warning'}>
              {statusConfig.label}
            </Badge>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
            <p className="text-xs text-gray-500 uppercase">Industri</p>
            <p className="text-sm text-white">{company.industry}</p>
          </div>
          <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
            <p className="text-xs text-gray-500 uppercase">Negara</p>
            <p className="text-sm text-white">{company.country}</p>
          </div>
          <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
            <p className="text-xs text-gray-500 uppercase">Zona Waktu</p>
            <p className="text-sm text-white">{company.timezone}</p>
          </div>
          <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
            <p className="text-xs text-gray-500 uppercase">Dibuat</p>
            <p className="text-sm text-white">{formatDate(company.created_at)}</p>
          </div>
        </div>
        {company.description && (
          <div className="mt-4 p-4 rounded-lg bg-gray-800/50 border border-gray-700">
            <p className="text-xs text-gray-500 uppercase mb-1">Deskripsi</p>
            <p className="text-sm text-gray-300">{company.description}</p>
          </div>
        )}
      </Card>

      <Card>
        <h3 className="text-lg font-semibold text-white mb-4">Pengaturan Perusahaan</h3>
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
            <p className="text-sm font-medium text-white">Kode Undangan Saat Ini</p>
            <div className="flex gap-2 mt-2">
              <span className="flex-1 px-3 py-2 rounded-lg bg-gray-900 border border-gray-600 text-sm text-gray-300 font-mono truncate">
                {company.code}
              </span>
              <Button variant="outline" size="sm" onClick={() => changeCode()}>
                Ubah Kode
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  function changeCode() {
    const newCode = window.prompt('Masukkan kode undangan baru (minimal 3 karakter):', company.code);
    if (!newCode) return;
    // Would call PUT /companies/my/code
    alert('Fitur ubah kode akan segera tersedia.');
  }
}

function cn(...classes: (string | undefined | null | boolean)[]): string {
  return classes.filter(Boolean).join(' ');
}
