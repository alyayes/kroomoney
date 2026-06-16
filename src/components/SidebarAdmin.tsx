import {
  LayoutDashboard,
  Users,
  Database,
  BarChart3,
  ShieldCheck,
  Settings,
  LogOut,
  Activity,
  ChevronRight
} from "lucide-react";

interface SidebarAdminProps {
  activeMenu: string;
  setActiveMenu: (menu: string) => void;
  onLogout: () => void;
  isOffline: boolean;
  appName: string;
  treasurersCount: number;
}

export default function SidebarAdmin({
  activeMenu,
  setActiveMenu,
  onLogout,
  isOffline,
  appName,
  treasurersCount
}: SidebarAdminProps) {
  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "User Management", icon: Users, badge: treasurersCount.toString() },
    { name: "Master Data", icon: Database },
    { name: "Global Reports", icon: BarChart3 },
    { name: "Audit & Security", icon: ShieldCheck, badge: "!" },
    { name: "System Settings", icon: Settings }
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between select-none shrink-0">
      <div>
        {/* Header & App Branding */}
        <div className="h-20 flex items-center px-6 gap-3 border-b border-slate-50">
          <div className="w-10 h-10 flex items-center justify-center">
            <img src="/logo.png" alt="Kroomoney Logo" className="w-full h-full object-contain drop-shadow-sm mix-blend-multiply" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-blue-900 uppercase">{appName}</h1>
        </div>

        {/* Navigation Links */}
        <nav className="py-6 px-4 space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 mb-4">Navigasi Sistem</p>
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = activeMenu === item.name;
            return (
              <button
                key={item.name}
                onClick={() => setActiveMenu(item.name)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all text-sm font-bold border-none text-left cursor-pointer ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                <div className="flex items-center gap-4 flex-1">
                  <Icon className={`w-5 h-5 ${isActive ? "text-white opacity-100" : "text-slate-500 opacity-60"}`} />
                  <span>{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {item.badge && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isActive ? "bg-blue-700 text-white" : "bg-slate-100 text-slate-500"
                    }`}>
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-4 h-4 text-white opacity-80" />}
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer Info */}
      <div className="p-6 border-t border-slate-50 space-y-4">
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50/30 rounded-lg">
          <Activity className={`w-4 h-4 ${isOffline ? "text-amber-500" : "text-emerald-500"}`} />
          <span className={`text-[10px] font-bold ${isOffline ? "text-amber-500" : "text-emerald-500"} uppercase tracking-wider`}>
            {isOffline ? "Server: Offline" : "Server: Connected"}
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
