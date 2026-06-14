import React from "react";
import {
  Settings,
  AlertTriangle,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAdminDashboard } from "./useAdminDashboard";

import SidebarAdmin from "../../components/SidebarAdmin";
import AdminOverview from "./components/AdminOverview";
import UserManager from "./components/UserManager";
import MasterDataPanel from "./components/MasterDataPanel";
import GlobalReportList from "./components/GlobalReportList";
import AuditSecurity from "./components/AuditSecurity";
import SystemConfig from "./components/SystemConfig";

interface Profile {
  nama: string;
  email: string;
  tandaTangan?: string;
  fotoProfil?: string;
  role?: string;
}

interface AdminDashboardProps {
  profile: Profile;
  token: string | null;
  onLogout: () => void;
  isOffline: boolean;
}

export default function AdminDashboard({ profile, token, onLogout, isOffline }: AdminDashboardProps) {
  const {
    activeMenu,
    setActiveMenu,
    notification,
    serverMetrics,
    treasurers,
    categories,
    paymentMethods,
    budgetPeriods,
    auditLogs,
    appSettings,
    setAppSettings,
    showAddUserModal,
    setShowAddUserModal,
    editingUser,
    setEditingUser,
    userForm,
    setUserForm,
    handleSaveUser,
    handleToggleStatus,
    handleDeleteUser,
    filterDate,
    setFilterDate,
    filterUser,
    setFilterUser,
    filterType,
    setFilterType,
    searchQuery,
    setSearchQuery,
    filteredTransactions,
    handleExportExcel,
    handleExportCSV,
    handleCreateBackup,
    handleRestoreBackup,
    fileInputRef,
    totalTrxVolume,
    chartData,
    triggerNotification,
    
    // Customer parameters
    customers,
    showAddCustomerModal,
    setShowAddCustomerModal,
    editingCustomer,
    setEditingCustomer,
    customerForm,
    setCustomerForm,
    handleSaveCustomer,
    handleDeleteCustomer
  } = useAdminDashboard({ profile, token, onLogout, isOffline });

  return (
    <div className="flex h-screen bg-[#FFFFFF] font-sans text-[#1E2D50] overflow-hidden">
      
      {/* LEFT SIDE BAR PANEL */}
      <SidebarAdmin
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        onLogout={onLogout}
        isOffline={isOffline}
        appName={appSettings.appName}
        treasurersCount={treasurers.length}
      />

      {/* RIGHT MAIN PANEL */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white">
        
        {/* TOP STATUS BAR */}
        <header className="h-20 border-b border-[#DBEEFF] px-8 flex items-center justify-between shrink-0 select-none">
          <div>
            <h2 className="text-xl font-black text-[#1E2D50] tracking-tight">{activeMenu}</h2>
            <p className="text-xs text-[#5A6A85] font-medium">Panel Admin untuk pengawasan, regulasi, dan sistem audit KroomBox.</p>
          </div>

          <div className="flex items-center gap-6">
            {/* Maintenance Mode Indicator */}
            {appSettings.maintenanceMode && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg animate-pulse text-xs font-black uppercase tracking-wider">
                <AlertTriangle className="w-3.5 h-3.5" />
                Maintenance Mode Aktif
              </div>
            )}

            <div className="flex items-center gap-3">
              <button 
                onClick={() => setActiveMenu("System Settings")}
                className="w-10 h-10 rounded-xl bg-[#EAF4FF] border border-[#DBEEFF] flex items-center justify-center text-[#2563EB] hover:bg-[#DBEEFF] transition-all cursor-pointer"
                title="System Settings"
              >
                <Settings className="w-4.5 h-4.5" />
              </button>
              
              <div className="flex items-center gap-3.5 pl-3 border-l border-[#DBEEFF]">
                <div className="w-9 h-9 rounded-xl bg-[#EAF4FF] flex items-center justify-center p-1 font-bold text-[#2563EB] text-sm shadow-sm border border-[#DBEEFF]">
                  AD
                </div>
                <div className="hidden md:block">
                  <p className="text-xs font-black text-[#1E2D50] leading-none">{profile.nama || "Super Admin"}</p>
                  <span className="text-[9px] text-[#5A6A85] font-black uppercase tracking-wider">{profile.role || "Admin"}</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* WORKSPACE CONTENT AREA */}
        <main className="flex-1 overflow-y-auto p-8 space-y-8 bg-white custom-scrollbar pb-20">
          
          <AnimatePresence mode="wait">
            {activeMenu === "Dashboard" ? (
              <AdminOverview
                treasurers={treasurers}
                filteredTransactions={filteredTransactions}
                totalTrxVolume={totalTrxVolume}
                serverMetrics={serverMetrics}
                chartData={chartData}
                auditLogs={auditLogs}
                setActiveMenu={setActiveMenu}
              />
            ) : activeMenu === "User Management" ? (
              <UserManager
                treasurers={treasurers}
                showAddUserModal={showAddUserModal}
                setShowAddUserModal={setShowAddUserModal}
                editingUser={editingUser}
                setEditingUser={setEditingUser}
                userForm={userForm}
                setUserForm={setUserForm}
                handleSaveUser={handleSaveUser}
                handleToggleStatus={handleToggleStatus}
                handleDeleteUser={handleDeleteUser}
              />
            ) : activeMenu === "Master Data" ? (
              <MasterDataPanel
                customers={customers}
                showAddCustomerModal={showAddCustomerModal}
                setShowAddCustomerModal={setShowAddCustomerModal}
                editingCustomer={editingCustomer}
                setEditingCustomer={setEditingCustomer}
                customerForm={customerForm}
                setCustomerForm={setCustomerForm}
                handleSaveCustomer={handleSaveCustomer}
                handleDeleteCustomer={handleDeleteCustomer}
              />
            ) : activeMenu === "Global Reports" ? (
              <GlobalReportList
                filteredTransactions={filteredTransactions}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                filterDate={filterDate}
                setFilterDate={setFilterDate}
                filterUser={filterUser}
                setFilterUser={setFilterUser}
                filterType={filterType}
                setFilterType={setFilterType}
                handleExportExcel={handleExportExcel}
                handleExportCSV={handleExportCSV}
              />
            ) : activeMenu === "Audit & Security" ? (
              <AuditSecurity
                auditLogs={auditLogs}
              />
            ) : activeMenu === "System Settings" ? (
              <SystemConfig
                appSettings={appSettings}
                setAppSettings={setAppSettings}
                handleCreateBackup={handleCreateBackup}
                fileInputRef={fileInputRef}
                handleRestoreBackup={handleRestoreBackup}
                triggerNotification={triggerNotification}
              />
            ) : null}
          </AnimatePresence>

        </main>

        {/* BOTTOM GLOBAL FLOATING NOTIFICATION */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`fixed bottom-8 right-8 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 z-50 border ${
                notification.type === "success" ? "bg-emerald-50 border-emerald-100 text-emerald-800" :
                notification.type === "error" ? "bg-red-50 border-red-100 text-red-800" :
                "bg-amber-50 border-amber-100 text-amber-800"
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 ${
                notification.type === "success" ? "bg-emerald-500" :
                notification.type === "error" ? "bg-red-500" : "bg-amber-500"
              }`}>
                <Check className="w-4 h-4" />
              </div>
              <span className="font-bold text-xs">{notification.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
