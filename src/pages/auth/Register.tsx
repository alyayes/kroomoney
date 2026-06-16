import React from "react";
import {
  Wallet,
  ShieldCheck,
  User,
  Mail,
  Lock,
  EyeOff,
  Eye,
  AlertCircle,
  CheckCircle2,
  BarChart3,
  Coins,
  TrendingUp as TrendingIcon,
  Landmark,
  Smartphone,
  LineChart,
  PieChart as PieChartIcon,
  Activity
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface RegisterForm {
  nama: string;
  email: string;
  password: string;
}

interface RegisterProps {
  registerForm: RegisterForm;
  setRegisterForm: React.Dispatch<React.SetStateAction<RegisterForm>>;
  handleRegisterSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  showRegisterPassword: boolean;
  setShowRegisterPassword: React.Dispatch<React.SetStateAction<boolean>>;
  hasSubmittedRegister: boolean;
  setView: React.Dispatch<React.SetStateAction<"landing" | "login" | "register" | "forgot-password" | "authenticated">>;
  notification?: { message: string; type: "success" | "error" } | null;
}

export default function Register({
  registerForm,
  setRegisterForm,
  handleRegisterSubmit,
  isSubmitting,
  showRegisterPassword,
  setShowRegisterPassword,
  hasSubmittedRegister,
  setView,
  notification
}: RegisterProps) {
  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row font-jakarta overflow-hidden w-full">
      {/* LEFT SIDE (40%) - Registration Form */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full md:w-[40%] flex flex-col p-8 md:p-12 lg:p-16 z-20 bg-white overflow-y-auto max-h-screen custom-scrollbar"
      >
        {/* Logo Section */}
        <div className="flex items-center gap-2.5 mb-10 shrink-0">
          <img src="/logo.png" alt="Kroomoney Logo" className="w-10 h-auto object-contain drop-shadow-sm mix-blend-multiply" />
          <span className="text-2xl font-black tracking-tighter text-slate-900 leading-none">KROOMONEY</span>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex flex-col justify-center max-w-[400px] mx-auto w-full py-8">
          <div className="space-y-3 mb-8">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Daftar Akun Staf KroomBox</h1>
            <p className="text-slate-400 text-sm font-medium">Buat akun pengelola keuangan staf KroomBox dalam hitungan detik.</p>
          </div>

          <form onSubmit={handleRegisterSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Lengkap</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                <input
                  type="text"
                  required
                  placeholder="Fina Selia"
                  value={registerForm.nama}
                  onChange={(e) => setRegisterForm(prev => ({ ...prev, nama: e.target.value }))}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-600 focus:bg-white transition-all text-sm font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Staf</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                <input
                  type="email"
                  required
                  placeholder="staf@kroombox.com"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-600 focus:bg-white transition-all text-sm font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                <input
                  type={showRegisterPassword ? "text" : "password"}
                  required
                  placeholder="••••••••••••"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full pl-12 pr-12 py-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-600 focus:bg-white transition-all text-sm font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowRegisterPassword(prev => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors cursor-pointer border-none bg-transparent"
                >
                  {showRegisterPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
              <AnimatePresence>
                {hasSubmittedRegister && registerForm.password.length < 8 && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.2 }}
                    className="text-red-500 text-xs font-bold mt-1.5 flex items-center gap-1 ml-1"
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    Minimal 8 karakter
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-100 hover:bg-blue-700 hover:-translate-y-0.5 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-4 mb-2 cursor-pointer relative border-none"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  MEMPROSES...
                </span>
              ) : (
                "DAFTAR SEKARANG"
              )}
            </button>

            <div className="text-center mt-3">
              <button
                type="button"
                onClick={() => setView("login")}
                className="text-xs font-black text-blue-600 hover:text-blue-700 tracking-wider uppercase transition-colors cursor-pointer border-none bg-transparent"
              >
                Sudah punya akun? Masuk
              </button>
            </div>
          </form>
        </div>

        <div className="mt-auto pt-6 text-center md:text-left shrink-0">
          <p className="text-xs font-bold text-slate-300 uppercase tracking-widest leading-relaxed">© 2025 KROOMBOX ADMINISTRATOR. <br /> SECURED BY KROOMBOX SECURITY.</p>
        </div>
      </motion.div>

      {/* RIGHT SIDE (60%) - Visual Showcase */}
      <div className="hidden md:flex flex-1 relative bg-gradient-to-br from-blue-50 via-indigo-50/50 to-white items-center justify-center overflow-hidden p-12">
        {/* Animated Background Mesh */}
        <div className="absolute inset-0 z-0">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              x: [0, 50, 0],
              y: [0, 30, 0]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-[20%] -left-[10%] w-[80%] h-[80%] bg-blue-100/50 rounded-full blur-[120px]"
          />
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              x: [0, -40, 0],
              y: [0, -50, 0]
            }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute -bottom-[20%] -right-[10%] w-[70%] h-[70%] bg-indigo-100/40 rounded-full blur-[140px]"
          />
        </div>

        <div className="relative z-10 w-full max-w-xl text-center space-y-16">
          {/* Headlines */}
          <div className="space-y-5">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl lg:text-6xl font-black text-slate-900 leading-[1.1] tracking-tighter"
            >
              Gabung Bersama <br /> <span className="text-blue-600">KroomBox</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-slate-500 font-medium text-lg leading-relaxed max-w-md mx-auto"
            >
              Dapatkan akses instan ke sistem pencatatan keuangan premium, invoice generator, dan penagihan otomatis.
            </motion.p>
          </div>

          {/* Orbit Animation Visual */}
          <div className="relative w-[400px] h-[400px] mx-auto flex items-center justify-center">
            {/* Concentric Decorative Rings */}
            <div className="absolute w-[180px] h-[180px] border border-blue-200/40 rounded-full" />
            <div className="absolute w-[280px] h-[280px] border border-blue-200/40 rounded-full" />
            <div className="absolute w-[380px] h-[380px] border border-blue-200/40 rounded-full" />

            {/* Central Premium Icon */}
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="z-20 w-32 h-32 bg-white rounded-[40px] flex items-center justify-center shadow-2xl shadow-blue-900/10 border border-white p-2"
            >
              <img src="/logo.png" alt="Kroomoney Logo" className="w-full h-full object-contain mix-blend-multiply" />
            </motion.div>

            {/* Orbiting Interaction Icons */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 pointer-events-none"
            >
              {[
                { icon: BarChart3, color: "text-emerald-500", pos: "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2", size: "w-14 h-14" },
                { icon: Landmark, color: "text-indigo-500", pos: "right-0 top-1/2 translate-x-1/2 -translate-y-1/2", size: "w-12 h-12" },
                { icon: Smartphone, color: "text-blue-500", pos: "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2", size: "w-14 h-14" },
                { icon: LineChart, color: "text-sky-500", pos: "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2", size: "w-12 h-12" },
                { icon: Activity, color: "text-blue-600", pos: "top-[20%] right-[10%]", size: "w-10 h-10" },
                { icon: PieChartIcon, color: "text-violet-500", pos: "bottom-[20%] left-[10%]", size: "w-10 h-10" }
              ].map((item, i) => (
                <div key={i} className={`absolute ${item.pos}`}>
                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                    className={`${item.size} bg-white rounded-2xl shadow-xl flex items-center justify-center border border-white/50 backdrop-blur-sm`}
                  >
                    <item.icon className={`w-1/2 h-1/2 ${item.color}`} />
                  </motion.div>
                </div>
              ))}
            </motion.div>

            {/* Floating Money Effects */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={"money-" + i}
                initial={{
                  x: Math.random() * 300 - 150,
                  y: Math.random() * 300 - 150,
                  opacity: 0,
                  scale: 0.5
                }}
                animate={{
                  y: [0, -100, 0],
                  x: [0, Math.random() * 40 - 20, 0],
                  rotate: [0, 360],
                  opacity: [0, 1, 1, 0],
                  scale: [0.5, 1, 1, 0.5]
                }}
                transition={{
                  duration: 6 + Math.random() * 4,
                  repeat: Infinity,
                  delay: i * 1.5,
                  ease: "linear"
                }}
                className="absolute pointer-events-none"
              >
                <div className="w-12 h-12 bg-emerald-50 rounded-full border-2 border-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-lg shadow-lg">
                  $
                </div>
              </motion.div>
            ))}

            {/* Glow Center */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[120px] h-[120px] bg-blue-400/10 rounded-full blur-[40px] animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 z-[100] border ${
              notification.type === "success"
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
