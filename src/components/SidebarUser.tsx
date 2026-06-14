import React from "react";
import {
  LayoutDashboard,
  PlusCircle,
  TrendingUp,
  TrendingDown,
  Wallet,
  BarChart3,
  Wifi,
  LogOut
} from "lucide-react";

interface SidebarUserProps {
  activeMenu: string;
  setActiveMenu: (menu: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  isOffline: boolean;
  onLogout: () => void;
}

export default function SidebarUser({
  activeMenu,
  setActiveMenu,
  isSidebarOpen,
  setIsSidebarOpen,
  isOffline,
  onLogout
}: SidebarUserProps) {
  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "Input", icon: PlusCircle },
    { name: "Pemasukan", icon: TrendingUp },
    { name: "Pengeluaran", icon: TrendingDown },
    { name: "Pembayaran", icon: Wallet },
    { name: "Laporan", icon: BarChart3 }
  ];

  return (
    <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 lg:relative lg:translate-x-0 shrink-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      {/* Sidebar Header */}
      <div className="h-20 flex items-center px-6 gap-3 border-b border-slate-50">
        <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center p-1.5 shadow-sm">
          <div className="bg-blue-900 w-full h-full rounded-md flex items-center justify-center">
            <Wallet className="w-4 h-4 text-white" />
          </div>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-blue-900">KroomBox</h1>
      </div>

      {/* Sidebar Menu */}
      <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 mb-4">Menu Utama</p>
        {menuItems.map((item) => (
          <button
            key={item.name}
            onClick={() => { setActiveMenu(item.name); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all font-medium text-sm border-none bg-transparent text-left cursor-pointer ${activeMenu === item.name ? 'bg-blue-50/50 text-blue-900' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
          >
            <item.icon className="w-5 h-5 opacity-60" />
            {item.name}
          </button>
        ))}
      </div>

      {/* Sidebar Footer */}
      <div className="p-6 border-t border-slate-50 space-y-4">
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50/30 rounded-lg">
          <Wifi className="w-4 h-4 text-emerald-500" />
          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
            {isOffline ? "Server: Terputus" : "Server: Terhubung"}
          </span>
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all font-medium text-sm border-none bg-transparent text-left cursor-pointer"
        >
          <LogOut className="w-5 h-5 opacity-60" />
          Keluar
        </button>
      </div>
    </aside>
  );
}
