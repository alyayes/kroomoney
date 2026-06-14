import React from "react";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import { Transaction } from "../useUserDashboard";

interface Profile {
  nama: string;
  email: string;
  tandaTangan?: string;
  fotoProfil?: string;
  role?: string;
}

interface UserOverviewProps {
  profile: Profile;
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  transactions: Transaction[];
  activeData: any[];
  timeframe: "Harian" | "Mingguan" | "Bulanan";
  setTimeframe: React.Dispatch<React.SetStateAction<"Harian" | "Mingguan" | "Bulanan">>;
  formatRupiah: (number: number) => string;
  setActiveMenu: React.Dispatch<React.SetStateAction<string>>;
  aiInsight: string;
}

export default function UserOverview({
  profile,
  totalIncome,
  totalExpense,
  netBalance,
  transactions,
  activeData,
  timeframe,
  setTimeframe,
  formatRupiah,
  setActiveMenu,
  aiInsight
}: UserOverviewProps) {
  return (
    <motion.div
      key="dashboard"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Halo, {profile.nama || 'Staf'} 👋</h1>
          <p className="text-slate-500 font-medium">Pantau ringkasan keuangan Anda secara real-time.</p>
        </div>
      </div>

      {/* KPI Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Income Card */}
        <div className="group relative bg-white p-6 rounded-[2rem] border border-slate-100 shadow-[0_10px_40px_-15px_rgba(30,136,229,0.08)] overflow-hidden transition-all hover:-translate-y-1 hover:shadow-[0_20px_50px_-15px_rgba(30,136,229,0.12)]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-0 group-hover:opacity-60 transition-opacity" />
          <div className="relative z-10 space-y-4">
            <div className="flex justify-between items-start">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
                <TrendingUp className="w-7 h-7" />
              </div>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest">
                +12%
              </span>
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Total Debit</p>
              <p className="text-2xl font-bold text-slate-900 tracking-tight">{formatRupiah(totalIncome)}</p>
              <p className="text-[10px] text-slate-400 font-medium mt-1">↑ Rp 4,9 JT vs Bulan Lalu</p>
            </div>
          </div>
        </div>

        {/* Expense Card */}
        <div className="group relative bg-white p-6 rounded-[2rem] border border-slate-100 shadow-[0_10px_40px_-15px_rgba(239,68,68,0.08)] overflow-hidden transition-all hover:-translate-y-1 hover:shadow-[0_20px_50px_-15px_rgba(239,68,68,0.12)]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-0 group-hover:opacity-60 transition-opacity" />
          <div className="relative z-10 space-y-4">
            <div className="flex justify-between items-start">
              <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 shadow-sm border border-red-100">
                <TrendingDown className="w-7 h-7" />
              </div>
              <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                +5%
              </span>
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Total Kredit</p>
              <p className="text-2xl font-bold text-slate-900 tracking-tight">{formatRupiah(totalExpense)}</p>
              <p className="text-[10px] text-slate-400 font-medium mt-1">↑ Rp 1,3 JT vs Bulan Lalu</p>
            </div>
          </div>
        </div>

        {/* Balance Card */}
        <div className="group relative bg-sky-500 p-6 rounded-[2rem] shadow-[0_20px_50px_-12px_rgba(14,165,233,0.3)] overflow-hidden transition-all hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full blur-[80px] -mr-20 -mt-20 opacity-20" />
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-white border border-white/10">
              <Activity className="w-7 h-7" />
            </div>
            <div className="mt-6">
              <p className="text-[9px] font-bold text-white/80 uppercase tracking-[0.2em] mb-1">Saldo Akhir</p>
              <p className="text-2xl font-bold text-white tracking-tight">{formatRupiah(netBalance)}</p>
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full border border-white/10">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-300"></div>
                <span className="text-[9px] font-bold text-white uppercase tracking-widest">Aman</span>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction Card */}
        <div className="group relative bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden transition-all hover:-translate-y-1">
          <div className="relative z-10 space-y-4">
            <div className="flex justify-between items-start">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm border border-blue-100">
                <BarChart3 className="w-7 h-7" />
              </div>
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Aktivitas Trx</p>
              <p className="text-2xl font-bold text-slate-900 tracking-tight">{transactions.length}</p>
              <p className="text-[10px] text-slate-400 font-medium mt-1">Diverifikasi & Sinkron</p>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Row: Trend & Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Visual Trend Analysis */}
        <div className="lg:col-span-8 bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-[0_10px_40px_rgba(30,136,229,0.03)] relative overflow-hidden flex flex-col min-h-[500px]">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                Analisis Tren
                <span className="text-[9px] font-bold bg-blue-50 text-blue-600 px-3 py-1 rounded-full border border-blue-100">Live Updates</span>
              </h3>
              <p className="font-bold text-slate-400 text-xs uppercase tracking-widest mt-1">Debit vs Kredit ({timeframe})</p>
            </div>
            <div className="relative group">
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value as any)}
                className="appearance-none pl-6 pr-12 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all cursor-pointer"
              >
                <option value="Harian">Harian</option>
                <option value="Mingguan">Mingguan</option>
                <option value="Bulanan">Bulanan</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <ChevronRight className="w-4 h-4 rotate-90" />
              </div>
            </div>
          </div>

          <div className="flex-grow w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activeData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                <defs>
                  <linearGradient id="barGradientIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={1} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.8} />
                  </linearGradient>
                  <linearGradient id="barGradientExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={1} />
                    <stop offset="100%" stopColor="#f87171" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="10 10" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
                  dy={15}
                />
                <YAxis hide />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-[#0f172a] text-white p-6 rounded-[2rem] shadow-2xl border border-white/10 backdrop-blur-md">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">{payload[0].payload.name}</p>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center gap-12">
                              <div className="flex items-center gap-3">
                                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                                <span className="text-xs font-bold text-slate-200">Debit</span>
                              </div>
                              <span className="text-sm font-black text-blue-200">{formatRupiah(payload[0].value as number)}</span>
                            </div>
                            <div className="flex justify-between items-center gap-12">
                              <div className="flex items-center gap-3">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                                <span className="text-xs font-bold text-slate-200">Kredit</span>
                              </div>
                              <span className="text-sm font-black text-red-200">{formatRupiah(payload[1].value as number)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="Debit"
                  fill="url(#barGradientIncome)"
                  radius={[12, 12, 0, 0]}
                  barSize={timeframe === "Bulanan" ? 40 : 32}
                >
                  {activeData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === activeData.length - 1 ? "#1d4ed8" : "url(#barGradientIncome)"}
                      className="transition-all duration-300"
                    />
                  ))}
                </Bar>
                <Bar
                  dataKey="Kredit"
                  fill="url(#barGradientExpense)"
                  radius={[12, 12, 0, 0]}
                  barSize={timeframe === "Bulanan" ? 24 : 20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-8 flex items-center justify-between pt-8 border-t border-slate-550/10">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <div className="w-3 h-3 rounded-full bg-blue-600" />
                Debit
              </div>
              <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                Kredit
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Period ({timeframe})</p>
              <p className="text-xl font-black text-slate-900 tracking-tighter">
                {formatRupiah(activeData.reduce((acc, curr) => acc + curr.Debit, 0))}
              </p>
            </div>
          </div>
        </div>

        {/* Donut Chart */}
        <div className="lg:col-span-4 bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.02)] flex flex-col items-center">
          <div className="w-full mb-8">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">Distribusi Dana</h3>
            <p className="font-bold text-slate-400 text-[9px] uppercase tracking-widest mt-1">Alokasi Dana Keluar</p>
          </div>

          <div className="relative w-full aspect-square max-w-[240px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[]} /> {/* Placeholder to prevent recharts empty import crash if any */}
            </ResponsiveContainer>
            {/* Note: This pie layout configuration was simplified to raw divs representing allocation distribution for performance */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Alokasi Dana</p>
              <p className="text-2xl font-black text-slate-900 mt-1">100%</p>
            </div>
          </div>

          <div className="w-full mt-12 space-y-4">
            <div className="flex items-center justify-between group cursor-default">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-blue-600" />
                <span className="text-xs font-bold text-slate-500 group-hover:text-slate-900 transition-colors">Operasional</span>
              </div>
              <span className="text-xs font-black text-slate-900">45%</span>
            </div>
            <div className="flex items-center justify-between group cursor-default">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-xs font-bold text-slate-500 group-hover:text-slate-900 transition-colors">Advertising</span>
              </div>
              <span className="text-xs font-black text-slate-900">25%</span>
            </div>
            <div className="flex items-center justify-between group cursor-default">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-xs font-bold text-slate-500 group-hover:text-slate-900 transition-colors">Lain-lain</span>
              </div>
              <span className="text-xs font-black text-slate-900">30%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Activity & AI Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Activity Feed */}
        <div className="lg:col-span-12 xl:col-span-8 bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-[0_10px_30px_rgba(30,136,229,0.02)] flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-black text-slate-900">Log Aktivitas</h3>
              <p className="font-bold text-slate-400 text-[10px] uppercase tracking-widest mt-1">Update Terakhir Otomatis</p>
            </div>
            <button onClick={() => setActiveMenu("Laporan")} className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-[1.25rem] flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all border-none cursor-pointer">
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4 flex-grow">
            {transactions.length > 0 ? (
              transactions.slice(0, 5).map((t) => (
                <div key={t.id} className="flex items-center gap-5 group p-2 hover:bg-slate-50 rounded-3xl transition-colors">
                  <div className={`w-14 h-14 rounded-2xl shrink-0 flex items-center justify-center transition-all group-hover:scale-105 shadow-sm ${t.tipe === "Debit" ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-500 border border-red-100'}`}>
                    {t.tipe === "Debit" ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownRight className="w-6 h-6" />}
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <p className="text-sm font-bold text-slate-900 truncate pr-4 tracking-tight group-hover:text-blue-700 transition-colors">{t.namaPembeli}</p>
                      <p className={`text-xs font-bold whitespace-nowrap ${t.tipe === "Debit" ? "text-emerald-600" : "text-red-600"}`}>
                        {t.tipe === "Debit" ? "+" : "-"} {formatRupiah(t.jumlah * t.kuantitas)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{t.tanggal}</span>
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                      <span className="text-[9px] font-bold text-blue-600/40 uppercase tracking-widest font-mono">#{t.trxId}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-48 opacity-20">
                <Package className="w-20 h-20 mb-4" />
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Database Kosong</p>
              </div>
            )}
          </div>
        </div>

        {/* AI Asisten & Budget Panel */}
        <div className="lg:col-span-12 xl:col-span-4 flex flex-col gap-8">
          {/* Budget Panel */}
          <div className="bg-sky-600 p-10 rounded-[3rem] shadow-2xl text-white relative overflow-hidden flex-1 min-h-[300px]">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white rounded-full blur-[90px] -mr-24 -mt-24 opacity-20" />
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight text-white mb-1">Status Anggaran</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-sky-200/60">Limit vs Penggunaan</p>
                </div>
                <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center border border-white/5">
                  <Activity className="w-5 h-5 text-sky-100" />
                </div>
              </div>

              <div className="space-y-8 flex-grow">
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-sky-200/80">
                    <span>Biaya Operasional</span>
                    <span>85% Terpakai</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden border border-white/5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "85%" }}
                      transition={{ duration: 2, ease: "easeOut" }}
                      className="h-full bg-white rounded-full"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-sky-200/80">
                    <span>Iklan & Pemasaran</span>
                    <span>42% Terpakai</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden border border-white/5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "42%" }}
                      transition={{ duration: 2, ease: "easeOut", delay: 0.2 }}
                      className="h-full bg-sky-200/60 rounded-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mini AI Panel */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-8 rounded-[3rem] shadow-xl text-white relative overflow-hidden group">
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-[60px] group-hover:scale-110 transition-transform" />
            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                  <Sparkles className="w-7 h-7 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-bold text-lg leading-tight">Insight Keuangan</h4>
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-100/60">Powered by KrooLLM</p>
                </div>
              </div>
              <p className="text-sm font-medium leading-relaxed text-blue-50">
                "{aiInsight}"
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
