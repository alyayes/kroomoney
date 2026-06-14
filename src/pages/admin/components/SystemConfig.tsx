import React, { useState } from "react";
import { ToggleRight, ToggleLeft, Download, Upload, Eye, EyeOff, Sparkles, QrCode, RefreshCw } from "lucide-react";
import { motion } from "motion/react";

interface AppSettings {
  appName: string;
  logoUrl: string;
  maintenanceMode: boolean;
  themeAccent: string;
  backupInterval: string;
  geminiApiKey: string;
  geminiModel: string;
  geminiTemp: number;
  whatsappToken: string;
}

interface SystemConfigProps {
  appSettings: AppSettings;
  setAppSettings: (settings: AppSettings) => void;
  handleCreateBackup: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleRestoreBackup: (e: React.ChangeEvent<HTMLInputElement>) => void;
  triggerNotification: (message: string, type: "success" | "error" | "warning") => void;
}

export default function SystemConfig({
  appSettings,
  setAppSettings,
  handleCreateBackup,
  fileInputRef,
  handleRestoreBackup,
  triggerNotification
}: SystemConfigProps) {
  const [showApiKey, setShowApiKey] = useState(false);
  const [isWaConnected, setIsWaConnected] = useState(true);

  const handleTextChange = (field: keyof AppSettings, value: any) => {
    setAppSettings({
      ...appSettings,
      [field]: value
    });
  };

  return (
    <motion.div
      key="system-settings"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full font-sans text-[#1E2D50]"
    >
      {/* Left Column (8 cols): App & API Configuration */}
      <div className="lg:col-span-8 space-y-8">
        
        {/* Section 1: Metadata Brand */}
        <div className="bg-white p-6 rounded-2xl border border-[#DBEEFF] shadow-sm space-y-6">
          <div>
            <h4 className="text-lg font-black text-[#1E2D50] tracking-tight">Pengaturan Aplikasi Utama</h4>
            <p className="text-xs text-[#5A6A85] font-semibold uppercase tracking-wider mt-0.5">Sesuaikan metadata brand KroomBox</p>
          </div>

          <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={e => e.preventDefault()}>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-[#5A6A85] tracking-widest ml-1">Nama Aplikasi</label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:outline-none focus:border-[#2563EB] focus:bg-white transition-all"
                value={appSettings.appName}
                onChange={e => handleTextChange("appName", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-[#5A6A85] tracking-widest ml-1">Frekuensi Backup Otomatis</label>
              <select
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:outline-none focus:border-[#2563EB] focus:bg-white transition-all cursor-pointer"
                value={appSettings.backupInterval}
                onChange={e => handleTextChange("backupInterval", e.target.value)}
              >
                <option value="Hourly">Setiap Jam (Hourly)</option>
                <option value="Daily">Setiap Hari (Daily)</option>
                <option value="Weekly">Setiap Minggu (Weekly)</option>
              </select>
            </div>

            {/* Maintenance toggle */}
            <div className="col-span-1 md:col-span-2 py-4 border-t border-b border-[#DBEEFF] flex items-center justify-between">
              <div>
                <h5 className="text-sm font-bold text-[#1E2D50]">Maintenance Mode (Mode Pemeliharaan)</h5>
                <p className="text-[10px] text-[#5A6A85] font-semibold leading-relaxed max-w-md mt-0.5">Bila aktif, bendahara/staf tidak akan dapat menginput transaksi atau melakukan manipulasi database.</p>
              </div>

              <button
                type="button"
                onClick={() => {
                  const nextVal = !appSettings.maintenanceMode;
                  handleTextChange("maintenanceMode", nextVal);
                  triggerNotification(`Mode Pemeliharaan ${nextVal ? "Diaktifkan" : "Dinonaktifkan"}!`, nextVal ? "warning" : "success");
                }}
                className="focus:outline-none border-none bg-transparent cursor-pointer"
              >
                {appSettings.maintenanceMode ? (
                  <ToggleRight className="w-12 h-12 text-red-500 transition-all" />
                ) : (
                  <ToggleLeft className="w-12 h-12 text-slate-300 transition-all" />
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Section 2: AI Configuration (Gemini) */}
        <div className="bg-white p-6 rounded-2xl border border-[#DBEEFF] shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-lg font-black text-[#1E2D50] tracking-tight">Master Configuration (API & Gemini AI)</h4>
              <p className="text-xs text-[#5A6A85] font-semibold uppercase tracking-wider mt-0.5">Pengaturan kunci API & kreativitas penalaran AI</p>
            </div>
          </div>

          <form className="space-y-5" onSubmit={e => e.preventDefault()}>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-[#5A6A85] tracking-widest ml-1">Google Gemini API Key</label>
              <div className="relative">
                <input
                  type={showApiKey ? "text" : "password"}
                  className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-mono font-bold focus:outline-none focus:border-[#2563EB] focus:bg-white transition-all"
                  placeholder="AIzaSy..."
                  value={appSettings.geminiApiKey}
                  onChange={e => handleTextChange("geminiApiKey", e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5A6A85] hover:text-[#2563EB] p-1 cursor-pointer border-none bg-transparent"
                >
                  {showApiKey ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-[#5A6A85] tracking-widest ml-1">Versi Model LLM (Gemini)</label>
                <select
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:outline-none focus:border-[#2563EB] focus:bg-white transition-all cursor-pointer"
                  value={appSettings.geminiModel}
                  onChange={e => handleTextChange("geminiModel", e.target.value)}
                >
                  <option value="gemini-1.5-flash">Gemini 1.5 Flash (Cepat & Efisien)</option>
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash (Terbaru & Responsif)</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro (Akurasi Tinggi)</option>
                  <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash Exp</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[10px] font-black uppercase text-[#5A6A85] tracking-widest">Temperature: {appSettings.geminiTemp}</label>
                </div>
                <div className="flex items-center gap-4 py-2">
                  <input
                    type="range"
                    min="0"
                    max="1.5"
                    step="0.1"
                    className="w-full h-2 bg-[#EAF4FF] rounded-lg appearance-none cursor-pointer accent-[#2563EB]"
                    value={appSettings.geminiTemp}
                    onChange={e => handleTextChange("geminiTemp", parseFloat(e.target.value))}
                  />
                </div>
              </div>
            </div>
          </form>
        </div>

      </div>

      {/* Right Column (4 cols): WhatsApp and Utilities */}
      <div className="lg:col-span-4 space-y-8">
        
        {/* Section 3: WhatsApp Scanner Gateway */}
        <div className="bg-white p-6 rounded-2xl border border-[#DBEEFF] shadow-sm space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-black text-[#1E2D50] tracking-tight">WhatsApp Gateway</h4>
              <p className="text-[9px] text-[#5A6A85] font-semibold uppercase tracking-wider">Status Integrasi Pengiriman Invoice</p>
            </div>
          </div>

          {/* Connection Visual Box */}
          <div className="border border-[#DBEEFF] rounded-2xl p-5 bg-[#F8FBFF] flex flex-col items-center justify-center text-center space-y-4">
            {isWaConnected ? (
              <>
                <div className="relative w-36 h-36 bg-white rounded-2xl shadow-inner border border-[#DBEEFF] flex items-center justify-center p-3">
                  {/* Mock Connected Logo Screen */}
                  <div className="flex flex-col items-center">
                    <span className="w-3.5 h-3.5 bg-emerald-500 rounded-full animate-ping absolute top-3 right-3" />
                    <span className="w-3 h-3 bg-emerald-500 rounded-full absolute top-3.5 right-3.5" />
                    <span className="text-emerald-600 text-3xl font-black font-mono">Connected</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-[#1E2D50]">Device: Xiaomi Redmi Note 10</p>
                  <span className="text-[9px] text-[#5A6A85] font-semibold">Sesi: active_token_session_2026</span>
                </div>
                <button
                  onClick={() => {
                    setIsWaConnected(false);
                    triggerNotification("WhatsApp Gateway terputus!", "warning");
                  }}
                  className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  Simulasi Putus Koneksi
                </button>
              </>
            ) : (
              <>
                <div className="w-36 h-36 bg-white rounded-2xl shadow-md border border-[#DBEEFF] flex items-center justify-center relative overflow-hidden group">
                  {/* Mock QR Code Pattern representing QR Code Scan */}
                  <div className="absolute inset-0 bg-slate-900/5 backdrop-blur-[1px] flex items-center justify-center font-black text-[9px] uppercase tracking-wider text-[#1E2D50]">
                    Pindai QR Code
                  </div>
                  <img
                    src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=KroomBoxWhatsAppAuthSession2026"
                    alt="WhatsApp QR Code Scan"
                    className="w-full h-full p-2.5 object-contain"
                  />
                </div>
                <div>
                  <p className="text-xs font-bold text-red-500">Koneksi Terputus</p>
                  <span className="text-[9px] text-[#5A6A85] font-semibold">Silakan scan kode QR di atas</span>
                </div>
                <button
                  onClick={() => {
                    setIsWaConnected(true);
                    triggerNotification("WhatsApp Gateway berhasil tersambung!", "success");
                  }}
                  className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Sambungkan Kembali
                </button>
              </>
            )}
          </div>
        </div>

        {/* Section 4: Backup & Restore Tools */}
        <div className="bg-white p-6 rounded-2xl border border-[#DBEEFF] shadow-sm space-y-6">
          <div>
            <h4 className="text-base font-black text-[#1E2D50] tracking-tight">Database & Backup</h4>
            <p className="text-[10px] text-[#5A6A85] font-semibold uppercase tracking-wider mt-0.5">Ekspor & Pulihkan data KroomBox</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleCreateBackup}
              className="w-full flex items-center justify-center gap-3 bg-[#EAF4FF] hover:bg-[#DBEEFF] text-[#2563EB] border border-[#DBEEFF] py-3.5 rounded-xl font-bold text-xs shadow-sm transition-all active:scale-98 cursor-pointer border-none"
            >
              <Download className="w-4 h-4" /> UNDUH BACKUP (JSON)
            </button>
            
            <div>
              <input
                type="file"
                accept=".json"
                ref={fileInputRef}
                className="hidden"
                onChange={handleRestoreBackup}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-[#5A6A85] border border-slate-200 py-3.5 rounded-xl font-bold text-xs shadow-sm transition-all active:scale-98 cursor-pointer border-none"
              >
                <Upload className="w-4 h-4" /> PULIHKAN DATABASE
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Global Save Button bar at bottom of configuration */}
      <div className="col-span-12 bg-slate-50 p-4 rounded-2xl border border-[#DBEEFF] flex justify-end gap-3">
        <button
          onClick={() => {
            // Invokes useAdminDashboard's saveAppSettings which hits the API settings endpoint
            setAppSettings(appSettings);
          }}
          className="bg-[#2563EB] hover:bg-blue-700 text-white font-bold px-8 py-3.5 rounded-xl text-xs shadow-md transition-all active:scale-95 cursor-pointer border-none"
        >
          SIMPAN SEMUA PERUBAHAN CONFIG
        </button>
      </div>

    </motion.div>
  );
}
