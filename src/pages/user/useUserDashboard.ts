import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";

interface Transaction {
  id: string;
  trxId: string;
  tanggal: string;
  userId: string;
  tipe: "Debit" | "Kredit";
  statusPembayaran: "Lunas" | "Pending" | "Belum Lunas" | "DP";
  statusDokumen: "Draft" | "Diproses" | "Disetujui";
  sertakanTandaTangan: boolean;
  jumlah: number;
  kuantitas: number;
  diskon?: number;
  items?: Array<{
    tanggal: string;
    tipe: "Debit" | "Kredit";
    statusPembayaran: "Lunas" | "Pending" | "Belum Lunas" | "DP";
    jumlah: string;
    kuantitas: string;
    diskon: string;
    namaPembeli: string;
    noTelepon: string;
    notes: string;
  }>;
  namaPembeli: string;
  noTelepon: string;
  notes: string;
}

interface FormState {
  trxId: string;
  tanggal: string;
  userId: string;
  tipe: "Debit" | "Kredit";
  statusPembayaran: "Lunas" | "Pending" | "Belum Lunas" | "DP";
  statusDokumen: "Draft" | "Diproses" | "Disetujui";
  sertakanTandaTangan: boolean;
  jumlah: string;
  kuantitas: string;
  diskon: string;
  items: Array<{
    tanggal: string;
    tipe: "Debit" | "Kredit";
    statusPembayaran: "Lunas" | "Pending" | "Belum Lunas" | "DP";
    jumlah: string;
    kuantitas: string;
    diskon: string;
    namaPembeli: string;
    noTelepon: string;
    notes: string;
  }>;
  namaPembeli: string;
  noTelepon: string;
  notes: string;
}

interface Profile {
  nama: string;
  email: string;
  tandaTangan?: string;
  fotoProfil?: string;
  role?: string;
}

export const formatDecimalInput = (value: string): string => {
  let clean = value.replace(/[^0-9.,]/g, "");
  
  if (clean.includes(",")) {
    const parts = clean.split(",");
    const intPart = parts[0].replace(/\./g, "");
    const decPart = parts.slice(1).join("").replace(/[.,]/g, "");
    
    const formattedInt = intPart ? parseInt(intPart, 10).toLocaleString("id-ID") : "0";
    return `${formattedInt},${decPart.slice(0, 4)}`;
  }
  
  if (clean.includes(".")) {
    const lastDotIdx = clean.lastIndexOf(".");
    const digitsAfterDot = clean.slice(lastDotIdx + 1);
    const digitsBeforeDot = clean.slice(0, lastDotIdx);
    const dotCount = clean.split(".").length - 1;
    
    const isDecimalDot = 
      lastDotIdx === clean.length - 1 || 
      (dotCount === 1 && (
        digitsAfterDot.length === 1 || 
        digitsAfterDot.length === 2 || 
        digitsBeforeDot.length > 3
      ));
      
    if (isDecimalDot) {
      const intPart = digitsBeforeDot.replace(/\./g, "");
      const decPart = digitsAfterDot.replace(/\./g, "");
      const formattedInt = intPart ? parseInt(intPart, 10).toLocaleString("id-ID") : "0";
      return `${formattedInt},${decPart.slice(0, 4)}`;
    } else {
      const intPart = clean.replace(/\./g, "");
      return intPart ? parseInt(intPart, 10).toLocaleString("id-ID") : "";
    }
  }
  
  const intPart = clean;
  return intPart ? parseInt(intPart, 10).toLocaleString("id-ID") : "";
};

export const parseDecimalInput = (formattedValue: string): number => {
  if (!formattedValue) return 0;
  const clean = formattedValue.replace(/\./g, "").replace(/,/g, ".");
  return parseFloat(clean) || 0;
};

const generateTrxId = () => `TRX-${Math.floor(100000 + Math.random() * 900000)}`;
const generateUserId = () => "USR-" + Math.random().toString(36).substring(2, 11).toUpperCase();

const INITIAL_FORM_STATE: FormState = {
  trxId: generateTrxId(),
  tanggal: new Date().toISOString().split("T")[0],
  userId: "", // Starts blank to allow manual entry by default
  tipe: "Debit",
  statusPembayaran: "Lunas",
  statusDokumen: "Draft",
  sertakanTandaTangan: false,
  jumlah: "",
  kuantitas: "1",
  diskon: "0",
  items: [],
  namaPembeli: "",
  noTelepon: "",
  notes: "",
};

