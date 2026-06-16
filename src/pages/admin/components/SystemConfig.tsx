import React, { useState } from "react";
import {
  ToggleRight, ToggleLeft, Download, Upload, Eye, EyeOff,
  Sparkles, QrCode, RefreshCw, Plus, Key, Globe, Copy,
  CheckCircle, Trash2, RotateCcw, Shield, Zap, Edit3, X, Check
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

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

interface ApiClient {
  id: number;
  client_name: string;
  client_code: string;
  api_key?: string;
  api_secret?: string;
  callback_url?: string;
  callback_secret?: string;
  description?: string;
  is_active: number;
  rate_limit_per_minute?: number;
  allowed_ips?: string;
  created_at?: string;
}

interface SystemConfigProps {
  appSettings: AppSettings;
  setAppSettings: (settings: AppSettings) => void;
  handleCreateBackup: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleRestoreBackup: (e: React.ChangeEvent<HTMLInputElement>) => void;
  triggerNotification: (message: string, type: "success" | "error" | "warning") => void;
  apiClients?: ApiClient[];
  createApiClient?: (payload: { client_name: string; client_code: string; callback_url: string; description: string }) => Promise<any>;
  updateApiClient?: (id: number, payload: { client_name?: string; callback_url?: string; description?: string; is_active?: number }) => Promise<void>;
  deactivateApiClient?: (id: number) => Promise<void>;
  rotateApiClientKeys?: (id: number) => Promise<any>;
  callbackLogs?: any[];
  resendCallback?: (transactionId: number, event: string) => Promise<any>;
}

const DEFAULT_NEW_CLIENT = { client_name: "", client_code: "", callback_url: "", description: "" };

export default function SystemConfig({
  appSettings,
  setAppSettings,
  handleCreateBackup,
  fileInputRef,
  handleRestoreBackup,
  triggerNotification,
  apiClients = [],
  createApiClient,
  updateApiClient,
  deactivateApiClient,
  rotateApiClientKeys,
  callbackLogs = [],
  resendCallback
}: SystemConfigProps) {
  const [showApiKey, setShowApiKey] = useState(false);
  const [isWaConnected, setIsWaConnected] = useState(true);

  // API Client states
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [newClientForm, setNewClientForm] = useState(DEFAULT_NEW_CLIENT);
  const [newClientLoading, setNewClientLoading] = useState(false);
  const [newClientResult, setNewClientResult] = useState<{ api_key: string; api_secret: string; callback_secret: string } | null>(null);
  const [editingClientId, setEditingClientId] = useState<number | null>(null);
  const [editCallbackUrl, setEditCallbackUrl] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [revealedKeys, setRevealedKeys] = useState<Set<number>>(new Set());
  const [rotatingId, setRotatingId] = useState<number | null>(null);
  const [rotatedKeys, setRotatedKeys] = useState<Record<number, { api_key: string; api_secret: string }>>({});

  // Webhook / Callback logs local states
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [manualTrxId, setManualTrxId] = useState("");
  const [manualEvent, setManualEvent] = useState("transaction.paid");
  const [triggeringManual, setTriggeringManual] = useState(false);
  const [retryingLogId, setRetryingLogId] = useState<number | null>(null);

  const handleManualTrigger = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTrxId) {
      triggerNotification("ID Transaksi wajib diisi!", "error");
      return;
    }
    if (!resendCallback) return;
    setTriggeringManual(true);
    try {
      await resendCallback(parseInt(manualTrxId), manualEvent);
      triggerNotification(`Callback ${manualEvent} berhasil dikirim!`, "success");
      setManualTrxId("");
    } catch (err: any) {
      // Notification is handled inside the hook
    } finally {
      setTriggeringManual(false);
    }
  };

  const handleRetryLog = async (log: any) => {
    if (!resendCallback) return;
    setRetryingLogId(log.id);
    try {
      const trxId = log.ref_transaction_id || log.ext_transaction_id;
      // Get event type from request payload or default
      const eventName = log.payload?.event || "transaction.paid";
      await resendCallback(trxId, eventName);
      triggerNotification("Retry callback berhasil dilakukan!", "success");
    } catch (err) {
      // Error is handled inside the hook
    } finally {
      setRetryingLogId(null);
    }
  };

  const handleTextChange = (field: keyof AppSettings, value: any) => {
    setAppSettings({ ...appSettings, [field]: value });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(label);
      setTimeout(() => setCopiedKey(null), 2000);
      triggerNotification(`${label} berhasil disalin!`, "success");
    });
  };

  const toggleReveal = (id: number) => {
    setRevealedKeys(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientForm.client_name || !newClientForm.client_code) {
      triggerNotification("Nama client dan Client Code wajib diisi!", "error");
      return;
    }
    if (!createApiClient) return;
    setNewClientLoading(true);
    try {
      const result = await createApiClient(newClientForm);
      setNewClientResult(result);
      setNewClientForm(DEFAULT_NEW_CLIENT);
      triggerNotification("API Client berhasil didaftarkan!", "success");
    } catch (err: any) {
      triggerNotification(err.message || "Gagal mendaftarkan API client.", "error");
    } finally {
      setNewClientLoading(false);
    }
  };

  const handleRotateKeys = async (id: number) => {
    if (!rotateApiClientKeys) return;
    if (!confirm("Rotasi key akan membatalkan semua key lama. Lanjutkan?")) return;
    setRotatingId(id);
    try {
      const result = await rotateApiClientKeys(id);
      setRotatedKeys(prev => ({ ...prev, [id]: result }));
      triggerNotification("API Key & Secret berhasil dirotasi!", "success");
    } catch (err: any) {
      triggerNotification(err.message || "Gagal merotasi key.", "error");
    } finally {
      setRotatingId(null);
    }
  };

  const handleSaveCallback = async (id: number) => {
    if (!updateApiClient) return;
    try {
      await updateApiClient(id, { callback_url: editCallbackUrl });
      setEditingClientId(null);
      triggerNotification("Callback URL berhasil diperbarui!", "success");
    } catch (err: any) {
      triggerNotification(err.message || "Gagal menyimpan callback URL.", "error");
    }
  };

  const handleDeactivate = async (id: number, name: string) => {
    if (!deactivateApiClient) return;
    if (!confirm(`Nonaktifkan API Client "${name}"? Key akan segera dicabut.`)) return;
    try {
      await deactivateApiClient(id);
      triggerNotification(`Client "${name}" berhasil dinonaktifkan!`, "warning");
    } catch (err: any) {
      triggerNotification(err.message || "Gagal menonaktifkan client.", "error");
    }
  };

  return (
    <motion.div
      key="system-settings"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-8 w-full font-sans text-[#1E2D50]"
    >

      {/* ─── ROW 1: App Settings + AI Config ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left: App Metadata + AI */}
        <div className="lg:col-span-8 space-y-8">

          {/* Section 1: App Metadata */}
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
              <div className="col-span-1 md:col-span-2 py-4 border-t border-b border-[#DBEEFF] flex items-center justify-between">
                <div>
                  <h5 className="text-sm font-bold text-[#1E2D50]">Maintenance Mode</h5>
                  <p className="text-[10px] text-[#5A6A85] font-semibold leading-relaxed max-w-md mt-0.5">Bila aktif, bendahara/staf tidak dapat menginput transaksi atau manipulasi database.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !appSettings.maintenanceMode;
                    handleTextChange("maintenanceMode", next);
                    triggerNotification(`Mode Pemeliharaan ${next ? "Diaktifkan" : "Dinonaktifkan"}!`, next ? "warning" : "success");
                  }}
                  className="focus:outline-none border-none bg-transparent cursor-pointer"
                >
                  {appSettings.maintenanceMode
                    ? <ToggleRight className="w-12 h-12 text-red-500 transition-all" />
                    : <ToggleLeft className="w-12 h-12 text-slate-300 transition-all" />}
                </button>
              </div>
            </form>
          </div>

          {/* Section 2: Gemini AI */}
          <div className="bg-white p-6 rounded-2xl border border-[#DBEEFF] shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-lg font-black text-[#1E2D50] tracking-tight">Master Configuration (Gemini AI)</h4>
                <p className="text-xs text-[#5A6A85] font-semibold uppercase tracking-wider mt-0.5">Konfigurasi kunci & kreativitas penalaran AI</p>
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
                  <label className="text-[10px] font-black uppercase text-[#5A6A85] tracking-widest ml-1">Versi Model LLM</label>
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
                  <label className="text-[10px] font-black uppercase text-[#5A6A85] tracking-widest ml-1">Temperature: {appSettings.geminiTemp}</label>
                  <div className="flex items-center gap-4 py-2">
                    <input
                      type="range" min="0" max="1.5" step="0.1"
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

        {/* Right: WhatsApp + Backup */}
        <div className="lg:col-span-4 space-y-8">
          {/* WhatsApp Gateway */}
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
            <div className="border border-[#DBEEFF] rounded-2xl p-5 bg-[#F8FBFF] flex flex-col items-center justify-center text-center space-y-4">
              {isWaConnected ? (
                <>
                  <div className="relative w-36 h-36 bg-white rounded-2xl shadow-inner border border-[#DBEEFF] flex items-center justify-center p-3">
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
                    onClick={() => { setIsWaConnected(false); triggerNotification("WhatsApp Gateway terputus!", "warning"); }}
                    className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all active:scale-95 cursor-pointer"
                  >Simulasi Putus Koneksi</button>
                </>
              ) : (
                <>
                  <div className="w-36 h-36 bg-white rounded-2xl shadow-md border border-[#DBEEFF] flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-slate-900/5 backdrop-blur-[1px] flex items-center justify-center font-black text-[9px] uppercase tracking-wider text-[#1E2D50]">Pindai QR Code</div>
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=KroomBoxWhatsAppAuthSession2026" alt="WhatsApp QR" className="w-full h-full p-2.5 object-contain" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-red-500">Koneksi Terputus</p>
                    <span className="text-[9px] text-[#5A6A85] font-semibold">Silakan scan kode QR di atas</span>
                  </div>
                  <button
                    onClick={() => { setIsWaConnected(true); triggerNotification("WhatsApp Gateway berhasil tersambung!", "success"); }}
                    className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Sambungkan Kembali
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Backup & Restore */}
          <div className="bg-white p-6 rounded-2xl border border-[#DBEEFF] shadow-sm space-y-6">
            <div>
              <h4 className="text-base font-black text-[#1E2D50] tracking-tight">Database & Backup</h4>
              <p className="text-[10px] text-[#5A6A85] font-semibold uppercase tracking-wider mt-0.5">Ekspor & Pulihkan data KroomBox</p>
            </div>
            <div className="space-y-3">
              <button
                onClick={handleCreateBackup}
                className="w-full flex items-center justify-center gap-3 bg-[#EAF4FF] hover:bg-[#DBEEFF] text-[#2563EB] border border-[#DBEEFF] py-3.5 rounded-xl font-bold text-xs shadow-sm transition-all active:scale-98 cursor-pointer"
              >
                <Download className="w-4 h-4" /> UNDUH BACKUP (JSON)
              </button>
              <div>
                <input type="file" accept=".json" ref={fileInputRef} className="hidden" onChange={handleRestoreBackup} />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-[#5A6A85] border border-slate-200 py-3.5 rounded-xl font-bold text-xs shadow-sm transition-all active:scale-98 cursor-pointer"
                >
                  <Upload className="w-4 h-4" /> PULIHKAN DATABASE
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── ROW 2: API Client & Callback Management ─── */}
      <div className="bg-white rounded-2xl border border-[#DBEEFF] shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#DBEEFF] bg-gradient-to-r from-[#EAF4FF] to-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#2563EB] text-white rounded-xl flex items-center justify-center shadow-sm">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-lg font-black text-[#1E2D50] tracking-tight">API Client & Callback Management</h4>
              <p className="text-xs text-[#5A6A85] font-semibold uppercase tracking-wider mt-0.5">Kelola API key, secret, dan callback URL integrasi eksternal</p>
            </div>
          </div>
          <button
            onClick={() => { setShowNewClientModal(true); setNewClientResult(null); }}
            className="flex items-center gap-2 bg-[#2563EB] hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer border-none"
          >
            <Plus className="w-4 h-4" /> Daftarkan Client Baru
          </button>
        </div>

        {/* Stats bar */}
        <div className="px-6 py-3 border-b border-[#DBEEFF] bg-slate-50 flex items-center gap-6">
          <div className="flex items-center gap-2 text-xs font-bold text-[#5A6A85]">
            <Zap className="w-3.5 h-3.5 text-emerald-500" />
            <span>{apiClients.filter(c => c.is_active).length} Aktif</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#5A6A85]">
            <Shield className="w-3.5 h-3.5 text-slate-400" />
            <span>{apiClients.filter(c => !c.is_active).length} Nonaktif</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#5A6A85]">
            <Globe className="w-3.5 h-3.5 text-blue-500" />
            <span>{apiClients.filter(c => c.callback_url).length} Punya Callback URL</span>
          </div>
        </div>

        {/* Client List */}
        {apiClients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-[#5A6A85]">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
              <Key className="w-8 h-8 text-slate-300" />
            </div>
            <p className="font-bold text-sm">Belum ada API Client terdaftar</p>
            <p className="text-xs mt-1">Klik "Daftarkan Client Baru" untuk membuat integrasi API pertama</p>
          </div>
        ) : (
          <div className="divide-y divide-[#DBEEFF]">
            {apiClients.map((client) => {
              const isRevealed = revealedKeys.has(client.id);
              const rotated = rotatedKeys[client.id];
              const displayKey = rotated?.api_key || client.api_key;
              const displaySecret = rotated?.api_secret || client.api_secret;
              const isEditing = editingClientId === client.id;

              return (
                <motion.div
                  key={client.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`px-6 py-5 transition-colors ${client.is_active ? "bg-white hover:bg-slate-50/50" : "bg-slate-50 opacity-60"}`}
                >
                  {/* Top row: name + status + actions */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black ${client.is_active ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-slate-100 text-slate-400 border border-slate-200"}`}>
                        {client.client_code?.slice(0, 2).toUpperCase() || "??"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-[#1E2D50]">{client.client_name}</span>
                          <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md">{client.client_code}</span>
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${client.is_active ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
                            {client.is_active ? "● Aktif" : "○ Nonaktif"}
                          </span>
                        </div>
                        {client.description && <p className="text-[10px] text-[#5A6A85] font-semibold mt-0.5">{client.description}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleRotateKeys(client.id)}
                        disabled={rotatingId === client.id}
                        title="Rotasi API Key & Secret"
                        className="w-8 h-8 rounded-lg border border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100 flex items-center justify-center transition-all active:scale-90 cursor-pointer disabled:opacity-50"
                      >
                        <RotateCcw className={`w-3.5 h-3.5 ${rotatingId === client.id ? "animate-spin" : ""}`} />
                      </button>
                      <button
                        onClick={() => handleDeactivate(client.id, client.client_name)}
                        title="Nonaktifkan Client"
                        className="w-8 h-8 rounded-lg border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-all active:scale-90 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Credentials Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    {/* API Key */}
                    {displayKey && (
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-widest text-[#5A6A85] flex items-center gap-1">
                          <Key className="w-2.5 h-2.5" /> API Key
                          {rotated && <span className="text-amber-500 text-[8px]">(Diperbarui)</span>}
                        </label>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 text-[10px] font-mono text-[#1E2D50] truncate">
                            {isRevealed ? displayKey : `${displayKey.slice(0, 12)}${"•".repeat(20)}`}
                          </code>
                          <button onClick={() => toggleReveal(client.id)} className="text-[#5A6A85] hover:text-[#2563EB] p-1 cursor-pointer border-none bg-transparent">
                            {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => copyToClipboard(displayKey, `API Key ${client.client_code}`)}
                            className="text-[#5A6A85] hover:text-[#2563EB] p-1 cursor-pointer border-none bg-transparent"
                          >
                            {copiedKey === `API Key ${client.client_code}` ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* API Secret */}
                    {displaySecret && (
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-widest text-[#5A6A85] flex items-center gap-1">
                          <Shield className="w-2.5 h-2.5" /> API Secret
                          {rotated && <span className="text-amber-500 text-[8px]">(Diperbarui)</span>}
                        </label>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 text-[10px] font-mono text-[#1E2D50] truncate">
                            {isRevealed ? displaySecret : `${displaySecret.slice(0, 12)}${"•".repeat(20)}`}
                          </code>
                          <button
                            onClick={() => copyToClipboard(displaySecret, `API Secret ${client.client_code}`)}
                            className="text-[#5A6A85] hover:text-[#2563EB] p-1 cursor-pointer border-none bg-transparent"
                          >
                            {copiedKey === `API Secret ${client.client_code}` ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Callback URL Row */}
                  <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-blue-500 flex items-center gap-1">
                        <Globe className="w-2.5 h-2.5" /> Callback URL
                      </label>
                      {!isEditing ? (
                        <button
                          onClick={() => { setEditingClientId(client.id); setEditCallbackUrl(client.callback_url || ""); }}
                          className="flex items-center gap-1 text-[9px] font-black uppercase text-[#2563EB] hover:text-blue-800 cursor-pointer border-none bg-transparent"
                        >
                          <Edit3 className="w-2.5 h-2.5" /> Edit
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleSaveCallback(client.id)} className="flex items-center gap-1 text-[9px] font-black uppercase text-emerald-600 hover:text-emerald-800 cursor-pointer border-none bg-transparent">
                            <Check className="w-3 h-3" /> Simpan
                          </button>
                          <button onClick={() => setEditingClientId(null)} className="flex items-center gap-1 text-[9px] font-black uppercase text-red-500 hover:text-red-700 cursor-pointer border-none bg-transparent">
                            <X className="w-3 h-3" /> Batal
                          </button>
                        </div>
                      )}
                    </div>
                    {isEditing ? (
                      <input
                        type="url"
                        autoFocus
                        value={editCallbackUrl}
                        onChange={e => setEditCallbackUrl(e.target.value)}
                        placeholder="https://yourdomain.com/api/webhook/kroomoney"
                        className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-xs font-mono font-bold focus:outline-none focus:border-[#2563EB] transition-all"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-[10px] font-mono text-[#1E2D50] truncate">
                          {client.callback_url || <span className="text-slate-400 italic">Belum dikonfigurasi</span>}
                        </code>
                        {client.callback_url && (
                          <button
                            onClick={() => copyToClipboard(client.callback_url!, `Callback URL ${client.client_code}`)}
                            className="text-[#5A6A85] hover:text-[#2563EB] p-1 cursor-pointer border-none bg-transparent"
                          >
                            {copiedKey === `Callback URL ${client.client_code}` ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Callback Secret (if available) */}
                  {client.callback_secret && (
                    <div className="mt-3 bg-violet-50/50 border border-violet-100 rounded-xl p-3">
                      <label className="text-[9px] font-black uppercase tracking-widest text-violet-500 flex items-center gap-1 mb-1.5">
                        <Shield className="w-2.5 h-2.5" /> Callback Secret (HMAC Signing)
                      </label>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-[10px] font-mono text-[#1E2D50] truncate">
                          {isRevealed ? client.callback_secret : `${client.callback_secret.slice(0, 12)}${"•".repeat(20)}`}
                        </code>
                        <button
                          onClick={() => copyToClipboard(client.callback_secret!, `Callback Secret ${client.client_code}`)}
                          className="text-[#5A6A85] hover:text-violet-600 p-1 cursor-pointer border-none bg-transparent"
                        >
                          {copiedKey === `Callback Secret ${client.client_code}` ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── ROW 3: Webhook Callback Logs & Manual Trigger ─── */}
      <div className="bg-white rounded-2xl border border-[#DBEEFF] shadow-sm overflow-hidden space-y-6 p-6">
        <div>
          <h4 className="text-lg font-black text-[#1E2D50] tracking-tight flex items-center gap-2">
            <Globe className="w-5 h-5 text-[#2563EB]" /> Webhook Callback Monitor & Troubleshooting
          </h4>
          <p className="text-xs text-[#5A6A85] font-semibold uppercase tracking-wider mt-0.5">
            Pantau status pengiriman webhook ke aplikasi eksternal dan trigger aktivasi hosting manual
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Manual Activation Trigger Form */}
          <div className="lg:col-span-4 bg-slate-50/50 border border-slate-100 rounded-2xl p-5 space-y-4">
            <div>
              <h5 className="text-xs font-black uppercase text-[#1E2D50] tracking-wider">Manual Webhook Trigger</h5>
              <p className="text-[10px] text-[#5A6A85] font-medium leading-relaxed mt-0.5">
                Kirim callback aktivasi hosting secara manual menggunakan ID Transaksi untuk integrasi bermasalah.
              </p>
            </div>
            <form onSubmit={handleManualTrigger} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-[#5A6A85] ml-1">ID Transaksi (Kroombox)</label>
                <input
                  type="number"
                  required
                  placeholder="Contoh: 15"
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-[#2563EB] transition-all"
                  value={manualTrxId}
                  onChange={e => setManualTrxId(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-[#5A6A85] ml-1">Event Type</label>
                <select
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#2563EB] transition-all cursor-pointer"
                  value={manualEvent}
                  onChange={e => setManualEvent(e.target.value)}
                >
                  <option value="transaction.paid">transaction.paid (Aktivasi Layanan/Hosting)</option>
                  <option value="transaction.verified">transaction.verified (Persetujuan Bendahara)</option>
                  <option value="transaction.cancelled">transaction.cancelled (Pembatalan Transaksi)</option>
                  <option value="invoice.generated">invoice.generated (Invoice Diterbitkan)</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={triggeringManual}
                className="w-full flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-xs shadow-sm transition-all active:scale-95 cursor-pointer border-none disabled:opacity-60"
              >
                {triggeringManual ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                {triggeringManual ? "Mengirim..." : "Trigger Callback"}
              </button>
            </form>
          </div>

          {/* Right: Callback Delivery Logs Table */}
          <div className="lg:col-span-8 flex flex-col space-y-4">
            <div>
              <h5 className="text-xs font-black uppercase text-[#1E2D50] tracking-wider">Log Pengiriman Webhook Terakhir</h5>
              <p className="text-[10px] text-[#5A6A85] font-medium leading-relaxed mt-0.5">
                Daftar log pengiriman keluar (POST webhook) yang dikirim ke aplikasi klien.
              </p>
            </div>

            <div className="border border-[#DBEEFF] rounded-xl overflow-hidden bg-white max-h-[350px] overflow-y-auto custom-scrollbar">
              {callbackLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-[#5A6A85]">
                  <Globe className="w-8 h-8 text-slate-300 mb-2" />
                  <p className="font-bold text-xs">Belum ada log callback tercatat</p>
                  <p className="text-[10px] mt-0.5">Sistem akan mencatat log saat transaksi API diproses</p>
                </div>
              ) : (
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-[#DBEEFF] text-[9px] font-black uppercase text-[#5A6A85] tracking-wider sticky top-0 z-10 select-none">
                      <th className="py-3 px-4">Waktu</th>
                      <th className="py-3 px-4">Client</th>
                      <th className="py-3 px-4">Event</th>
                      <th className="py-3 px-4">HTTP</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DBEEFF] text-xs font-semibold">
                    {callbackLogs.map((log: any) => {
                      const eventName = log.payload?.event || "transaction.paid";
                      const isSuccess = log.status === "success";
                      const isFailed = log.status === "failed";

                      return (
                        <tr 
                          key={log.id} 
                          className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                          onClick={() => setSelectedLog(log)}
                        >
                          <td className="py-3 px-4 text-[10px] text-slate-500 font-mono whitespace-nowrap">
                            {new Date(log.created_at).toLocaleString("id-ID", {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                              day: "2-digit",
                              month: "2-digit"
                            })}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-[10px]">
                            <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded uppercase">
                              {log.client_code || "API"}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-[10px] text-indigo-600 whitespace-nowrap">
                            {eventName}
                          </td>
                          <td className="py-3 px-4 font-mono text-[10px]">
                            {log.http_status ? (
                              <span className={log.http_status >= 200 && log.http_status < 300 ? "text-emerald-600 font-black" : "text-red-500 font-black"}>
                                {log.http_status}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-bold">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                              isSuccess ? "bg-emerald-50 text-emerald-600" :
                              isFailed ? "bg-red-50 text-red-500" :
                              "bg-amber-50 text-amber-600"
                            }`}>
                              {log.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right" onClick={e => e.stopPropagation()}>
                            <button
                              disabled={retryingLogId === log.id}
                              onClick={() => handleRetryLog(log)}
                              title="Kirim Ulang Callback"
                              className="p-1 rounded bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-600 cursor-pointer disabled:opacity-50 transition-all"
                            >
                              <RefreshCw className={`w-3.5 h-3.5 ${retryingLogId === log.id ? "animate-spin" : ""}`} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Global Save Button ─── */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-[#DBEEFF] flex justify-end gap-3">
        <button
          onClick={() => setAppSettings(appSettings)}
          className="bg-[#2563EB] hover:bg-blue-700 text-white font-bold px-8 py-3.5 rounded-xl text-xs shadow-md transition-all active:scale-95 cursor-pointer border-none"
        >
          SIMPAN SEMUA PERUBAHAN CONFIG
        </button>
      </div>

      {/* ─── Modal: Daftarkan API Client Baru ─── */}
      <AnimatePresence>
        {showNewClientModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) { setShowNewClientModal(false); setNewClientResult(null); } }}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl border border-[#DBEEFF] w-full max-w-lg overflow-hidden"
            >
              {/* Modal Header */}
              <div className="px-6 py-5 border-b border-[#DBEEFF] bg-gradient-to-r from-[#EAF4FF] to-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-[#2563EB] text-white rounded-xl flex items-center justify-center">
                    <Plus className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[#1E2D50]">Daftarkan API Client Baru</h3>
                    <p className="text-[10px] text-[#5A6A85] font-semibold">Generate API Key & Secret otomatis</p>
                  </div>
                </div>
                <button onClick={() => { setShowNewClientModal(false); setNewClientResult(null); }} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-red-50 hover:text-red-500 text-slate-400 flex items-center justify-center cursor-pointer border-none transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                {!newClientResult ? (
                  <form onSubmit={handleCreateClient} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-[#5A6A85] tracking-widest ml-1">Nama Client *</label>
                        <input
                          type="text"
                          required
                          placeholder="Contoh: Google Sheets"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-[#2563EB] focus:bg-white transition-all"
                          value={newClientForm.client_name}
                          onChange={e => setNewClientForm(p => ({ ...p, client_name: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-[#5A6A85] tracking-widest ml-1">Client Code *</label>
                        <input
                          type="text"
                          required
                          placeholder="GSHEET / ZAPIER"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold font-mono uppercase focus:outline-none focus:border-[#2563EB] focus:bg-white transition-all"
                          value={newClientForm.client_code}
                          onChange={e => setNewClientForm(p => ({ ...p, client_code: e.target.value.toUpperCase() }))}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-[#5A6A85] tracking-widest ml-1">Callback URL (Webhook)</label>
                      <input
                        type="url"
                        placeholder="https://yourdomain.com/api/webhook/kroomoney"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold focus:outline-none focus:border-[#2563EB] focus:bg-white transition-all"
                        value={newClientForm.callback_url}
                        onChange={e => setNewClientForm(p => ({ ...p, callback_url: e.target.value }))}
                      />
                      <p className="text-[10px] text-[#5A6A85] font-semibold ml-1">URL yang akan menerima notifikasi event (invoice, payment, dll)</p>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-[#5A6A85] tracking-widest ml-1">Deskripsi</label>
                      <textarea
                        rows={2}
                        placeholder="Integrasi untuk sinkronisasi data keuangan ke Google Sheets..."
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-[#2563EB] focus:bg-white transition-all resize-none"
                        value={newClientForm.description}
                        onChange={e => setNewClientForm(p => ({ ...p, description: e.target.value }))}
                      />
                    </div>
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-start gap-2">
                      <Shield className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                      <p className="text-[10px] font-semibold text-amber-700 leading-relaxed">
                        API Key & Secret akan ditampilkan <strong>sekali saja</strong> setelah pendaftaran. Simpan di tempat aman sebelum menutup modal ini.
                      </p>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                      <button type="button" onClick={() => setShowNewClientModal(false)} className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs hover:bg-slate-200 transition-all cursor-pointer border-none">Batal</button>
                      <button
                        type="submit"
                        disabled={newClientLoading}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer border-none disabled:opacity-60"
                      >
                        {newClientLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />}
                        {newClientLoading ? "Mendaftarkan..." : "Generate & Daftarkan"}
                      </button>
                    </div>
                  </form>
                ) : (
                  /* Success: show credentials */
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                      <p className="text-xs font-bold text-emerald-700">API Client berhasil didaftarkan! Salin kredensial berikut sekarang.</p>
                    </div>
                    {[
                      { label: "API Key", value: newClientResult.api_key, color: "blue" },
                      { label: "API Secret", value: newClientResult.api_secret, color: "violet" },
                      { label: "Callback Secret (HMAC)", value: newClientResult.callback_secret, color: "amber" }
                    ].map(item => (
                      <div key={item.label} className={`bg-${item.color}-50 border border-${item.color}-100 rounded-xl p-3 space-y-1.5`}>
                        <label className={`text-[9px] font-black uppercase tracking-widest text-${item.color}-500`}>{item.label}</label>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 text-[10px] font-mono text-[#1E2D50] break-all leading-relaxed">{item.value}</code>
                          <button
                            onClick={() => copyToClipboard(item.value, item.label)}
                            className={`shrink-0 w-7 h-7 rounded-lg bg-${item.color}-100 text-${item.color}-600 hover:bg-${item.color}-200 flex items-center justify-center cursor-pointer border-none transition-all`}
                          >
                            {copiedKey === item.label ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex items-start gap-2">
                      <Shield className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" />
                      <p className="text-[10px] font-bold text-red-700">Kredensial ini tidak akan ditampilkan lagi. Simpan sekarang di password manager Anda.</p>
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={() => { setShowNewClientModal(false); setNewClientResult(null); }}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer border-none"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Sudah Disimpan, Tutup
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Modal: Detail Webhook Callback Log ─── */}
      <AnimatePresence>
        {selectedLog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedLog(null)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl border border-[#DBEEFF] w-full max-w-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="px-6 py-5 border-b border-[#DBEEFF] bg-gradient-to-r from-[#EAF4FF] to-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-[#2563EB] text-white rounded-xl flex items-center justify-center">
                    <Globe className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[#1E2D50]">Detail Outgoing Webhook</h3>
                    <p className="text-[10px] text-[#5A6A85] font-semibold">Inspeksi detail request & response HTTP callback</p>
                  </div>
                </div>
                <button onClick={() => setSelectedLog(null)} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-red-50 hover:text-red-500 text-slate-400 flex items-center justify-center cursor-pointer border-none transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar">
                {/* Meta details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 rounded-xl p-4 border border-slate-100 text-xs">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Client</span>
                    <strong className="text-[#1E2D50] block truncate">{selectedLog.client_name} ({selectedLog.client_code})</strong>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Event Type</span>
                    <strong className="text-indigo-600 font-mono block truncate">{selectedLog.payload?.event || "transaction.paid"}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Status Pengiriman</span>
                    <span className={`inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                      selectedLog.status === "success" ? "bg-emerald-50 text-emerald-600" :
                      selectedLog.status === "failed" ? "bg-red-50 text-red-500" : "bg-amber-50 text-amber-600"
                    }`}>
                      {selectedLog.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Waktu</span>
                    <span className="text-slate-600 font-mono block">{new Date(selectedLog.created_at).toLocaleString("id-ID")}</span>
                  </div>
                </div>

                {/* HTTP Endpoint */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-[#5A6A85] tracking-widest ml-1">Target Callback URL</label>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">POST</span>
                    <code className="flex-1 text-[11px] font-mono text-[#1E2D50] break-all">{selectedLog.endpoint}</code>
                  </div>
                </div>

                {/* Request Payload JSON */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-[#5A6A85] tracking-widest ml-1">Request Payload (JSON)</label>
                  <pre className="bg-[#1E2D50] text-slate-100 p-4 rounded-xl text-[10px] font-mono overflow-x-auto leading-relaxed shadow-inner max-h-40 overflow-y-auto">
                    {JSON.stringify(selectedLog.payload, null, 2)}
                  </pre>
                </div>

                {/* Response Code & Body / Error Message */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase text-[#5A6A85] tracking-widest ml-1">HTTP Response</label>
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 min-h-[120px] max-h-40 overflow-y-auto">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[9px] uppercase font-bold text-slate-400">HTTP Status:</span>
                        <span className={`text-[10px] font-mono font-black ${
                          selectedLog.http_status >= 200 && selectedLog.http_status < 300 ? "text-emerald-600" : "text-red-500"
                        }`}>
                          {selectedLog.http_status || "Timeout / Connection Failed"}
                        </span>
                      </div>
                      <pre className="text-[10px] font-mono text-slate-600 break-all whitespace-pre-wrap">
                        {selectedLog.response_body || <span className="text-slate-400 italic">No response body</span>}
                      </pre>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase text-red-500 tracking-widest ml-1">Error Message (Internal)</label>
                    <div className="bg-red-50/30 border border-red-100/50 rounded-xl p-3 min-h-[120px] max-h-40 overflow-y-auto text-red-800 text-[10px] font-mono">
                      {selectedLog.error_message ? (
                        <p className="whitespace-pre-wrap leading-relaxed">{selectedLog.error_message}</p>
                      ) : (
                        <p className="text-slate-400 italic">Tidak ada error internal tercatat (Sukses)</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button onClick={() => setSelectedLog(null)} className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs hover:bg-slate-200 transition-all cursor-pointer border-none">
                    Tutup Detail
                  </button>
                  <button
                    disabled={retryingLogId === selectedLog.id}
                    onClick={() => { handleRetryLog(selectedLog); setSelectedLog(null); }}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer border-none disabled:opacity-60"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${retryingLogId === selectedLog.id ? "animate-spin" : ""}`} />
                    Kirim Ulang Sekarang
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
