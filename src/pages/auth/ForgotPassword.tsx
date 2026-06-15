import React from "react";
import {
  Wallet,
  ShieldCheck,
  Mail,
  Lock,
  EyeOff,
  Eye
} from "lucide-react";
import { motion } from "motion/react";

interface ForgotPasswordProps {
  resetEmail: string;
  setResetEmail: React.Dispatch<React.SetStateAction<string>>;
  resetOtp: string;
  setResetOtp: React.Dispatch<React.SetStateAction<string>>;
  newPassword: string;
  setNewPassword: React.Dispatch<React.SetStateAction<string>>;
  resetStep: 1 | 2;
  setResetStep: React.Dispatch<React.SetStateAction<1 | 2>>;
  isSubmitting: boolean;
  setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
  showPassword: boolean;
  setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
  setView: React.Dispatch<React.SetStateAction<"landing" | "login" | "register" | "forgot-password" | "authenticated">>;
  apiRequest: (endpoint: string, options?: RequestInit) => Promise<any>;
  setNotification: React.Dispatch<React.SetStateAction<{ message: string; type: "success" | "error" } | null>>;
}

export default function ForgotPassword({
  resetEmail,
  setResetEmail,
  resetOtp,
  setResetOtp,
  newPassword,
  setNewPassword,
  resetStep,
  setResetStep,
  isSubmitting,
  setIsSubmitting,
  showPassword,
  setShowPassword,
  setView,
  apiRequest,
  setNotification
}: ForgotPasswordProps) {
  const handleSubmit = async () => {
    if (resetStep === 1) {
      try {
        setIsSubmitting(true);
        const res = await apiRequest("/auth/forgot-password", {
          method: "POST",
          body: JSON.stringify({ email: resetEmail })
        });
        setNotification({ message: res.message || "OTP terkirim ke email Anda!", type: "success" });
        setResetStep(2);
      } catch (err: any) {
        setNotification({ message: err.message || "Gagal mengirim OTP", type: "error" });
      } finally {
        setIsSubmitting(false);
      }
    } else {
      try {
        setIsSubmitting(true);
        const res = await apiRequest("/auth/reset-password", {
          method: "POST",
          body: JSON.stringify({ email: resetEmail, otp: resetOtp, newPassword })
        });
        setNotification({ message: res.message || "Sandi berhasil direset!", type: "success" });
        setView("login");
      } catch (err: any) {
        setNotification({ message: err.message || "Gagal mereset sandi", type: "error" });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row font-jakarta overflow-hidden w-full">
      {/* LEFT SIDE (40%) - Forgot Password Form */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full md:w-[40%] flex flex-col p-8 md:p-12 lg:p-16 z-20 bg-white"
      >
        {/* Logo Section */}
        <div className="flex items-center gap-2.5 mb-20">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/10">
            <Wallet className="w-6 h-6 text-emerald-400" />
          </div>
          <span className="text-2xl font-black tracking-tighter text-slate-900 leading-none">KroomBox</span>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex flex-col justify-center max-w-[400px] mx-auto w-full">
          <div className="space-y-3 mb-10">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Lupa Kata Sandi</h1>
            <p className="text-slate-400 text-sm font-medium">
              {resetStep === 1 
                ? "Masukkan email Anda untuk menerima kode OTP reset sandi." 
                : "Masukkan kode OTP yang dikirim ke email Anda beserta kata sandi baru."}
            </p>
          </div>

          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            {resetStep === 1 ? (
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Anda</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="email@bisnis.com"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50/50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-600 focus:bg-white transition-all text-sm font-medium"
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Kode OTP 6-Digit</label>
                  <div className="relative group">
                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                    <input
                      type="text"
                      value={resetOtp}
                      onChange={(e) => setResetOtp(e.target.value)}
                      placeholder="123456"
                      maxLength={6}
                      autoComplete="one-time-code"
                      name="otp-code"
                      inputMode="numeric"
                      className="w-full pl-12 pr-4 py-4 bg-slate-50/50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-600 focus:bg-white transition-all text-sm font-black tracking-widest"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Sandi Baru</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-12 pr-12 py-4 bg-slate-50/50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-600 focus:bg-white transition-all text-sm font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(prev => !prev)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors border-none bg-transparent cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                    </button>
                  </div>
                </div>
              </>
            )}

            <button
              type="button"
              disabled={isSubmitting || (resetStep === 1 ? !resetEmail : (!resetOtp || !newPassword))}
              onClick={handleSubmit}
              className="w-full py-4.5 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-100 hover:bg-blue-700 hover:-translate-y-0.5 transition-all active:scale-[0.98] mt-2 mb-4 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-none"
            >
              {isSubmitting ? "MEMPROSES..." : (resetStep === 1 ? "KIRIM OTP KE EMAIL" : "SIMPAN SANDI BARU")}
            </button>
            
            <div className="text-center mt-3">
              <button
                type="button"
                onClick={() => setView("login")}
                className="text-xs font-black text-slate-400 hover:text-slate-600 tracking-wider uppercase transition-colors cursor-pointer border-none bg-transparent"
              >
                Kembali ke Halaman Login
              </button>
            </div>
          </form>
        </div>

        <div className="mt-auto pt-8 text-center md:text-left">
          <p className="text-xs font-bold text-slate-300 uppercase tracking-widest leading-relaxed">© 2026 KROOMBOX ADMINISTRATOR. <br /> SECURED BY KROOMBOX SECURITY.</p>
        </div>
      </motion.div>

      {/* RIGHT SIDE (60%) - Visual Showcase */}
      <div className="hidden md:flex flex-1 relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 items-center justify-center overflow-hidden p-12">
        {/* Animated Background Mesh */}
        <div className="absolute inset-0 z-0">
          <motion.div
            animate={{ scale: [1, 1.2, 1], x: [0, 50, 0], y: [0, 30, 0] }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-[20%] -left-[10%] w-[80%] h-[80%] bg-blue-500/20 rounded-full blur-[120px]"
          />
          <motion.div
            animate={{ scale: [1, 1.3, 1], x: [0, -40, 0], y: [0, -50, 0] }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute -bottom-[20%] -right-[10%] w-[70%] h-[70%] bg-indigo-500/20 rounded-full blur-[140px]"
          />
        </div>

        <div className="relative z-10 w-full max-w-xl text-center space-y-16">
          <div className="space-y-5">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl lg:text-6xl font-black text-white leading-[1.1] tracking-tighter"
            >
              Keamanan <br /> <span className="text-blue-400">Adalah Prioritas</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-slate-400 font-medium text-lg leading-relaxed max-w-md mx-auto"
            >
              Kami melindungi setiap transaksi dan data sensitif bisnis Anda dengan sistem keamanan berlapis.
            </motion.p>
          </div>

          <div className="relative w-[300px] h-[300px] mx-auto flex items-center justify-center">
            <div className="absolute w-[180px] h-[180px] border border-blue-400/20 rounded-full" />
            <div className="absolute w-[280px] h-[280px] border border-blue-400/20 rounded-full" />
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="z-20 w-24 h-24 bg-slate-800 rounded-[30px] flex items-center justify-center shadow-2xl shadow-blue-900/40 border border-slate-700"
            >
              <ShieldCheck className="w-12 h-12 text-blue-400" />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
