import React, { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";

interface Profile {
  nama: string;
  email: string;
  tandaTangan?: string;
  fotoProfil?: string;
  role?: string;
}

interface UseAdminDashboardProps {
  profile: Profile;
  token: string | null;
  onLogout: () => void;
  isOffline: boolean;
}

export function useAdminDashboard({ profile, token, onLogout, isOffline: initialIsOffline }: UseAdminDashboardProps) {
  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const [isOffline, setIsOffline] = useState(initialIsOffline);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" | "warning" } | null>(null);
  const [timeframe, setTimeframe] = useState<"Harian" | "Mingguan" | "Bulanan">("Mingguan");

  // --- STATS & MONITORING STATES ---
  const [serverMetrics, setServerMetrics] = useState({
    cpu: 24,
    ram: 42,
    disk: 58,
    uptime: "12d 4h 32m",
    dbStatus: "Connected",
    latency: "14ms"
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setServerMetrics(prev => ({
        ...prev,
        cpu: Math.min(100, Math.max(5, prev.cpu + Math.floor(Math.random() * 15) - 7)),
        ram: Math.min(100, Math.max(10, prev.ram + Math.floor(Math.random() * 5) - 2)),
        latency: `${Math.floor(Math.random() * 10) + 10}ms`
      }));
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // API Call Wrapper
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
        console.warn("Backend server offline. Using local storage data.");
        setIsOffline(true);
        throw new Error("offline");
      }
      throw err;
    }
  };

  // --- STATES & DATA ---
  const [treasurers, setTreasurers] = useState<any[]>(() => {
    const savedTreasurers = localStorage.getItem("kroombox_admin_treasurers");
    const parsed = savedTreasurers ? JSON.parse(savedTreasurers) : null;
    return parsed && parsed.length > 0 ? parsed : [
      { id: "TR-001", nama: "Fina Selia", email: "fina@kroombox.com", role: "Bendahara", status: "Active", startup: "Kroombox Corp", lastActive: "10 mins ago" },
      { id: "TR-002", nama: "Dian Nugraha", email: "dian.n@gmail.com", role: "Bendahara", status: "Active", startup: "Kroombox Premium", lastActive: "1 hour ago" },
      { id: "TR-003", nama: "Budi Santoso", email: "budi.st@domain.com", role: "Bendahara", status: "Inactive", startup: "Logistics Go", lastActive: "2 days ago" },
      { id: "TR-004", nama: "Ayu Lestari", email: "ayu.lestari@kroombox.com", role: "Bendahara", status: "Active", startup: "Telkom Studio", lastActive: "Just now" }
    ];
  });
  const [customers, setCustomers] = useState<any[]>(() => {
    const savedCustomers = localStorage.getItem("kroombox_admin_customers");
    return savedCustomers ? JSON.parse(savedCustomers) : [
      { id_pelanggan: "CUST-001", nama_pelanggan: "Budi Dummy", no_whatsapp: "08123456789", paket_hosting: "Pro Hosting", nominal_tagihan: 250000, tanggal_jatuh_tempo: "2026-06-15" }
    ];
  });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [apiClients, setApiClients] = useState<any[]>([]);
  const [appSettings, setAppSettings] = useState({
    appName: "KroomBox",
    logoUrl: "https://api.dicebear.com/7.x/identicon/svg?seed=KroomBox",
    maintenanceMode: false,
    themeAccent: "#3A7BD5",
    backupInterval: "Daily",
    geminiApiKey: "",
    geminiModel: "gemini-1.5-flash",
    geminiTemp: 0.2,
    whatsappToken: "whatsapp_mock_token_session_2026"
  });

  // Master Data Legacy States (kept for compatibility)
  const [categories, setCategories] = useState<any[]>([
    { id: "cat-1", name: "Operasional", type: "Pengeluaran", description: "Biaya harian kantor & utilitas" },
    { id: "cat-2", name: "Gaji & Staf", type: "Pengeluaran", description: "Gaji bulanan karyawan & bonus" },
    { id: "cat-3", name: "Pemasaran", type: "Pengeluaran", description: "Biaya iklan & promosi startup" },
    { id: "cat-4", name: "Paket Premium", type: "Pemasukan", description: "Hasil langganan pengguna premium" },
    { id: "cat-5", name: "Kemitraan", type: "Pemasukan", description: "Pendapatan dari sponsor & mitra" }
  ]);
  const [paymentMethods, setPaymentMethods] = useState<string[]>(["Bank Transfer", "E-Wallet", "Cash", "Credit Card"]);
  const [budgetPeriods, setBudgetPeriods] = useState<any[]>([
    { id: "p-1", name: "Juni 2026", status: "Active", limit: 250000000 },
    { id: "p-2", name: "Q2 2026", status: "Active", limit: 750000000 },
    { id: "p-3", name: "Mei 2026", status: "Closed", limit: 200000000 }
  ]);

  // Sync / Load data from backend API
  const syncData = async () => {
    // Always try the API first, even with offline token — server may have come back
    try {
      // 1. Fetch Users (all users from users table)
      const tRes = await apiRequest("/auth/treasurers");
      if (tRes && tRes.data) setTreasurers(tRes.data);

      // 2. Fetch Customers
      const cRes = await apiRequest("/customers");
      if (cRes && cRes.data) setCustomers(cRes.data);

      // 3. Fetch Transactions
      const trxRes = await apiRequest("/transactions");
      if (trxRes && trxRes.data) setTransactions(trxRes.data);

      // 4. Fetch Audit Logs
      const logRes = await apiRequest("/transactions/audit-logs");
      if (logRes && logRes.data) setAuditLogs(logRes.data);

      // 5. Fetch Settings
      const setRes = await apiRequest("/settings");
      if (setRes && setRes.data) {
        const dbSettings = setRes.data;
        setAppSettings({
          appName: dbSettings.app_name?.value || "KroomBox",
          logoUrl: "https://api.dicebear.com/7.x/identicon/svg?seed=KroomBox",
          maintenanceMode: dbSettings.maintenance_mode?.value === "true",
          themeAccent: "#3A7BD5",
          backupInterval: dbSettings.backup_interval?.value || "Daily",
          geminiApiKey: dbSettings.gemini_api_key?.value || "",
          geminiModel: dbSettings.gemini_api_key?.model || "gemini-1.5-flash",
          geminiTemp: dbSettings.gemini_api_key?.temperature !== undefined ? dbSettings.gemini_api_key.temperature : 0.2,
          whatsappToken: dbSettings.whatsapp_token?.value || ""
        });
      }

      // 6. Fetch API Clients
      const acRes = await apiRequest("/api-clients");
      if (acRes && acRes.data) setApiClients(acRes.data);

      setIsOffline(false);
    } catch (err: any) {
      setIsOffline(true);
      loadLocalData();
    }
  };

  // --- API CLIENTS CRUD ---
  const fetchApiClients = async () => {
    try {
      const res = await apiRequest("/api-clients");
      if (res && res.data) setApiClients(res.data);
    } catch (err) {
      console.error("Gagal fetch API clients:", err);
    }
  };

  const createApiClient = async (payload: { client_name: string; client_code: string; callback_url: string; description: string }) => {
    const res = await apiRequest("/api-clients", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    await fetchApiClients();
    return res.data; // { api_key, api_secret, callback_secret }
  };

  const updateApiClient = async (id: number, payload: { client_name?: string; callback_url?: string; description?: string; is_active?: number }) => {
    await apiRequest(`/api-clients/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    });
    await fetchApiClients();
  };

  const deactivateApiClient = async (id: number) => {
    await apiRequest(`/api-clients/${id}`, { method: "DELETE" });
    await fetchApiClients();
  };

  const rotateApiClientKeys = async (id: number) => {
    const res = await apiRequest(`/api-clients/${id}/rotate-keys`, { method: "POST" });
    await fetchApiClients();
    return res.data; // { api_key, api_secret }
  };

  const defaultTreasurers = [
    { id: "TR-001", nama: "Fina Selia", email: "fina@kroombox.com", status: "Active", role: "Bendahara", startup: "Kroombox Corp", lastActive: "10 mins ago" },
    { id: "TR-002", nama: "Dian Nugraha", email: "dian.n@gmail.com", status: "Active", role: "Bendahara", startup: "Kroombox Premium", lastActive: "1 hour ago" },
    { id: "TR-003", nama: "Budi Santoso", email: "budi.st@domain.com", status: "Inactive", role: "Bendahara", startup: "Logistics Go", lastActive: "2 days ago" },
    { id: "TR-004", nama: "Ayu Lestari", email: "ayu.lestari@kroombox.com", status: "Active", role: "Bendahara", startup: "Telkom Studio", lastActive: "Just now" }
  ];

  const loadLocalData = () => {
    // Load local storage fallbacks — check for empty arrays to avoid showing blank table
    const savedTreasurers = localStorage.getItem("kroombox_admin_treasurers");
    const parsedTreasurers = savedTreasurers ? JSON.parse(savedTreasurers) : null;
    setTreasurers(parsedTreasurers && parsedTreasurers.length > 0 ? parsedTreasurers : defaultTreasurers);

    const savedCustomers = localStorage.getItem("kroombox_admin_customers");
    const parsedCustomers = savedCustomers ? JSON.parse(savedCustomers) : null;
    setCustomers(parsedCustomers && parsedCustomers.length > 0 ? parsedCustomers : [
      { id_pelanggan: "CUST-001", nama_pelanggan: "Budi Dummy", no_whatsapp: "08123456789", paket_hosting: "Pro Hosting", nominal_tagihan: 250000, tanggal_jatuh_tempo: "2026-06-15" }
    ]);

    const savedTrx = localStorage.getItem("kroombox_data");
    setTransactions(savedTrx ? JSON.parse(savedTrx) : []);

    const savedSettings = localStorage.getItem("kroombox_admin_settings");
    if (savedSettings) setAppSettings(JSON.parse(savedSettings));

    setAuditLogs([
      { id: "log-1", time: "2026-06-01 02:35", user: "Admin", action: "Updated App Settings", ip: "192.168.1.1", severity: "Info" },
      { id: "log-2", time: "2026-06-01 02:12", user: "Fina Selia", action: "Approved Payment TRX-1001", ip: "114.122.34.8", severity: "Success" }
    ]);
  };

  useEffect(() => {
    syncData();
  }, [token]);

  // Save local data when offline states change — don't save empty arrays
  useEffect(() => {
    if (isOffline) {
      if (treasurers.length > 0) localStorage.setItem("kroombox_admin_treasurers", JSON.stringify(treasurers));
      if (customers.length > 0) localStorage.setItem("kroombox_admin_customers", JSON.stringify(customers));
      localStorage.setItem("kroombox_admin_settings", JSON.stringify(appSettings));
    }
  }, [treasurers, customers, appSettings, isOffline]);

  // --- NOTIFICATION TIMERS ---
  const triggerNotification = (message: string, type: "success" | "error" | "warning") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // --- USER MANAGEMENT LOGIC ---
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [userForm, setUserForm] = useState({ nama: "", email: "", startup: "Kroombox Corp", status: "Active" });

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.nama || !userForm.email) {
      triggerNotification("Nama dan Email wajib diisi!", "error");
      return;
    }

    if (isOffline) {
      // Local fallback
      if (editingUser) {
        setTreasurers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...userForm } : u));
        triggerNotification(`Staf ${userForm.nama} diperbarui (Lokal)!`, "success");
      } else {
        const newUser = {
          id: `TR-${Math.floor(100 + Math.random() * 900)}`,
          nama: userForm.nama,
          email: userForm.email,
          startup: userForm.startup || "Kroombox Corp",
          status: userForm.status,
          lastActive: "Never active"
        };
        setTreasurers(prev => [...prev, newUser]);
        triggerNotification(`Staf ${userForm.nama} ditambahkan (Lokal)!`, "success");
      }
      setShowAddUserModal(false);
      return;
    }

    try {
      if (editingUser) {
        // Update user
        const rawId = editingUser.rawId || editingUser.id.replace("TR-", "");
        await apiRequest(`/auth/treasurers/${rawId}`, {
          method: "PUT",
          body: JSON.stringify(userForm)
        });
        triggerNotification(`Biodata staf ${userForm.nama} berhasil disimpan!`, "success");
      } else {
        // Create user
        await apiRequest("/auth/treasurers", {
          method: "POST",
          body: JSON.stringify({ ...userForm, password: "bendahara123" })
        });
        triggerNotification(`Akun staf ${userForm.nama} berhasil ditambahkan!`, "success");
      }
      syncData();
      setShowAddUserModal(false);
    } catch (err: any) {
      triggerNotification(err.message || "Gagal menyimpan data staf.", "error");
    }
  };

  const handleToggleStatus = async (id: string) => {
    if (isOffline) {
      setTreasurers(prev => prev.map(u => {
        if (u.id === id) {
          const nextStatus = u.status === "Active" ? "Inactive" : "Active";
          triggerNotification(`Staf ${u.nama} status diubah (Lokal)!`, "warning");
          return { ...u, status: nextStatus };
        }
        return u;
      }));
      return;
    }

    try {
      const targetUser = treasurers.find(u => u.id === id);
      const rawId = targetUser?.rawId || id.replace("TR-", "");
      await apiRequest(`/auth/treasurers/${rawId}/status`, { method: "PATCH" });
      triggerNotification(`Status persetujuan staf berhasil diubah!`, "success");
      syncData();
    } catch (err: any) {
      triggerNotification(err.message || "Gagal mengubah status.", "error");
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus akun ${name}?`)) return;

    if (isOffline) {
      setTreasurers(prev => prev.filter(u => u.id !== id));
      triggerNotification(`Staf ${name} berhasil dihapus (Lokal)!`, "success");
      return;
    }

    try {
      const targetUser = treasurers.find(u => u.id === id);
      const rawId = targetUser?.rawId || id.replace("TR-", "");
      await apiRequest(`/auth/treasurers/${rawId}`, { method: "DELETE" });
      triggerNotification(`Staf ${name} berhasil dihapus!`, "success");
      syncData();
    } catch (err: any) {
      triggerNotification(err.message || "Gagal menghapus staf.", "error");
    }
  };

  // --- CUSTOMER CRUD LOGIC ---
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [customerForm, setCustomerForm] = useState({
    id_pelanggan: "",
    nama_pelanggan: "",
    no_whatsapp: "",
    paket_hosting: "Basic Hosting",
    nominal_tagihan: "",
    tanggal_jatuh_tempo: ""
  });

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isOffline) {
      if (editingCustomer) {
        setCustomers(prev => prev.map(c => c.id_pelanggan === editingCustomer.id_pelanggan ? { ...c, ...customerForm } : c));
        triggerNotification("Data pelanggan diperbarui (Lokal)!", "success");
      } else {
        setCustomers(prev => [...prev, customerForm]);
        triggerNotification("Data pelanggan ditambahkan (Lokal)!", "success");
      }
      setShowAddCustomerModal(false);
      return;
    }

    try {
      if (editingCustomer) {
        await apiRequest(`/customers/${editingCustomer.id_pelanggan}`, {
          method: "PUT",
          body: JSON.stringify(customerForm)
        });
        triggerNotification("Data pelanggan berhasil diperbarui!", "success");
      } else {
        await apiRequest("/customers", {
          method: "POST",
          body: JSON.stringify(customerForm)
        });
        triggerNotification("Data pelanggan berhasil ditambahkan!", "success");
      }
      syncData();
      setShowAddCustomerModal(false);
    } catch (err: any) {
      triggerNotification(err.message || "Gagal menyimpan data pelanggan.", "error");
    }
  };

  const handleDeleteCustomer = async (id: string, name: string) => {
    if (!confirm(`Hapus data pelanggan ${name}?`)) return;

    if (isOffline) {
      setCustomers(prev => prev.filter(c => c.id_pelanggan !== id));
      triggerNotification("Pelanggan dihapus (Lokal)!", "success");
      return;
    }

    try {
      await apiRequest(`/customers/${id}`, { method: "DELETE" });
      triggerNotification("Data pelanggan berhasil dihapus!", "success");
      syncData();
    } catch (err: any) {
      triggerNotification(err.message || "Gagal menghapus pelanggan.", "error");
    }
  };

  // --- GLOBAL CONFIG UPDATE ---
  const saveAppSettings = async (nextSettings: typeof appSettings) => {
    setAppSettings(nextSettings);
    if (isOffline) return;

    try {
      await apiRequest("/settings", {
        method: "POST",
        body: JSON.stringify({
          settings: [
            { key: "app_name", value: nextSettings.appName },
            { key: "maintenance_mode", value: nextSettings.maintenanceMode ? "true" : "false" },
            { key: "backup_interval", value: nextSettings.backupInterval },
            { key: "gemini_api_key", value: nextSettings.geminiApiKey, model: nextSettings.geminiModel, temperature: nextSettings.geminiTemp },
            { key: "whatsapp_token", value: nextSettings.whatsappToken }
          ]
        })
      });
      triggerNotification("Pengaturan sistem & API berhasil diperbarui!", "success");
    } catch (err) {
      console.error("Gagal menyimpan ke database:", err);
      triggerNotification("Gagal menyimpan pengaturan ke database cloud.", "error");
    }
  };

  // --- GLOBAL REPORTS FILTER STATES ---
  const [filterDate, setFilterDate] = useState("");
  const [filterUser, setFilterUser] = useState("");
  const [filterType, setFilterType] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTransactions = transactions.filter(t => {
    const matchesDate = filterDate ? t.tanggal === filterDate : true;
    const matchesUser = filterUser ? t.namaPembeli.toLowerCase().includes(filterUser.toLowerCase()) || t.userId.toLowerCase().includes(filterUser.toLowerCase()) : true;
    const matchesType = filterType ? t.tipe === filterType : true;
    const matchesSearch = searchQuery
      ? t.trxId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.namaPembeli.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.notes.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesDate && matchesUser && matchesType && matchesSearch;
  });

  const handleExportExcel = () => {
    if (filteredTransactions.length === 0) {
      triggerNotification("Tidak ada data untuk diekspor", "error");
      return;
    }
    const dataToExport = filteredTransactions.map(t => ({
      "ID Transaksi": t.trxId,
      "Tanggal": t.tanggal,
      "User ID": t.userId,
      "Tipe": t.tipe,
      "Status": t.statusPembayaran,
      "Nama Pelanggan": t.namaPembeli,
      "Jumlah Satuan": t.jumlah,
      "Kuantitas": t.kuantitas,
      "Total": t.jumlah * t.kuantitas,
      "Notes": t.notes
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Konsolidasi");
    XLSX.writeFile(workbook, `Laporan_Admin_KroomBox_${new Date().toISOString().split("T")[0]}.xlsx`);
    triggerNotification("Laporan berhasil diekspor ke Excel!", "success");
  };

  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      triggerNotification("Tidak ada data untuk diekspor", "error");
      return;
    }
    const headers = ["ID Transaksi,Tanggal,User ID,Tipe,Status,Nama Pelanggan,Total,Catatan"];
    const rows = filteredTransactions.map(t => 
      `"${t.trxId}","${t.tanggal}","${t.userId}","${t.tipe}","${t.statusPembayaran}","${t.namaPembeli}",${t.jumlah * t.kuantitas},"${t.notes}"`
    );
    const csvContent = "data:text/csv;charset=utf-8," + headers.concat(rows).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Admin_KroomBox_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerNotification("Laporan berhasil diekspor ke CSV!", "success");
  };

  // --- SYSTEM BACKUP & RESTORE ---
  const handleCreateBackup = () => {
    const backupData = {
      appSettings,
      treasurers,
      transactions,
      customers,
      categories,
      budgetPeriods,
      backupTime: new Date().toISOString()
    };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(backupData, null, 2)
    )}`;
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", jsonString);
    downloadAnchor.setAttribute("download", `KroomBox_Backup_${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);

    triggerNotification("Backup database berhasil dibuat & diunduh!", "success");
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const restored = JSON.parse(event.target?.result as string);
        if (restored.treasurers && restored.transactions) {
          if (restored.appSettings) setAppSettings(restored.appSettings);
          if (restored.treasurers) setTreasurers(restored.treasurers);
          if (restored.transactions) {
            setTransactions(restored.transactions);
            localStorage.setItem("kroombox_data", JSON.stringify(restored.transactions));
          }
          if (restored.customers) setCustomers(restored.customers);

          triggerNotification("Database berhasil dipulihkan (Restore Sukses)!", "success");
          if (!isOffline) syncData();
        } else {
          triggerNotification("Format file backup tidak valid!", "error");
        }
      } catch (err) {
        triggerNotification("Gagal membaca file backup!", "error");
      }
    };
    reader.readAsText(file);
  };

  // Helper: parse local date string "YYYY-MM-DD" to Date object safely
  const parseLocalDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  // --- STATS COMPUTATIONS ---
  const totalTrxVolume = transactions.reduce((acc, curr) => acc + (curr.jumlah * curr.kuantitas), 0);
  const incomeVolume = transactions.filter(t => t.tipe === "Debit").reduce((acc, curr) => acc + (curr.jumlah * curr.kuantitas), 0);
  const expenseVolume = transactions.filter(t => t.tipe === "Kredit").reduce((acc, curr) => acc + (curr.jumlah * curr.kuantitas), 0);

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
      .reduce((sum, t) => sum + t.jumlah * t.kuantitas, 0);
    const kredit = transactions
      .filter(t => t.tanggal === dateStr && t.tipe === "Kredit")
      .reduce((sum, t) => sum + t.jumlah * t.kuantitas, 0);

    return {
      name,
      Pemasukan: debit,
      Pengeluaran: kredit,
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
      .reduce((sum, t) => sum + t.jumlah * t.kuantitas, 0);
    const kredit = inRangeTrx
      .filter(t => t.tipe === "Kredit")
      .reduce((sum, t) => sum + t.jumlah * t.kuantitas, 0);

    return {
      name: `W${i + 1}`,
      Pemasukan: debit,
      Pengeluaran: kredit,
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
      .reduce((sum, t) => sum + t.jumlah * t.kuantitas, 0);
    const kredit = inRangeTrx
      .filter(t => t.tipe === "Kredit")
      .reduce((sum, t) => sum + t.jumlah * t.kuantitas, 0);

    return {
      name,
      Pemasukan: debit,
      Pengeluaran: kredit,
      trend: debit - kredit
    };
  });

  const chartData = timeframe === "Harian" ? dailyData : timeframe === "Mingguan" ? weeklyData : monthlyData;

  return {
    activeMenu,
    setActiveMenu,
    notification,
    triggerNotification,
    serverMetrics,
    treasurers,
    categories,
    setCategories,
    paymentMethods,
    setPaymentMethods,
    budgetPeriods,
    setBudgetPeriods,
    auditLogs,
    setAuditLogs,
    appSettings,
    setAppSettings: saveAppSettings,
    transactions,
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
    incomeVolume,
    expenseVolume,
    chartData,
    timeframe,
    setTimeframe,
    profile,
    onLogout,
    isOffline,
    
    // Customer specific returns
    customers,
    showAddCustomerModal,
    setShowAddCustomerModal,
    editingCustomer,
    setEditingCustomer,
    customerForm,
    setCustomerForm,
    handleSaveCustomer,
    handleDeleteCustomer,

    // API Clients returns
    apiClients,
    fetchApiClients,
    createApiClient,
    updateApiClient,
    deactivateApiClient,
    rotateApiClientKeys
  };
}
