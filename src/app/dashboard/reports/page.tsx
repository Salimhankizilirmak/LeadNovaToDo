'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell as RechartsCell,
  Legend
} from 'recharts';
import {
  TrendingUp,
  Target,
  DollarSign,
  Activity,
  Loader2,
  ShieldCheck,
  AlertCircle,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import { getAnalyticsAction, getExcelDataAction } from '@/app/actions/reports';
import { exportToPdf, exportToExcel } from '@/lib/exportUtils';
import Unauthorized from '@/components/layout/Unauthorized';

const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function ReportsPage() {
  const [data, setData] = useState<any>(null);
  const [role, setRole] = useState<string>('Personel');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await getAnalyticsAction();
      if (res.success) {
        setData(res.data);
        if (res.role) {
          setRole(res.role);
          // Yetki Kontrolü: Personel raporlara erişemez (Sidebar'da da gizli)
          if (res.role === 'Personel') {
            setUnauthorized(true);
          }
        }
      } else {
        setError(res.error || 'Veriler yüklenemedi.');
      }
      setLoading(false);
    }
    load();
  }, []);

  if (unauthorized) {
    return <Unauthorized />;
  }

  if (loading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
        <p className="text-sm font-black text-gray-400 uppercase tracking-widest animate-pulse">Analitik Veriler Hazırlanıyor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center space-y-4 text-center">
        <AlertCircle className="w-16 h-16 text-red-100" />
        <h2 className="text-2xl font-black text-gray-900 leading-none">Raporlara Erişilemedi</h2>
        <p className="text-gray-500 font-medium max-w-sm">{error}</p>
      </div>
    );
  }

  // Grafik verilerini hazırla
  const taskStatusData = data.taskStats.map((s: any) => ({
    name: s.status === 'todo' ? 'Yapılacak' : s.status === 'in_progress' ? 'Devam Eden' : s.status === 'review' ? 'İnceleme' : 'Tamamlanan',
    value: s.count
  }));

  const handleExportExcel = async () => {
    const toastId = toast.loading('Excel verisi hazırlanıyor, lütfen bekleyin...');
    try {
      const res = await getExcelDataAction();
      if (res.success && res.data) {
        exportToExcel(res.data, `LeadNova_Operasyon_Raporu_${Date.now()}`);
        toast.success('Excel başarıyla indirildi!', { id: toastId });
      } else {
        toast.error(res.error || 'Veri çekilemedi', { id: toastId });
      }
    } catch (err) {
      toast.error('Beklenmeyen bir hata oluştu.', { id: toastId });
    }
  };

  const handleExportPdf = () => {
    exportToPdf('reports-container', `LeadNova_Analitik_${Date.now()}`);
  };

  return (
    <div id="reports-container" className="p-4 sm:p-10 space-y-12 animate-in fade-in duration-700 bg-[#F9FAFB]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h1 className="text-5xl font-black text-gray-900 tracking-tighter flex items-center gap-4">
            <TrendingUp className="text-indigo-600" size={48} />
            Analitik Raporlar
          </h1>
          <p className="text-gray-500 font-bold mt-2 uppercase tracking-widest text-sm">
            Organizasyonel Verimlilik ve Stratejik Takip Paneli
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {['Patron', 'Genel Müdür', 'Admin'].includes(role) && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <button onClick={handleExportPdf} className="flex items-center justify-center gap-2 px-5 py-3 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-white rounded-xl shadow-sm transition-all text-xs font-bold uppercase tracking-wide active:scale-95">
                <Download size={16} />
                PDF İndir
              </button>
              <button onClick={handleExportExcel} className="flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 border border-emerald-500 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition-all text-xs font-bold uppercase tracking-wide active:scale-95">
                <FileSpreadsheet size={16} />
                Excel Aktar
              </button>
            </div>
          )}
          <div className="flex items-center gap-3 px-6 py-3 bg-indigo-50 rounded-2xl border border-indigo-100 shadow-sm w-full sm:w-auto justify-center sm:justify-start">
            <ShieldCheck className="text-indigo-600" size={20} />
            <span className="text-xs font-black text-indigo-700 uppercase tracking-tighter">Yetkili Görünüm</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <Activity size={80} className="text-indigo-600" />
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Toplam İş Yükü</p>
          <h3 className="text-5xl font-black text-gray-900 tracking-tighter">
            {data.taskStats.reduce((acc: number, cur: any) => acc + cur.count, 0)}
          </h3>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-[10px] font-black text-emerald-500 py-1 px-2 bg-emerald-50 rounded-lg">AKTİF DURUM</span>
          </div>
        </div>

        <div className="bg-indigo-600 p-8 rounded-[2.5rem] shadow-2xl shadow-indigo-200 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <Target size={80} />
          </div>
          <p className="text-[10px] font-black text-indigo-200 uppercase tracking-[0.2em] mb-2">Tamamlanma Oranı</p>
          <h3 className="text-5xl font-black tracking-tighter">
            {Math.round(((data.taskStats.find((s: any) => s.status === 'done')?.count || 0) / (data.taskStats.reduce((acc: number, cur: any) => acc + cur.count, 0) || 1)) * 100)}%
          </h3>
          <div className="mt-4 h-1.5 w-full bg-indigo-500 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-1000"
              style={{ width: `${Math.round(((data.taskStats.find((s: any) => s.status === 'done')?.count || 0) / (data.taskStats.reduce((acc: number, cur: any) => acc + cur.count, 0) || 1)) * 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <DollarSign size={80} className="text-emerald-600" />
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Yönetilen Bütçe (TRY)</p>
          <h3 className="text-5xl font-black text-gray-900 tracking-tighter">
            ₺{new Intl.NumberFormat('tr-TR').format(data.budgetData.reduce((acc: number, cur: any) => acc + cur.value, 0))}
          </h3>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-[10px] font-black text-indigo-500 py-1 px-2 bg-indigo-50 rounded-lg">STRATEJİK VARLIK</span>
          </div>
        </div>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

        {/* Görev Dağılımı */}
        <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm flex flex-col h-[500px]">
          <div className="mb-10">
            <h4 className="text-2xl font-black text-gray-900 tracking-tight">Görev Durum Analizi</h4>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Süreç Bazlı Dağılım</p>
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={taskStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={140}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {taskStatusData.map((entry: any, index: number) => (
                    <RechartsCell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontWeight: 'black', textTransform: 'uppercase', fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hücre Performansı */}
        <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm flex flex-col h-[500px]">
          <div className="mb-10">
            <h4 className="text-2xl font-black text-gray-900 tracking-tight">Hücre Bazlı Verimlilik</h4>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Departman Performans Endeksi</p>
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.cellPerformance} margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 'bold', fill: '#9CA3AF' }}
                  dy={10}
                />
                <YAxis hide />
                <Tooltip
                  cursor={{ fill: '#F9FAFB' }}
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                />
                <Bar dataKey="efficiency" fill="#6366F1" radius={[15, 15, 15, 15]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bütçe Dağılımı (Sadece Yetkililer) */}
        {data.budgetData.length > 0 && (
          <div className="lg:col-span-2 bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm flex flex-col min-h-[500px]">
            <div className="mb-10">
              <h4 className="text-2xl font-black text-gray-900 tracking-tight">Proje Bütçe Dağılımı</h4>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Maliyet ve Yatırım Analizi (TRY)</p>
            </div>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={data.budgetData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                    outerRadius={150}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {data.budgetData.map((entry: any, index: number) => (
                      <RechartsCell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => `₺${new Intl.NumberFormat('tr-TR').format(Number(value))}`}
                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