interface UseUserDashboardProps {
  profile: Profile;
  setProfile: React.Dispatch<React.SetStateAction<Profile>>;
  token: string | null;
  isOffline: boolean;
  setIsOffline: React.Dispatch<React.SetStateAction<boolean>>;
  onLogout: () => void;
}

export function useUserDashboard({
  profile,
  setProfile,
  token,
  isOffline,
  setIsOffline,
  onLogout
}: UseUserDashboardProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const [selectedReceipt, setSelectedReceipt] = useState<Transaction | null>(null);
  const [selectedDocType, setSelectedDocType] = useState<"Invoice" | "Kwitansi">("Invoice");
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem("kroombox_data");
    return saved ? JSON.parse(saved) : [
      {
        id: "dummy-income",
        trxId: "TRX-1001",
        tanggal: new Date().toISOString().split("T")[0],
        userId: "USR-0001",
        tipe: "Debit",
        statusPembayaran: "Lunas",
        statusDokumen: "Disetujui",
        sertakanTandaTangan: true,
        jumlah: 1500000,
        kuantitas: 1,
        namaPembeli: "Dian Nugraha",
        noTelepon: "08122334455",
        notes: "Pembayaran Paket Premium (Lunas)"
      },
      {
        id: "dummy-1",
        trxId: "TRX-DUMMY",
        tanggal: new Date().toISOString().split("T")[0],
        userId: "USR-DUMMY",
        tipe: "Debit",
        statusPembayaran: "Pending",
        statusDokumen: "Draft",
        sertakanTandaTangan: false,
        jumlah: 250000,
        kuantitas: 1,
        namaPembeli: "Budi Dummy",
        noTelepon: "08123456789",
        notes: "Transaksi ini menunggu verifikasi (ACC)"
      }
    ];
  });

  const [form, setForm] = useState<FormState>(INITIAL_FORM_STATE);
  const [customers, setCustomers] = useState<any[]>(() => {
    const saved = localStorage.getItem("kroombox_admin_customers");
    return saved ? JSON.parse(saved) : [];
  });
  const [aiInsight, setAiInsight] = useState("Memuat analisis keuangan pintar...");
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTrxId, setEditingTrxId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Profile Edit
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [editProfileForm, setEditProfileForm] = useState({
    nama: profile.nama,
    email: profile.email,
    tandaTangan: profile.tandaTangan || ""
  });

  useEffect(() => {
    setEditProfileForm({
      nama: profile.nama,
      email: profile.email,
      tandaTangan: profile.tandaTangan || ""
    });
  }, [profile]);

  const API_BASE = "http://127.0.0.1:5000/api";

  const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
    const url = `${API_BASE}${endpoint}`;
    const headers = new Headers(options.headers || {});
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    try {
      const res = await fetch(url, { ...options, headers });
      setIsOffline(false);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error ${res.status}`);
      }
      return await res.json();
    } catch (err: any) {
      if (err instanceof TypeError || err.message?.includes("Failed to fetch") || err.message?.includes("NetworkError")) {
        console.warn("Backend server is offline, falling back to local session mode.");
        setIsOffline(true);
        throw new Error("offline");
      }
      throw err;
    }
  };

  const syncWithBackend = async () => {
    if (!token || token === "offline-token-session") return;
    try {
      const profileRes = await apiRequest("/profile");
      if (profileRes && profileRes.data) {
        // Preserve locally-stored tandaTangan & fotoProfil if backend doesn't have them
        const localProfile = JSON.parse(localStorage.getItem("kroombox_user_profile") || "{}");
        const mergedProfile = {
          ...profileRes.data,
          tandaTangan: profileRes.data.tandaTangan || localProfile.tandaTangan || "",
          fotoProfil: profileRes.data.fotoProfil || localProfile.fotoProfil || "",
        };
        setProfile(mergedProfile);
        localStorage.setItem("kroombox_user_profile", JSON.stringify(mergedProfile));
      }

      const transRes = await apiRequest("/transactions");
      if (transRes && transRes.data) {
        setTransactions(transRes.data);
        localStorage.setItem("kroombox_data", JSON.stringify(transRes.data));
      }
      const custRes = await apiRequest("/customers");
      if (custRes && custRes.data) {
        setCustomers(custRes.data);
        localStorage.setItem("kroombox_admin_customers", JSON.stringify(custRes.data));
      }
      const aiRes = await apiRequest("/settings/ai-insights");
      if (aiRes && aiRes.data) {
        setAiInsight(aiRes.data);
      }
      setIsOffline(false);
    } catch (err: any) {
      setAiInsight("Sesi offline. Silakan hubungkan server backend untuk mengaktifkan AI Asisten.");
      if (err.message === "offline") {
        setIsOffline(true);
        setNotification({
          message: "Koneksi backend gagal. Berjalan dalam Sesi Lokal.",
          type: "error"
        });
      } else {
        console.error("Backend sync failed:", err);
      }
    }
  };

  useEffect(() => {
    if (token && token !== "offline-token-session") {
      syncWithBackend();
    }
  }, [token]);

  useEffect(() => {
    localStorage.setItem("kroombox_data", JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: "fotoProfil" | "tandaTangan") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setNotification({ message: `Gagal: Ukuran file melebihi 2MB!`, type: "error" });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfile(prev => ({ ...prev, [field]: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const terbilang = (n: number): string => {
    const units = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
    if (n < 12) return units[n];
    if (n < 20) return terbilang(n % 10) + ' Belas';
    if (n < 100) return terbilang(Math.floor(n / 10)) + ' Puluh ' + terbilang(n % 10);
    if (n < 200) return 'Seratus ' + terbilang(n % 100);
    if (n < 1000) return terbilang(Math.floor(n / 100)) + ' Ratus ' + terbilang(n % 100);
    if (n < 2000) return 'Seribu ' + terbilang(n % 1000);
    if (n < 1000000) return terbilang(Math.floor(n / 1000)) + ' Ribu ' + terbilang(n % 1000);
    if (n < 1000000000) return terbilang(Math.floor(n / 1000000)) + ' Juta ' + terbilang(n % 1000000);
    return n.toString();
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormState, string>> = {};
    if (!form.tanggal) newErrors.tanggal = "Tanggal wajib diisi";
    // User ID is optional for manual entry (e.g. general expense/cash receipts)
    if (!form.jumlah || isNaN(Number(form.jumlah.replace(/\D/g, "")))) newErrors.jumlah = "Jumlah tidak valid";
    if (!form.namaPembeli) newErrors.namaPembeli = "Keterangan / Nama pembeli wajib diisi";
    if (!form.kuantitas || Number(form.kuantitas) <= 0) newErrors.kuantitas = "Kuantitas minimal 1";

    // Signature validation for Disetujui status
    if (form.statusDokumen === "Disetujui" && !profile.tandaTangan) {
      setNotification({
        message: "Silakan upload tanda tangan bendahara terlebih dahulu pada halaman Profil.",
        type: "error"
      });
      return false;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAmountChange = (value: string) => {
    const formatted = formatDecimalInput(value);
    setForm(prev => ({ ...prev, jumlah: formatted }));
  };

  const handleDiscountChange = (value: string) => {
    const formatted = formatDecimalInput(value);
    setForm(prev => ({ ...prev, diskon: formatted }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    const newTrx: Transaction = {
      id: crypto.randomUUID(),
      trxId: form.trxId,
      tanggal: form.tanggal,
      userId: form.userId,
      tipe: form.tipe,
      statusPembayaran: form.statusPembayaran,
      statusDokumen: form.statusDokumen,
      sertakanTandaTangan: form.sertakanTandaTangan,
      jumlah: parseDecimalInput(form.jumlah),
      kuantitas: Number(form.kuantitas),
      diskon: parseDecimalInput(form.diskon) || 0,
      items: form.items || [],
      namaPembeli: form.namaPembeli,
      noTelepon: form.noTelepon,
      notes: form.notes
    };

    try {
      let finalTrx = newTrx;
      if (token && token !== "offline-token-session") {
        const res = await apiRequest("/transactions", {
          method: "POST",
          body: JSON.stringify(newTrx)
        });
        if (res && res.data) {
          finalTrx = res.data;
        }
      }
      setTransactions(prev => [finalTrx, ...prev]);
      setNotification({ message: "Transaksi berhasil ditambahkan!", type: "success" });
      setForm({
        ...INITIAL_FORM_STATE,
        trxId: generateTrxId(),
        userId: "",
        tanggal: new Date().toISOString().split("T")[0]
      });
    } catch (err: any) {
      if (err.message === "offline") {
        setTransactions(prev => [newTrx, ...prev]);
        setNotification({ message: "Disimpan dalam sesi lokal (Offline).", type: "success" });
        setForm({
          ...INITIAL_FORM_STATE,
          trxId: generateTrxId(),
          userId: "",
          tanggal: new Date().toISOString().split("T")[0]
        });
      } else {
        setNotification({ message: err.message || "Gagal menyimpan transaksi.", type: "error" });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    const id = deletingId;

    try {
      if (token && token !== "offline-token-session") {
        await apiRequest(`/transactions/${id}`, { method: "DELETE" });
      }
      setTransactions(prev => prev.filter(t => t.id !== id));
      setNotification({ message: "Transaksi berhasil dihapus!", type: "success" });
    } catch (err: any) {
      if (err.message === "offline") {
        setTransactions(prev => prev.filter(t => t.id !== id));
        setNotification({ message: "Transaksi dihapus dari sesi lokal (Offline).", type: "success" });
      } else {
        setNotification({ message: err.message || "Gagal menghapus transaksi.", type: "error" });
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (trx: Transaction) => {
    setEditingTrxId(trx.id);
    setForm({
      trxId: trx.trxId,
      tanggal: trx.tanggal,
      userId: trx.userId,
      tipe: trx.tipe,
      statusPembayaran: trx.statusPembayaran,
      statusDokumen: trx.statusDokumen || 'Draft',
      sertakanTandaTangan: !!trx.sertakanTandaTangan,
      jumlah: trx.jumlah.toLocaleString("id-ID"),
      kuantitas: trx.kuantitas.toString(),
      diskon: (trx.diskon || 0).toLocaleString("id-ID"),
      items: trx.items || [],
      namaPembeli: trx.namaPembeli,
      noTelepon: trx.noTelepon,
      notes: trx.notes
    });
    setErrors({});
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !editingTrxId) return;

    const updatedTrx: Transaction = {
      id: editingTrxId,
      trxId: form.trxId,
      tanggal: form.tanggal,
      userId: form.userId,
      tipe: form.tipe,
      statusPembayaran: form.statusPembayaran,
      statusDokumen: form.statusDokumen,
      sertakanTandaTangan: form.sertakanTandaTangan,
      jumlah: parseDecimalInput(form.jumlah),
      kuantitas: Number(form.kuantitas),
      diskon: parseDecimalInput(form.diskon) || 0,
      items: form.items || [],
      namaPembeli: form.namaPembeli,
      noTelepon: form.noTelepon,
      notes: form.notes
    };

    try {
      let finalTrx = updatedTrx;
      if (token && token !== "offline-token-session") {
        const res = await apiRequest(`/transactions/${editingTrxId}`, {
          method: "PUT",
          body: JSON.stringify(updatedTrx)
        });
        if (res && res.data) {
          finalTrx = res.data;
        }
      }
      setTransactions(prev => prev.map(t => t.id === editingTrxId ? finalTrx : t));
      setNotification({ message: "Transaksi berhasil diperbarui!", type: "success" });
      setIsEditModalOpen(false);
      setEditingTrxId(null);
      setForm({
        ...INITIAL_FORM_STATE,
        trxId: generateTrxId(),
        userId: "",
        tanggal: new Date().toISOString().split("T")[0]
      });
    } catch (err: any) {
      if (err.message === "offline") {
        setTransactions(prev => prev.map(t => t.id === editingTrxId ? updatedTrx : t));
        setNotification({ message: "Transaksi diperbarui di sesi lokal (Offline).", type: "success" });
        setIsEditModalOpen(false);
        setEditingTrxId(null);
        setForm({
          ...INITIAL_FORM_STATE,
          trxId: generateTrxId(),
          userId: "",
          tanggal: new Date().toISOString().split("T")[0]
        });
      } else {
        setNotification({ message: err.message || "Gagal memperbarui transaksi.", type: "error" });
      }
    }
  };

  const handleApprove = async (id: string) => {
    try {
      if (token && token !== "offline-token-session") {
        await apiRequest(`/transactions/${id}/approve`, { method: "PATCH" });
      }
      setTransactions(prev => prev.map(t => {
        if (t.id === id) {
          return { ...t, statusPembayaran: "Lunas" };
        }
        return t;
      }));
      setNotification({ message: "Pembayaran telah disetujui (LUNAS)!", type: "success" });
    } catch (err: any) {
      if (err.message === "offline") {
        setTransactions(prev => prev.map(t => {
          if (t.id === id) {
            return { ...t, statusPembayaran: "Lunas" };
          }
          return t;
        }));
        setNotification({ message: "Verifikasi disetujui di sesi lokal (Offline).", type: "success" });
      } else {
        setNotification({ message: err.message || "Gagal menyetujui pembayaran.", type: "error" });
      }
    }
  };

  // Helper: parse local date string "YYYY-MM-DD" to Date object safely
  const parseLocalDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  const getTrxTotal = (t: Transaction) => {
    const base = t.items && t.items.length > 0 ? t.jumlah : t.jumlah * t.kuantitas;
    return Math.max(0, base - (t.diskon || 0));
  };

  // --- Statistics ---
  const [timeframe, setTimeframe] = useState<"Harian" | "Mingguan" | "Bulanan">("Mingguan");

  const dailyData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const name = d.toLocaleDateString("id-ID", { weekday: "short" });

    const debit = transactions
      .filter(t => t.tanggal === dateStr && t.tipe === "Debit")
      .reduce((sum, t) => sum + getTrxTotal(t), 0);
    const kredit = transactions
      .filter(t => t.tanggal === dateStr && t.tipe === "Kredit")
      .reduce((sum, t) => sum + getTrxTotal(t), 0);

    return {
      name,
      Debit: debit,
      Kredit: kredit,
      trend: debit - kredit
    };
  });

  const weeklyData = Array.from({ length: 4 }).map((_, i) => {
    const end = new Date();
    end.setDate(end.getDate() - (3 - i) * 7);
    const start = new Date();
    start.setDate(start.getDate() - (3 - i) * 7 - 6);
    
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const inRangeTrx = transactions.filter(t => {
      const tDate = parseLocalDate(t.tanggal);
      return tDate >= start && tDate <= end;
    });

    const debit = inRangeTrx
      .filter(t => t.tipe === "Debit")
      .reduce((sum, t) => sum + getTrxTotal(t), 0);
    const kredit = inRangeTrx
      .filter(t => t.tipe === "Kredit")
      .reduce((sum, t) => sum + getTrxTotal(t), 0);

    return {
      name: `W${i + 1}`,
      Debit: debit,
      Kredit: kredit,
      trend: debit - kredit
    };
  });

  const monthlyData = Array.from({ length: 5 }).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (4 - i));
    const year = d.getFullYear();
    const month = d.getMonth();
    const name = d.toLocaleDateString("id-ID", { month: "short" });

    const inRangeTrx = transactions.filter(t => {
      const tDate = parseLocalDate(t.tanggal);
      return tDate.getFullYear() === year && tDate.getMonth() === month;
    });

    const debit = inRangeTrx
      .filter(t => t.tipe === "Debit")
      .reduce((sum, t) => sum + getTrxTotal(t), 0);
    const kredit = inRangeTrx
      .filter(t => t.tipe === "Kredit")
      .reduce((sum, t) => sum + getTrxTotal(t), 0);

    return {
      name,
      Debit: debit,
      Kredit: kredit,
      trend: debit - kredit
    };
  });

  const activeData = timeframe === "Harian" ? dailyData : timeframe === "Mingguan" ? weeklyData : monthlyData;

  // --- Monthly comparison calculations for KPI Cards ---
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const prevMonthDate = new Date();
  prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
  const prevYear = prevMonthDate.getFullYear();
  const prevMonth = prevMonthDate.getMonth();

  const debitCurrentMonth = transactions
    .filter(t => {
      const tDate = parseLocalDate(t.tanggal);
      return tDate.getFullYear() === currentYear && tDate.getMonth() === currentMonth && t.tipe === "Debit";
    })
    .reduce((sum, t) => sum + getTrxTotal(t), 0);

  const debitPrevMonth = transactions
    .filter(t => {
      const tDate = parseLocalDate(t.tanggal);
      return tDate.getFullYear() === prevYear && tDate.getMonth() === prevMonth && t.tipe === "Debit";
    })
    .reduce((sum, t) => sum + getTrxTotal(t), 0);

  const kreditCurrentMonth = transactions
    .filter(t => {
      const tDate = parseLocalDate(t.tanggal);
      return tDate.getFullYear() === currentYear && tDate.getMonth() === currentMonth && t.tipe === "Kredit";
    })
    .reduce((sum, t) => sum + getTrxTotal(t), 0);

  const kreditPrevMonth = transactions
    .filter(t => {
      const tDate = parseLocalDate(t.tanggal);
      return tDate.getFullYear() === prevYear && tDate.getMonth() === prevMonth && t.tipe === "Kredit";
    })
    .reduce((sum, t) => sum + getTrxTotal(t), 0);

  const debitChangePct = debitPrevMonth === 0 
    ? (debitCurrentMonth > 0 ? 100 : 0) 
    : Math.round(((debitCurrentMonth - debitPrevMonth) / debitPrevMonth) * 100);

  const kreditChangePct = kreditPrevMonth === 0 
    ? (kreditCurrentMonth > 0 ? 100 : 0) 
    : Math.round(((kreditCurrentMonth - kreditPrevMonth) / kreditPrevMonth) * 100);

  const debitDiffAmount = debitCurrentMonth - debitPrevMonth;
  const kreditDiffAmount = kreditCurrentMonth - kreditPrevMonth;

  // --- Dynamic Distribution & Budget status ---
  const expensesList = transactions.filter(t => t.tipe === "Kredit");
  let totalKreditAmount = 0;
  let operasionalAmount = 0;
  let layananHostingAmount = 0;
  let lainLainAmount = 0;

  expensesList.forEach(t => {
    const amt = getTrxTotal(t);
    totalKreditAmount += amt;
    const desc = (t.namaPembeli + " " + (t.notes || "")).toLowerCase();
    
    // Check if Layanan & Hosting
    if (
      desc.includes("hosting") || 
      desc.includes("domain") || 
      desc.includes("server") || 
      desc.includes("cloud") || 
      desc.includes("api") || 
      desc.includes("email") || 
      desc.includes("layanan") || 
      desc.includes("subscription") || 
      desc.includes("sewa") || 
      desc.includes("vps") || 
      desc.includes("database")
    ) {
      layananHostingAmount += amt;
    } else if (
      desc.includes("operasional") || 
      desc.includes("listrik") || 
      desc.includes("air") || 
      desc.includes("gaji") || 
      desc.includes("kantor") || 
      desc.includes("atk") || 
      desc.includes("makan") || 
      desc.includes("transport") || 
      desc.includes("internet") || 
      desc.includes("wifi") || 
      desc.includes("kertas") ||
      desc.includes("biaya")
    ) {
      operasionalAmount += amt;
    } else {
      lainLainAmount += amt;
    }
  });

  const pctOperasional = totalKreditAmount === 0 ? 0 : Math.round((operasionalAmount / totalKreditAmount) * 100);
  const pctLayananHosting = totalKreditAmount === 0 ? 0 : Math.round((layananHostingAmount / totalKreditAmount) * 100);
  const pctLainLain = totalKreditAmount === 0 ? 0 : Math.max(0, 100 - pctOperasional - pctLayananHosting);

  // Spent in current month for budget Status
  const operasionalSpentThisMonth = transactions
    .filter(t => {
      if (t.tipe !== "Kredit") return false;
      const tDate = parseLocalDate(t.tanggal);
      if (tDate.getFullYear() !== currentYear || tDate.getMonth() !== currentMonth) return false;
      const desc = (t.namaPembeli + " " + (t.notes || "")).toLowerCase();
      return (
        desc.includes("operasional") || 
        desc.includes("listrik") || 
        desc.includes("air") || 
        desc.includes("gaji") || 
        desc.includes("kantor") || 
        desc.includes("atk") || 
        desc.includes("makan") || 
        desc.includes("transport") || 
        desc.includes("internet") || 
        desc.includes("wifi") || 
        desc.includes("kertas") ||
        desc.includes("biaya")
      ) && !(
        desc.includes("hosting") || 
        desc.includes("domain") || 
        desc.includes("server") || 
        desc.includes("cloud") || 
        desc.includes("api") || 
        desc.includes("email") || 
        desc.includes("layanan") || 
        desc.includes("subscription") || 
        desc.includes("sewa") || 
        desc.includes("vps") || 
        desc.includes("database")
      );
    })
    .reduce((sum, t) => sum + getTrxTotal(t), 0);

  const serverSpentThisMonth = transactions
    .filter(t => {
      if (t.tipe !== "Kredit") return false;
      const tDate = parseLocalDate(t.tanggal);
      if (tDate.getFullYear() !== currentYear || tDate.getMonth() !== currentMonth) return false;
      const desc = (t.namaPembeli + " " + (t.notes || "")).toLowerCase();
      return (
        desc.includes("hosting") || 
        desc.includes("domain") || 
        desc.includes("server") || 
        desc.includes("cloud") || 
        desc.includes("api") || 
        desc.includes("email") || 
        desc.includes("layanan") || 
        desc.includes("subscription") || 
        desc.includes("sewa") || 
        desc.includes("vps") || 
        desc.includes("database")
      );
    })
    .reduce((sum, t) => sum + getTrxTotal(t), 0);

  const limitOperasional = 20000000;
  const limitServer = 10000000;
  
  const pctOperasionalBudget = Math.min(100, Math.round((operasionalSpentThisMonth / limitOperasional) * 100));
  const pctServerBudget = Math.min(100, Math.round((serverSpentThisMonth / limitServer) * 100));

  const totalIncome = transactions
    .filter(t => t.tipe === "Debit")
    .reduce((acc, curr) => acc + getTrxTotal(curr), 0);

  const totalExpense = transactions
    .filter(t => t.tipe === "Kredit")
    .reduce((acc, curr) => acc + getTrxTotal(curr), 0);

  const netBalance = totalIncome - totalExpense;

  // Chart Data for trend
  const chartData = Array.from(
    transactions.reduce((acc, t) => {
      const date = new Date(t.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      if (!acc.has(date)) {
        acc.set(date, { name: date, Debit: 0, Kredit: 0 });
      }
      const data = acc.get(date)!;
      if (t.tipe === "Debit") data.Debit += getTrxTotal(t);
      else data.Kredit += getTrxTotal(t);
      return acc;
    }, new Map<string, { name: string; Debit: number; Kredit: number }>())
  ).map(([_, val]) => val).slice(-7);

  const exportToExcel = (type?: "pemasukan" | "pengeluaran" | "keseluruhan" | React.MouseEvent) => {
    let mode: "pemasukan" | "pengeluaran" | "keseluruhan" = "keseluruhan";

    if (type === "pemasukan" || type === "pengeluaran" || type === "keseluruhan") {
      mode = type;
    } else if (activeMenu === "Data Debit") {
      mode = "pemasukan";
    } else if (activeMenu === "Data Kredit") {
      mode = "pengeluaran";
    } else if (activeMenu === "Laporan") {
      mode = "keseluruhan";
    }

    let filteredList = [...transactions];
    if (mode === "pemasukan") {
      filteredList = filteredList.filter(t => t.tipe === "Debit");
    } else if (mode === "pengeluaran") {
      filteredList = filteredList.filter(t => t.tipe === "Kredit");
    }

    if (filteredList.length === 0) {
      setNotification({ message: "Tidak ada data untuk dieksport", type: "error" });
      return;
    }

    // Sort chronologically oldest first for financial running balance
    const sortedTrx = filteredList.sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());

    let runningBalance = 0;
    let sumDebit = 0;
    let sumCredit = 0;

    const dataToExport = sortedTrx.map((t, index) => {
      const debit = t.tipe === "Debit" ? getTrxTotal(t) : 0;
      const credit = t.tipe === "Kredit" ? getTrxTotal(t) : 0;
      sumDebit += debit;
      sumCredit += credit;
      runningBalance += (debit - credit);

      let detailDesc = t.namaPembeli + (t.notes ? ` - ${t.notes}` : '');
      if (t.items && t.items.length > 0) {
        const itemNames = t.items.map(i => `${i.namaPembeli || i.deskripsi || t.namaPembeli} (Qty: ${i.kuantitas || 1})`).join(", ");
        detailDesc += `\n[Rincian: ${itemNames}]`;
      }

      return {
        'No': index + 1,
        'Tanggal': t.tanggal,
        'ID Transaksi': t.trxId,
        'Keterangan / Deskripsi': detailDesc,
        'Kontak/WhatsApp': t.noTelepon || '-',
        'Debit (Masuk)': debit,
        'Kredit (Keluar)': credit,
        'Saldo Akhir (Running Balance)': runningBalance,
        'Status': t.statusPembayaran
      };
    });

    // Append summary row at the bottom
    dataToExport.push({
      'No': '' as any,
      'Tanggal': 'TOTAL' as any,
      'ID Transaksi': '' as any,
      'Keterangan / Deskripsi': 'Akumulasi Kas Perusahaan' as any,
      'Kontak/WhatsApp': '' as any,
      'Debit (Masuk)': sumDebit as any,
      'Kredit (Keluar)': sumCredit as any,
      'Saldo Akhir (Running Balance)': runningBalance as any,
      'Status': '' as any
    });

    const printDate = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    let sheetTitle = "";
    let fileName = "";
    let sheetName = "";

    if (mode === "pemasukan") {
      sheetTitle = "LAPORAN PEMASUKAN KAS (DEBIT) - KROOMBOX";
      fileName = `Laporan_Pemasukan_KroomBox_${new Date().toISOString().split('T')[0]}.xlsx`;
      sheetName = "Laporan Pemasukan";
    } else if (mode === "pengeluaran") {
      sheetTitle = "LAPORAN PENGELUARAN KAS (KREDIT) - KROOMBOX";
      fileName = `Laporan_Pengeluaran_KroomBox_${new Date().toISOString().split('T')[0]}.xlsx`;
      sheetName = "Laporan Pengeluaran";
    } else {
      sheetTitle = "LAPORAN KEUANGAN PERUSAHAAN (BUKU BESAR) - KROOMBOX";
      fileName = `Laporan_Keuangan_KroomBox_${new Date().toISOString().split('T')[0]}.xlsx`;
      sheetName = "Laporan Keuangan";
    }

    const titleAOA = [
      [sheetTitle],
      [`Tanggal Cetak: ${printDate}`],
      [], // empty row for spacing
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(titleAOA);
    XLSX.utils.sheet_add_json(worksheet, dataToExport, { origin: "A4" });

    // Set columns width for a beautiful premium design
    worksheet["!cols"] = [
      { wch: 6 },   // No
      { wch: 15 },  // Tanggal
      { wch: 15 },  // ID Transaksi
      { wch: 35 },  // Keterangan / Deskripsi
      { wch: 18 },  // Kontak/WhatsApp
      { wch: 18 },  // Debit (Masuk)
      { wch: 18 },  // Kredit (Keluar)
      { wch: 25 },  // Saldo Akhir (Running Balance)
      { wch: 15 }   // Status
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, fileName);
    setNotification({ message: `Laporan kas (${mode}) berhasil diekspor ke Excel!`, type: "success" });
  };

  // Report Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const filteredTransactions = transactions.filter(t => 
    t.trxId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.namaPembeli.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.userId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownloadDocumentPdf = async (id: string, trxId: string, docType: "Invoice" | "Kwitansi") => {
    if (isOffline || !id || String(id).includes("dummy") || String(id).length > 20) {
      setNotification({
        message: "Pengunduhan PDF tidak tersedia dalam Sesi Lokal / Offline.",
        type: "error"
      });
      return;
    }

    setDownloadingId(id);
    try {
      const endpoint = docType === "Invoice"
        ? `http://127.0.0.1:5000/api/invoices/transaction/${id}/pdf`
        : `http://127.0.0.1:5000/api/receipts/transaction/${id}/pdf`;

      const res = await fetch(endpoint, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setNotification({
          message: errData.message || "Gagal mengunduh PDF.",
          type: "error"
        });
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${docType}-${trxId.replace(/\//g, "-")}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setNotification({
        message: `${docType} PDF berhasil diunduh!`,
        type: "success"
      });
    } catch (err) {
      console.error(err);
      setNotification({
        message: "Terjadi kesalahan saat mengunduh PDF.",
        type: "error"
      });
    } finally {
      setDownloadingId(null);
    }
  };

  return {
    isSidebarOpen,
    setIsSidebarOpen,
    activeMenu,
    setActiveMenu,
    selectedReceipt,
    setSelectedReceipt,
    selectedDocType,
    setSelectedDocType,
    notification,
    setNotification,
    transactions,
    setTransactions,
    form,
    setForm,
    errors,
    isSubmitting,
    isEditModalOpen,
    setIsEditModalOpen,
    editingTrxId,
    isEditProfileModalOpen,
    setIsEditProfileModalOpen,
    editProfileForm,
    setEditProfileForm,
    handleFileUpload,
    terbilang,
    handleAmountChange,
    handleDiscountChange,
    handleSave,
    handleDelete,
    deletingId,
    setDeletingId,
    confirmDelete,
    handleEdit,
    handleUpdate,
    handleApprove,
    timeframe,
    setTimeframe,
    activeData,
    totalIncome,
    totalExpense,
    netBalance,
    chartData,
    exportToExcel,
    searchTerm,
    setSearchTerm,
    filteredTransactions,
    profile,
    setProfile,
    isOffline,
    onLogout,
    customers,
    aiInsight,
    debitChangePct,
    kreditChangePct,
    debitDiffAmount,
    kreditDiffAmount,
    pctOperasional,
    pctLayananHosting,
    pctLainLain,
    pctOperasionalBudget,
    pctServerBudget,
    downloadingId,
    handleDownloadDocumentPdf
  };
}
export type { Transaction, FormState };
