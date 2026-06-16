import React from "react";
import {
  LayoutDashboard,
  PlusCircle,
  TrendingUp,
  TrendingDown,
  Wallet,
  BarChart3,
  Wifi,
  LogOut,
  ChevronRight
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
    { name: "Add Transaction", icon: PlusCircle },
    { name: "Debit Entries", icon: TrendingUp },
    { name: "Credit Entries", icon: TrendingDown },
    { name: "Transactions", icon: Wallet },
    { name: "Financial Reports", icon: BarChart3 }
  ];

  return (
    <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 lg:relative lg:translate-x-0 shrink-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      {/* Sidebar Header */}
      <div className="h-20 flex items-center px-6 gap-3 border-b border-slate-50">
        <div className="w-10 h-10 flex items-center justify-center">
          <img src="/logo.png" alt="Kroomoney Logo" className="w-full h-full object-contain drop-shadow-sm mix-blend-multiply" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-blue-900">KROOMONEY</h1>
      </div>

      {/* Sidebar Menu */}
      <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 mb-4">MAIN MENU</p>
        {menuItems.map((item) => (
          <button
            key={item.name}
            onClick={() => { setActiveMenu(item.name); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all font-bold text-sm border-none text-left cursor-pointer ${activeMenu === item.name ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25' : 'bg-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
          >
            <item.icon className={`w-5 h-5 ${activeMenu === item.name ? 'opacity-100 text-white' : 'opacity-60 text-slate-400'}`} />
            <span className="flex-1">{item.name}</span>
            {activeMenu === item.name && <ChevronRight className="w-4 h-4 text-white opacity-80" />}
          </button>
        ))}
      </div>

      {/* Sidebar Footer */}
      <div className="p-6 border-t border-slate-50 space-y-4">
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50/30 rounded-lg">
          <Wifi className="w-4 h-4 text-emerald-500" />
          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
            {isOffline ? "Server: Offline" : "Server: Connected"}
          </span>
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all font-medium text-sm border-none bg-transparent text-left cursor-pointer"
        >
          <LogOut className="w-5 h-5 opacity-60" />
          Logout
        </button>
      </div>
    </aside>
  );
}
