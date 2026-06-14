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
  TrendingUp as TrendingIcon
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
        const { token: userToken, profile: userProfile } = res.data;
        setToken(userToken);
        localStorage.setItem("kroombox_user_token", userToken);
        const updatedProfile = {
          ...userProfile,
          role: userProfile.role || (userProfile.email.toLowerCase() === "admin@kroomoney.com" ? "Admin" : "Treasurer")
        };
        setProfile(updatedProfile);
        localStorage.setItem("kroombox_user_profile", JSON.stringify(updatedProfile));

        setNotification({ message: "Pendaftaran berhasil! Selamat datang di KroomBox.", type: "success" });
        setView("authenticated");
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
        setProfile(fallbackProfile);
        localStorage.setItem("kroombox_user_profile", JSON.stringify(fallbackProfile));
        setToken("offline-token-session");
        localStorage.setItem("kroombox_user_token", "offline-token-session");
        setIsOffline(true);
        setNotification({ message: `Pendaftaran selesai! Berjalan dalam Sesi Lokal Offline (${detectedRole}).`, type: "success" });
        setView("authenticated");
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
      <div className="min-h-screen bg-white font-jakarta text-slate-900 selection:bg-blue-600/10 overflow-hidden flex flex-col">
        {/* Subtle Background Elements */}
        <div className="fixed inset-0 z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-blue-100/50 rounded-full blur-[160px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-indigo-100/40 rounded-full blur-[160px]" />
          <div className="absolute top-[30%] left-[20%] w-[40%] h-[40%] bg-blue-400/10 rounded-full blur-[120px] animate-pulse" />
        </div>

        {/* Header Navbar */}
        <nav className="relative z-50 flex items-center justify-between px-8 py-8 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-10">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Wallet className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-2xl font-black tracking-tighter text-slate-900 leading-none">KroomBox</span>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 max-w-7xl mx-auto w-full py-20 text-center">
          {/* Floating Background Decorations */}
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={"bg-item-" + i}
                initial={{
                  x: Math.random() * 1000 - 500,
                  y: Math.random() * 600 - 300,
                  opacity: 0,
                  rotate: 0,
                  scale: 0.5
                }}
                animate={{
                  y: [null, Math.random() * -200 - 100],
                  opacity: [0, 0.4, 0],
                  rotate: [0, 360],
                  scale: [0.5, 1.2, 0.5]
                }}
                transition={{
                  duration: 8 + Math.random() * 12,
                  repeat: Infinity,
                  delay: i * 1,
                  ease: "easeInOut"
                }}
                className="absolute"
              >
                {i % 3 === 0 ? (
                  <div className="w-16 h-16 bg-blue-600/10 backdrop-blur-sm rounded-2xl flex items-center justify-center p-3">
                    <BarChart3 className="w-full h-full text-blue-600/30" />
                  </div>
                ) : i % 3 === 1 ? (
                  <div className="w-14 h-14 bg-emerald-500/10 backdrop-blur-sm rounded-full flex items-center justify-center p-3 border border-emerald-500/10">
                    <Coins className="w-full h-full text-emerald-500/30" />
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-indigo-600/10 backdrop-blur-sm rounded-xl flex items-center justify-center p-2.5">
                    <TrendingIcon className="w-full h-full text-indigo-600/20" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Grid Background Pattern */}
          <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
            style={{ backgroundImage: 'linear-gradient(#2563eb 1.5px, transparent 1.5px), linear-gradient(90deg, #2563eb 1.5px, transparent 1.5px)', backgroundSize: '64px 64px' }}>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 z-10"
          >
            <p className="text-[10px] md:text-sm font-black tracking-[0.4em] text-blue-600 uppercase mb-8">KROOMBOX FINANCIAL DASHBOARD</p>

            <div className="flex flex-col gap-0 leading-[0.82]">
              <h1 className="text-[5rem] md:text-[8rem] font-black tracking-[-0.06em] text-slate-900 uppercase">
                KroomBox
              </h1>
              <h1 className="text-[5rem] md:text-[8rem] font-black tracking-[-0.06em] text-blue-600 uppercase">
                Financial
              </h1>
              <h1 className="text-[5rem] md:text-[8rem] font-black tracking-[-0.06em] text-blue-600 uppercase">
                Management
              </h1>
            </div>

            <p className="text-slate-400 text-base md:text-xl font-medium max-w-2xl mx-auto pt-10 leading-normal">
              Panel administrasi terpusat untuk memantau, menganalisis, dan mengelola seluruh aktivitas keuangan startup Anda secara real-time.
            </p>

            <div className="pt-12 flex items-center justify-center gap-4">
              <button
                onClick={() => setView("login")}
                className="group flex items-center gap-4 bg-blue-600 text-white px-12 py-5 rounded-full font-black text-base shadow-2xl shadow-blue-200 hover:bg-blue-700 hover:-translate-y-1 transition-all active:scale-95 cursor-pointer border-none"
              >
                <span>MASUK SEKARANG</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
              </button>
            </div>
          </motion.div>
        </main>

        {/* Notifications */}
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
        setView={setView}
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
        setView={setView}
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
        setView={setView}
        apiRequest={apiRequest}
        setNotification={setNotification}
      />
    );
  }

  if (view === "authenticated" && profile?.role === "Admin") {
    return (
      <AdminDashboard
        profile={profile}
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
