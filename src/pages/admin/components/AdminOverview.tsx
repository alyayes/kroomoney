import React from "react";
import { Users, BarChart3, Activity, Server, Cpu, HardDrive } from "lucide-react";
import { motion } from "motion/react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts";

interface ServerMetrics {
  cpu: number;
  ram: number;
  disk: number;
  uptime: string;
  dbStatus: string;
  latency: string;
}

interface AuditLog {
  id: string;
  time: string;
  user: string;
  action: string;
  ip: string;
  severity: "Info" | "Success" | "Warning" | "Danger";
}

interface Treasurer {
  id: string;
  nama: string;
  email: string;
  status: string;
  startup: string;
  lastActive: string;
}

interface AdminOverviewProps {
  treasurers: Treasurer[];
  filteredTransactions: any[];
  totalTrxVolume: number;
  serverMetrics: ServerMetrics;
  chartData: Array<{ name: string; Pemasukan: number; Pengeluaran: number }>;
  auditLogs: AuditLog[];
  setActiveMenu: (menu: string) => void;
}

export default function AdminOverview({
  treasurers,
  filteredTransactions,
  totalTrxVolume,
  serverMetrics,
  chartData,
  auditLogs,
  setActiveMenu
}: AdminOverviewProps) {
  return (
    <motion.div
      key="dashboard-overview"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-8"
    >
      {/* Stats Summary Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Stats card: Total Treasurers */}
        <div className="bg-white p-6 rounded-2xl border border-[#DBEEFF] shadow-[0_4px_20px_-4px_rgba(58,123,213,0.06)] space-y-4">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 bg-[#EAF4FF] border border-[#DBEEFF] rounded-xl flex items-center justify-center text-[#2563EB]">
              <Users className="w-6 h-6" />
            </div>
            <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black tracking-widest px-2 py-0.5 rounded-full uppercase">Normal</span>
          </div>
          <div>
            <p className="text-[10px] font-black text-[#5A6A85] uppercase tracking-widest">Total Akun Bendahara</p>
            <h3 className="text-3xl font-black text-[#1E2D50] tracking-tighter mt-1">{treasurers.length} Staf</h3>
            <p className="text-[10px] text-emerald-600 font-bold mt-1">↑ 1 Pendaftaran baru hari ini</p>
          </div>
        </div>

        {/* Stats card: Consolidated Transactions */}
        <div className="bg-white p-6 rounded-2xl border border-[#DBEEFF] shadow-[0_4px_20px_-4px_rgba(58,123,213,0.06)] space-y-4">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 bg-[#EAF4FF] border border-[#DBEEFF] rounded-xl flex items-center justify-center text-[#2563EB]">
              <BarChart3 className="w-6 h-6" />
            </div>
          </div>
          <div>
            <p className="text-[10px] font-black text-[#5A6A85] uppercase tracking-widest">Aktivitas Transaksi</p>
            <h3 className="text-3xl font-black text-[#1E2D50] tracking-tighter mt-1">{filteredTransactions.length} Trx</h3>
            <p className="text-[10px] text-[#5A6A85] font-semibold mt-1">Volume: Rp {totalTrxVolume.toLocaleString("id-ID")}</p>
          </div>
        </div>

        {/* Stats card: Active Sessions */}
        <div className="bg-white p-6 rounded-2xl border border-[#DBEEFF] shadow-[0_4px_20px_-4px_rgba(58,123,213,0.06)] space-y-4">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 bg-[#EAF4FF] border border-[#DBEEFF] rounded-xl flex items-center justify-center text-[#2563EB]">
              <Activity className="w-6 h-6" />
            </div>
            <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black tracking-widest px-2 py-0.5 rounded-full uppercase">Aktif</span>
          </div>
          <div>
            <p className="text-[10px] font-black text-[#5A6A85] uppercase tracking-widest">Sesi Aktif Pengguna</p>
            <h3 className="text-3xl font-black text-[#1E2D50] tracking-tighter mt-1">
              {treasurers.filter(t => t.status === "Active").length + 1} Sesi
            </h3>
            <p className="text-[10px] text-slate-400 font-medium mt-1">Termasuk 1 Sesi Admin Console</p>
          </div>
        </div>

        {/* Stats card: System Health */}
        <div className="bg-white p-6 rounded-2xl border border-[#DBEEFF] shadow-[0_4px_20px_-4px_rgba(58,123,213,0.06)] space-y-4">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 bg-[#EAF4FF] border border-[#DBEEFF] rounded-xl flex items-center justify-center text-[#2563EB]">
              <Server className="w-6 h-6" />
            </div>
            <span className="bg-blue-50 text-[#2563EB] text-[10px] font-black tracking-widest px-2 py-0.5 rounded-full uppercase">Excellent</span>
          </div>
          <div>
            <p className="text-[10px] font-black text-[#5A6A85] uppercase tracking-widest">Kesehatan Node Server</p>
            <h3 className="text-3xl font-black text-[#1E2D50] tracking-tighter mt-1">99.8%</h3>
            <p className="text-[10px] text-emerald-600 font-bold mt-1">Database API: {serverMetrics.latency}</p>
          </div>
        </div>
      </div>

      {/* Middle Grid: Stats Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Financial Overview Chart */}
        <div className="lg:col-span-12 bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(58,123,213,0.06)] min-h-[380px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h4 className="text-lg font-black text-[#1E2D50] tracking-tight">Grafik Konsolidasi Sistem</h4>
              <p className="text-xs text-[#5A6A85] font-semibold uppercase tracking-wider mt-0.5">Seluruh Aktivitas Keuangan Bendahara</p>
            </div>
          </div>

          <div className="flex-1 w-full min-h-[260px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="adminIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="adminExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAF4FF" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#5A6A85", fontSize: 10, fontWeight: 700 }} />
                  <YAxis hide />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-[#1E2D50] text-white p-4 rounded-xl border border-[#DBEEFF]/20 shadow-2xl">
                            <p className="text-[10px] font-black tracking-widest uppercase text-slate-300 mb-2">{payload[0].payload.name}</p>
                            <div className="space-y-1">
                              <p className="text-xs font-bold text-blue-200">Income: Rp {payload[0].value?.toLocaleString("id-ID")}</p>
                              <p className="text-xs font-bold text-red-200">Expense: Rp {payload[1].value?.toLocaleString("id-ID")}</p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area type="monotone" dataKey="Pemasukan" stroke="#2563EB" strokeWidth={3} fillOpacity={1} fill="url(#adminIncome)" />
                  <Area type="monotone" dataKey="Pengeluaran" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#adminExpense)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-[#5A6A85]/40 text-xs font-black uppercase tracking-wider">
                Belum ada data untuk ditampilkan
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Activity Logs across all users */}
      <div className="bg-white p-6 rounded-2xl border border-[#DBEEFF] shadow-[0_4px_20px_-4px_rgba(58,123,213,0.06)]">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h4 className="text-lg font-black text-[#1E2D50] tracking-tight">Aktivitas Terakhir Sistem</h4>
            <p className="text-xs text-[#5A6A85] font-semibold uppercase tracking-wider mt-0.5">Audit log dari database & aktivitas server</p>
          </div>
          <button 
            onClick={() => setActiveMenu("Audit & Security")}
            className="text-xs font-black text-[#2563EB] tracking-widest uppercase hover:underline border-none bg-transparent cursor-pointer"
          >
            Selengkapnya
          </button>
        </div>

        <div className="divide-y divide-[#DBEEFF]">
          {auditLogs.slice(0, 4).map(log => (
            <div key={log.id} className="py-4 flex justify-between items-center text-sm font-medium">
              <div className="flex items-center gap-4">
                <div className={`w-2.5 h-2.5 rounded-full ${
                  log.severity === "Warning" ? "bg-amber-400" : log.severity === "Danger" ? "bg-red-500" : "bg-[#2563EB]"
                }`} />
                <div>
                  <p className="text-[#1E2D50] font-bold">{log.action}</p>
                  <span className="text-[10px] text-[#5A6A85]">{log.time} • Oleh: {log.user}</span>
                </div>
              </div>
              <span className="text-xs font-mono bg-[#EAF4FF] text-[#2563EB] px-2.5 py-1 rounded-lg border border-[#DBEEFF]">{log.ip}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
