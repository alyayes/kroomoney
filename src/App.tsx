/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  Wallet,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  BarChart3,
  Coins,
  TrendingUp as TrendingIcon,
  ShieldCheck,
  Zap,
  Globe,
  Smartphone,
  Landmark,
  PieChart,
  Sun,
  Moon,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserDashboard from "./pages/user/UserDashboard";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";

export default function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("kroombox_user_token"));
  const [isOffline, setIsOffline] = useState(false);
  const [view, setView] = useState<"landing" | "login" | "register" | "forgot-password" | "authenticated">(() => {
    const savedToken = localStorage.getItem("kroombox_user_token");
    return savedToken ? "authenticated" : "landing";
  });

  // Track window dimensions for background animations
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });
  useEffect(() => {
    if (typeof window !== "undefined") {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
      const handleResize = () => {
        setDimensions({ width: window.innerWidth, height: window.innerHeight });
      };
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  // Dark mode state and toggle
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("kroombox_theme") === "dark";
  });

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const next = !prev;
      localStorage.setItem("kroombox_theme", next ? "dark" : "light");
      return next;
    });
  };
  
  // Forgot Password States
  const [resetEmail, setResetEmail] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetStep, setResetStep] = useState<1 | 2>(1);
  
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [hasSubmittedRegister, setHasSubmittedRegister] = useState(false);

  // Navigate between views with state cleanup
  const navigateTo = (target: "landing" | "login" | "register" | "forgot-password" | "authenticated") => {
    setIsSubmitting(false);
    setShowPassword(false);
    if (target !== "forgot-password") {
      setResetEmail("");
      setResetOtp("");
      setNewPassword("");
      setResetStep(1);
    }
    setView(target);
  };

  // Profile state
  const [profile, setProfile] = useState(() => {
    const savedProfile = localStorage.getItem("kroombox_user_profile");
    if (savedProfile) {
      const parsed = JSON.parse(savedProfile);
      if (!parsed.role) {
        parsed.role = parsed.email?.toLowerCase() === "admin@kroomoney.com" ? "Admin" : "Treasurer";
      }
      return parsed;
    }
    return {
      nama: "",
      email: "",
      tandaTangan: "",
      fotoProfil: "",
      role: "Treasurer"
    };
  });

  const [registerForm, setRegisterForm] = useState({
    nama: "",
    email: "",
    password: ""
  });

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: ""
  });

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

  // Load profile from local storage on mount
  useEffect(() => {
    const savedProfile = localStorage.getItem("kroombox_user_profile");
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("kroombox_user_profile", JSON.stringify(profile));
  }, [profile]);

  // Handle Notifications
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  async function handleRegisterSubmit(e: React.FormEvent) {
    e.preventDefault();
    setHasSubmittedRegister(true);

    if (!registerForm.nama || !registerForm.email || !registerForm.password) {
      setNotification({ message: "Silakan isi semua kolom form pendaftaran!", type: "error" });
      return;
    }

    if (registerForm.password.length < 8) {
      setNotification({ message: "Password minimal harus 8 karakter!", type: "error" });
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify(registerForm)
      });

      if (res.data) {
        setNotification({ message: "Pendaftaran berhasil! Silakan masuk dengan akun Anda.", type: "success" });
        setView("login");
      }
    } catch (err: any) {
      if (err.message === "offline") {
        const detectedRole = registerForm.email.toLowerCase() === "admin@kroomoney.com" ? "Admin" : "Treasurer";
        const fallbackProfile = {
          nama: registerForm.nama,
          email: registerForm.email,
          tandaTangan: "",
          role: detectedRole
        };
        localStorage.setItem("kroombox_user_profile", JSON.stringify(fallbackProfile));
        setIsOffline(true);
        setNotification({ message: "Pendaftaran selesai secara offline! Silakan login untuk masuk.", type: "success" });
        setView("login");
      } else {
        setNotification({ message: err.message || "Gagal mendaftar.", type: "error" });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!loginForm.email || !loginForm.password) {
      setNotification({ message: "Silakan isi email dan password Anda!", type: "error" });
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify(loginForm)
      });

      if (res.data) {
        const { token: userToken, profile: userProfile } = res.data;
        setToken(userToken);
        localStorage.setItem("kroombox_user_token", userToken);
        const updatedProfile = {
          ...userProfile,
          role: userProfile.role || (userProfile.email.toLowerCase() === "admin@kroomoney.com" ? "Admin" : "Treasurer")
        };
        setProfile(updatedProfile);
        localStorage.setItem("kroombox_user_profile", JSON.stringify(updatedProfile));

        setNotification({ message: "Berhasil masuk! Selamat datang kembali.", type: "success" });
        setView("authenticated");
      }
    } catch (err: any) {
      if (err.message === "offline") {
        const savedProfile = localStorage.getItem("kroombox_user_profile");
        if (savedProfile) {
          const parsedProfile = JSON.parse(savedProfile);
          if (parsedProfile.email.toLowerCase() === loginForm.email.toLowerCase()) {
            if (!parsedProfile.role) {
              parsedProfile.role = parsedProfile.email.toLowerCase() === "admin@kroomoney.com" ? "Admin" : "Treasurer";
            }
            setToken("offline-token-session");
            localStorage.setItem("kroombox_user_token", "offline-token-session");
            setIsOffline(true);
            setNotification({ message: `Login berhasil (Sesi Lokal Offline: ${parsedProfile.role}).`, type: "success" });
            setProfile(parsedProfile);
            setView("authenticated");
            return;
          }
        }

        // Check against permitted offline test/registered accounts
        const allowedOfflineEmails = ["admin@kroomoney.com", "bendahara@kroomoney.com", "budi.st@domain.com"];
        const savedTreasurersStr = localStorage.getItem("kroombox_admin_treasurers");
        if (savedTreasurersStr) {
          try {
            const savedTreasurers = JSON.parse(savedTreasurersStr);
            if (Array.isArray(savedTreasurers)) {
              savedTreasurers.forEach((t: any) => {
                if (t.email) allowedOfflineEmails.push(t.email.toLowerCase());
              });
            }
          } catch (e) {
            console.error(e);
          }
        }

        if (allowedOfflineEmails.includes(loginForm.email.toLowerCase())) {
          const detectedRole = loginForm.email.toLowerCase() === "admin@kroomoney.com" ? "Admin" : "Treasurer";
          const fallbackProfile = {
            nama: detectedRole === "Admin" ? "Admin Kroombox" : "Bendahara Kroombox",
            email: loginForm.email,
            tandaTangan: "",
            role: detectedRole
          };
          setProfile(fallbackProfile);
          localStorage.setItem("kroombox_user_profile", JSON.stringify(fallbackProfile));
          setToken("offline-token-session");
          localStorage.setItem("kroombox_user_token", "offline-token-session");
          setIsOffline(true);
          setNotification({ message: `Login berhasil (Sesi Lokal Offline Baru: ${detectedRole}).`, type: "success" });
          setView("authenticated");
        } else {
          setNotification({ message: "Gagal masuk. Periksa email/password Anda.", type: "error" });
        }
      } else {
        setNotification({ message: err.message || "Gagal masuk. Periksa email/password Anda.", type: "error" });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleLogout() {
    setToken(null);
    setProfile({
      nama: "",
      email: "",
      tandaTangan: "",
      fotoProfil: "",
      role: "Treasurer"
    });
    localStorage.removeItem("kroombox_user_token");
    localStorage.removeItem("kroombox_user_profile");
    setView("landing");
  }

  if (view === "landing") {
    return (
      <div className={`min-h-screen font-jakarta transition-colors duration-300 flex flex-col overflow-x-hidden relative ${
        isDarkMode ? "bg-slate-950 text-slate-100" : "bg-white text-slate-900"
      }`}>
        
        {/* Subtle Background Elements with Blueprint Grid and Blue Holograms */}
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          {/* Radial blur gradients */}
          <div className={`absolute top-[-20%] left-[-10%] w-[80%] h-[80%] rounded-full blur-[160px] animate-pulse transition-colors duration-500 ${
            isDarkMode ? "bg-blue-950/20" : "bg-blue-100/40"
          }`} />
          <div className={`absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] rounded-full blur-[160px] transition-colors duration-500 ${
            isDarkMode ? "bg-indigo-950/15" : "bg-indigo-100/30"
          }`} />

          {/* Blueprint Technical Grid Pattern */}
          <div className={`absolute inset-0 transition-opacity duration-500 ${
            isDarkMode ? "opacity-[0.03]" : "opacity-[0.05]"
          }`} style={{
            backgroundImage: 'linear-gradient(to right, #2563eb 1px, transparent 1px), linear-gradient(to bottom, #2563eb 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }} />

          {/* Flying Money Emojis Backdrop (Futuristic Glowing Hologram Blue) */}
          {[...Array(25)].map((_, i) => {
            const emojis = ["💸", "💰", "💵", "🪙", "💳", "💲"];
            const randomEmoji = emojis[i % emojis.length];
            
            // Distribute start positions horizontally across the screen
            const startX = (i * (dimensions.width / 25)) + (Math.random() - 0.5) * (dimensions.width / 15);
            const startY = dimensions.height + 150 + (Math.random() * 400);
            const duration = 15 + (i % 6) * 3 + Math.random() * 2; // 15s to 35s for smoother floating
            const delay = (i % 8) * 1.5;
            const scale = 0.5 + (i % 4) * 0.2 + Math.random() * 0.1; // range ~0.5 to ~1.2
            
            return (
              <motion.div
                key={"floating-money-" + i}
                initial={{
                  x: startX,
                  y: startY,
                  opacity: 0,
                  rotate: (i * 37) % 360,
                  scale: scale
                }}
                animate={{
                  y: -150,
                  x: startX + (i % 2 === 0 ? 80 : -80) + Math.sin(i) * 40,
                  opacity: [0, 0.35, 0.35, 0], // subtle opacity for non-distracting blue hologram look
                  rotate: (i * 37) % 360 + 360 * (i % 2 === 0 ? 1 : -1)
                }}
                transition={{
                  duration: duration,
                  repeat: Infinity,
                  delay: delay,
                  ease: "linear"
                }}
                className="absolute text-4xl flex items-center justify-center select-none pointer-events-none"
                style={{
                  filter: isDarkMode
                    ? "grayscale(1) sepia(1) hue-rotate(185deg) saturate(6) brightness(1.2) drop-shadow(0 0 10px rgba(59, 130, 246, 0.8))"
                    : "grayscale(1) sepia(1) hue-rotate(195deg) saturate(4) brightness(0.95) drop-shadow(0 0 6px rgba(37, 99, 235, 0.5))"
                }}
              >
                <span>
                  {randomEmoji}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* Header Navbar */}
        <nav className={`relative z-50 flex items-center justify-between px-6 md:px-16 py-5 w-full backdrop-blur-md sticky top-0 border-b transition-colors duration-300 ${
          isDarkMode ? "bg-slate-950/80 border-slate-800/80" : "bg-white/80 border-slate-100/50"
        }`}>
          {/* Left: Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigateTo("landing")}>
            <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center p-1.5 border border-blue-500/20">
              <img src="/logo.png" alt="Kroomoney Logo" className="w-full h-full object-contain drop-shadow-sm mix-blend-multiply" />
            </div>
            <span className={`text-2.5xl font-black tracking-tighter leading-none ${isDarkMode ? "text-white" : "text-slate-900"}`}>
              KROOMONEY
            </span>
          </div>

          {/* Middle: Navigation Links (Symmetrical / Professional) */}
          <div className="hidden lg:flex items-center gap-8">
            <a href="#fitur" className={`text-sm font-semibold transition-colors ${isDarkMode ? "text-slate-300 hover:text-blue-400" : "text-slate-600 hover:text-blue-600"}`}>
              Fitur Keamanan
            </a>
            <a href="#keamanan" className={`text-sm font-semibold transition-colors ${isDarkMode ? "text-slate-300 hover:text-blue-400" : "text-slate-600 hover:text-blue-600"}`}>
              Keamanan Data
            </a>
            <a href="#layanan" className={`text-sm font-semibold transition-colors ${isDarkMode ? "text-slate-300 hover:text-blue-400" : "text-slate-600 hover:text-blue-600"}`}>
              Layanan Kami
            </a>
          </div>

          {/* Right: Theme Toggle & Authentication */}
          <div className="flex items-center gap-4">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleDarkMode}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                isDarkMode 
                  ? "bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800" 
                  : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
              aria-label="Toggle Theme"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <button
              onClick={() => navigateTo("login")}
              className={`text-sm font-bold transition-colors cursor-pointer border-none bg-transparent ${
                isDarkMode ? "text-slate-300 hover:text-blue-400" : "text-slate-600 hover:text-blue-600"
              }`}
            >
              Masuk
            </button>
            <button
              onClick={() => navigateTo("register")}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 hover:bg-blue-700 hover:-translate-y-0.5 transition-all active:scale-95 cursor-pointer border-none"
            >
              Coba Gratis
            </button>
          </div>
        </nav>

        {/* Hero Section */}
        <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 max-w-7xl mx-auto w-full pt-20 pb-32 text-center min-h-[90vh]">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-6 z-10 max-w-4xl"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className={`inline-flex items-center px-4 py-2 rounded-full text-xs font-bold tracking-widest uppercase mb-4 border transition-colors duration-300 ${
                isDarkMode 
                  ? "bg-blue-950/30 border-blue-900/50 text-blue-400" 
                  : "bg-blue-50 border-blue-100 text-blue-700"
              }`}
            >
              KROOMBOX FINANCIAL DASHBOARD
            </motion.div>

            <h1 className={`text-6xl md:text-8xl font-black tracking-[-0.04em] leading-[0.95] transition-colors duration-300 ${
              isDarkMode ? "text-white" : "text-slate-900"
            }`}>
              KELOLA SEMUA <br />
              <span className="text-blue-600 block">TRANSAKSI</span>
              <span className="text-blue-600 block">KEUANGAN</span>
            </h1>

            <p className={`text-base md:text-lg font-medium max-w-2xl mx-auto pt-6 leading-relaxed transition-colors duration-300 ${
              isDarkMode ? "text-slate-400" : "text-slate-500"
            }`}>
              Panel administrasi terpusat untuk memantau, menganalisis, dan mengelola seluruh aktivitas keuangan startup Anda secara real-time.
            </p>

            <div className="pt-10 flex items-center justify-center">
              <button
                onClick={() => navigateTo("login")}
                className="group flex items-center justify-center gap-3 bg-blue-600 text-white px-10 py-4.5 rounded-full font-black text-sm shadow-xl shadow-blue-500/20 hover:bg-blue-700 hover:-translate-y-1 transition-all active:scale-95 cursor-pointer border-none"
              >
                <span>MASUK SEKARANG</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
              </button>
            </div>
            

          </motion.div>
        </main>

        {/* Features Section */}
        <section id="fitur" className={`relative z-10 py-32 px-6 border-y transition-colors duration-300 ${
          isDarkMode ? "bg-slate-900/50 border-slate-800/80" : "bg-slate-50 border-slate-200/60"
        }`}>
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <h2 className={`text-3xl md:text-4xl font-black tracking-tight mb-4 transition-colors duration-300 ${
                isDarkMode ? "text-white" : "text-slate-900"
              }`}>
                Solusi Keuangan Komprehensif
              </h2>
              <p className={`font-medium transition-colors duration-300 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                Infrastruktur finansial modern yang dirancang untuk mendukung skalabilitas bisnis Anda.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: PieChart,
                  title: "Visualisasi Arus Kas",
                  desc: "Pantau arus kas masuk dan keluar secara real-time melalui dasbor interaktif dengan analisis laporan keuangan otomatis.",
                  color: "text-blue-500",
                  bg: isDarkMode ? "bg-blue-950/50 border border-blue-900/30" : "bg-blue-50 border border-blue-100/50"
                },
                {
                  icon: Smartphone,
                  title: "Penerbitan Invoice Elektronik",
                  desc: "Hasilkan invoice digital secara instan dan integrasikan pengingat pembayaran sistematis guna mempercepat penagihan.",
                  color: "text-emerald-500",
                  bg: isDarkMode ? "bg-emerald-950/50 border border-emerald-900/30" : "bg-emerald-50 border border-emerald-100/50"
                },
                {
                  icon: ShieldCheck,
                  title: "Proteksi Keamanan Standar Bank",
                  desc: "Melindungi data transaksi sensitif Anda menggunakan enkripsi end-to-end berstandar industri dan log audit aktivitas sistem.",
                  color: "text-indigo-500",
                  bg: isDarkMode ? "bg-indigo-950/50 border border-indigo-900/30" : "bg-indigo-50 border border-indigo-100/50"
                }
              ].map((feature, idx) => (
                <motion.div
                  key={idx}
                  id={idx === 2 ? "keamanan" : undefined}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ delay: idx * 0.2 }}
                  whileHover={{ y: -10 }}
                  className={`p-8 rounded-3xl border transition-all duration-300 group shadow-xl ${
                    isDarkMode 
                      ? "bg-slate-900 border-slate-800 text-white hover:border-blue-500/50 shadow-slate-950/20" 
                      : "bg-white border-slate-100 text-slate-900 hover:border-blue-500/20 shadow-slate-200/40"
                  }`}
                >
                  <div className={`w-14 h-14 rounded-2xl ${feature.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className={`w-7 h-7 ${feature.color}`} />
                  </div>
                  <h3 className={`text-xl font-bold mb-3 transition-colors duration-300 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                    {feature.title}
                  </h3>
                  <p className={`leading-relaxed font-medium text-sm transition-colors duration-300 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                    {feature.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Keamanan Data Section */}
        <section id="keamanan" className={`relative z-10 py-32 px-6 transition-colors duration-300 ${
          isDarkMode ? "bg-slate-950" : "bg-slate-50"
        }`}>
          <div className="max-w-4xl mx-auto text-center">
            <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-8 shadow-2xl ${
              isDarkMode ? "bg-blue-900/50 shadow-blue-900/20" : "bg-blue-100 shadow-blue-200/50"
            }`}>
              <ShieldCheck className={`w-10 h-10 ${isDarkMode ? "text-blue-400" : "text-blue-600"}`} />
            </div>
            <h2 className={`text-3xl md:text-5xl font-black tracking-tight mb-6 transition-colors duration-300 ${
              isDarkMode ? "text-white" : "text-slate-900"
            }`}>
              Proteksi Keamanan Berlapis
            </h2>
            <p className={`text-lg md:text-xl font-medium leading-relaxed transition-colors duration-300 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
              Melindungi setiap data transaksi sensitif operasional Kroombox dengan enkripsi <strong>end-to-end</strong> berstandar industri, kontrol akses yang ketat, dan log audit aktivitas sistem menyeluruh.
            </p>
          </div>
        </section>

        {/* Layanan Kami Section */}
        <section id="layanan" className={`relative z-10 py-32 px-6 border-y transition-colors duration-300 ${
          isDarkMode ? "bg-slate-900/30 border-slate-800/80" : "bg-white border-slate-200/60"
        }`}>
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className={`text-3xl md:text-5xl font-black tracking-tight mb-4 transition-colors duration-300 ${
                isDarkMode ? "text-white" : "text-slate-900"
              }`}>
                Layanan Keuangan Terintegrasi
              </h2>
              <p className={`text-lg font-medium max-w-2xl mx-auto transition-colors duration-300 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                Fokus pada operasional dan pertumbuhan Kroombox, biarkan sistem cerdas kami yang menangani kompleksitas pencatatan finansial internal.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                {[
                  {
                    title: "Pencatatan Finansial Otomatis",
                    desc: "Catat setiap transaksi dengan mudah. Sistem akan mengkalkulasi saldo, laba, dan rugi secara real-time tanpa memerlukan formula manual.",
                    icon: Wallet,
                    color: "text-blue-500",
                    bg: isDarkMode ? "bg-blue-950/50" : "bg-blue-50"
                  },
                  {
                    title: "Manajemen Tagihan Internal",
                    desc: "Buat dan pantau tagihan operasional secara terpusat, memastikan seluruh arus kas divisi tercatat dengan rapi.",
                    icon: FileText,
                    color: "text-emerald-500",
                    bg: isDarkMode ? "bg-emerald-950/50" : "bg-emerald-50"
                  },
                  {
                    title: "Analitik Data Komprehensif",
                    desc: "Dapatkan wawasan mendalam melalui dasbor visual interaktif untuk mendukung keputusan strategis dalam ekosistem Kroombox.",
                    icon: TrendingIcon,
                    color: "text-amber-500",
                    bg: isDarkMode ? "bg-amber-950/50" : "bg-amber-50"
                  }
                ].map((item, idx) => (
                  <div key={idx} className={`p-6 rounded-3xl border flex gap-6 items-start transition-all duration-300 ${
                    isDarkMode ? "bg-slate-900 border-slate-800 hover:border-blue-500/50" : "bg-slate-50 border-slate-100 hover:border-blue-500/20"
                  }`}>
                    <div className={`w-12 h-12 shrink-0 rounded-2xl ${item.bg} flex items-center justify-center`}>
                      <item.icon className={`w-6 h-6 ${item.color}`} />
                    </div>
                    <div>
                      <h3 className={`text-xl font-bold mb-2 transition-colors duration-300 ${isDarkMode ? "text-white" : "text-slate-900"}`}>{item.title}</h3>
                      <p className={`font-medium text-sm leading-relaxed transition-colors duration-300 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="hidden md:flex justify-center items-center">
                <div className="relative group perspective-1000">
                  <div className={`absolute -inset-2 rounded-[3rem] blur-xl opacity-30 transition-opacity duration-500 group-hover:opacity-50 ${isDarkMode ? "bg-blue-500" : "bg-blue-300"}`}></div>
                  <div className={`relative w-full max-w-md aspect-square rounded-[3rem] rotate-2 transition-all duration-500 hover:rotate-0 hover:scale-105 flex items-center justify-center overflow-hidden border-4 shadow-2xl ${
                    isDarkMode ? "border-slate-800 shadow-slate-950/50" : "border-white shadow-blue-900/10"
                  }`}>
                    <img 
                      src="/services_illustration.png" 
                      alt="Layanan Keuangan Terintegrasi" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA & Footer */}
        <section id="akses-portal" className={`relative z-10 py-32 px-6 overflow-hidden border-t transition-colors duration-300 ${
          isDarkMode ? "bg-slate-950 border-slate-900" : "bg-slate-900 border-slate-200"
        }`}>
          {/* Background Decorative Rings */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] border border-slate-700/30 rounded-full opacity-20 pointer-events-none" />
          
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">
                Sistem Manajemen Keuangan Internal
              </h2>
              <p className="text-slate-400 text-lg md:text-xl font-medium max-w-2xl mx-auto">
                Portal khusus karyawan untuk memantau, mencatat, dan mengelola seluruh aktivitas keuangan operasional Kroombox sehari-hari.
              </p>
              <div className="pt-8">
                <button
                  onClick={() => navigateTo("login")}
                  className={`px-10 py-5 rounded-full font-black text-base shadow-2xl hover:scale-105 transition-all active:scale-95 cursor-pointer border-none ${
                    isDarkMode 
                      ? "bg-blue-600 text-white hover:bg-blue-700" 
                      : "bg-white text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  Akses Portal
                </button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Tiny Footer */}
        <footer className={`py-8 px-6 text-center border-t relative z-10 transition-colors duration-300 ${
          isDarkMode ? "bg-slate-950 border-slate-900/60" : "bg-slate-950 border-slate-800"
        }`}>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            © {new Date().getFullYear()} KROOMONEY. Hak Cipta Dilindungi Undang-Undang.
          </p>
        </footer>

        {/* Notifications overlay (same as before) */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 z-[100] border ${notification.type === "success"
                  ? "bg-emerald-50 border-emerald-100 text-emerald-800"
                  : "bg-red-50 border-red-100 text-red-800"
                }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${notification.type === "success" ? "bg-emerald-500" : "bg-red-500"}`}>
                {notification.type === "success" ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
              </div>
              <span className="font-bold text-sm">{notification.message}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (view === "login") {
    return (
      <Login
        loginForm={loginForm}
        setLoginForm={setLoginForm}
        handleLoginSubmit={handleLoginSubmit}
        isSubmitting={isSubmitting}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        setView={navigateTo}
        notification={notification}
      />
    );
  }

  if (view === "register") {
    return (
      <Register
        registerForm={registerForm}
        setRegisterForm={setRegisterForm}
        handleRegisterSubmit={handleRegisterSubmit}
        isSubmitting={isSubmitting}
        showRegisterPassword={showRegisterPassword}
        setShowRegisterPassword={setShowRegisterPassword}
        hasSubmittedRegister={hasSubmittedRegister}
        setView={navigateTo}
        notification={notification}
      />
    );
  }

  if (view === "forgot-password") {
    return (
      <ForgotPassword
        resetEmail={resetEmail}
        setResetEmail={setResetEmail}
        resetOtp={resetOtp}
        setResetOtp={setResetOtp}
        newPassword={newPassword}
        setNewPassword={setNewPassword}
        resetStep={resetStep}
        setResetStep={setResetStep}
        isSubmitting={isSubmitting}
        setIsSubmitting={setIsSubmitting}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        setView={navigateTo}
        apiRequest={apiRequest}
        setNotification={setNotification}
        notification={notification}
      />
    );
  }

  if (view === "authenticated" && profile?.role === "Admin") {
    return (
      <AdminDashboard
        profile={profile}
        setProfile={setProfile}
        token={token}
        onLogout={handleLogout}
        isOffline={isOffline}
      />
    );
  }

  return (
    <UserDashboard
      profile={profile}
      setProfile={setProfile}
      token={token}
      isOffline={isOffline}
      setIsOffline={setIsOffline}
      onLogout={handleLogout}
    />
  );
}
