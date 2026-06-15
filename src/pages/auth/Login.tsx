import React from "react";
import {
  Wallet,
  ShieldCheck,
  Mail,
  Lock,
  EyeOff,
  Eye,
  BarChart3,
  Coins,
  TrendingUp as TrendingIcon,
  Landmark,
  Smartphone,
  LineChart,
  PieChart as PieChartIcon,
  Activity,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface LoginForm {
  email: string;
  password: string;
}

interface LoginProps {
  loginForm: LoginForm;
  setLoginForm: React.Dispatch<React.SetStateAction<LoginForm>>;
  handleLoginSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  showPassword: boolean;
  setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
  setView: React.Dispatch<React.SetStateAction<"landing" | "login" | "register" | "forgot-password" | "authenticated">>;
  notification?: { message: string; type: "success" | "error" } | null;
}

export default function Login({
  loginForm,
  setLoginForm,
  handleLoginSubmit,
  isSubmitting,
  showPassword,
  setShowPassword,
  setView,
  notification
}: LoginProps) {
  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row font-jakarta overflow-hidden w-full">
      {/* LEFT SIDE (40%) - Login Form */}
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

        {/* Login Form Container */}
        <div className="flex-1 flex flex-col justify-center max-w-[400px] mx-auto w-full">
          <div className="space-y-3 mb-10">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Masuk ke Akun Anda</h1>
            <p className="text-slate-400 text-sm font-medium">Silakan login untuk mengakses dashboard pencatatan keuangan.</p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                <input
                  type="email"
                  required
                  placeholder="email@bisnis.com"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50/50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-600 focus:bg-white transition-all text-sm font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••••••"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
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

            <div className="flex items-center justify-end text-xs font-bold mb-4 mt-2">
              <button
                type="button"
                onClick={() => setView("forgot-password")}
                className="text-blue-600 hover:text-blue-700 transition-colors cursor-pointer border-none bg-transparent"
              >
                Lupa Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4.5 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-100 hover:bg-blue-700 hover:-translate-y-0.5 transition-all active:scale-[0.98] mt-2 mb-4 cursor-pointer disabled:opacity-50 border-none"
            >
              {isSubmitting ? "MEMPROSES..." : "MASUK"}
            </button>
            <div className="text-center mt-3">
              <button
                type="button"
                onClick={() => setView("register")}
                className="text-xs font-black text-blue-600 hover:text-blue-700 tracking-wider uppercase transition-colors cursor-pointer border-none bg-transparent"
              >
                Belum punya akun? Daftar
              </button>
            </div>
          </form>
        </div>

        <div className="mt-auto pt-8 text-center md:text-left">
          <p className="text-xs font-bold text-slate-300 uppercase tracking-widest leading-relaxed">© 2025 KROOMBOX ADMINISTRATOR. <br /> SECURED BY KROOMBOX SECURITY.</p>
        </div>
      </motion.div>

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
              Kelola Keuangan <br /> <span className="text-blue-600">Lebih Mudah</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-slate-500 font-medium text-lg leading-relaxed max-w-md mx-auto"
            >
              Catat pemasukan, pengeluaran, dan pantau kondisi keuangan secara real-time.
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
              className="z-20 w-32 h-32 bg-white rounded-[40px] flex items-center justify-center shadow-2xl shadow-blue-900/10 border border-white"
            >
              <div className="w-20 h-20 bg-blue-600 rounded-[30px] flex items-center justify-center shadow-xl shadow-blue-200">
                <Wallet className="w-10 h-10 text-white" />
              </div>
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
    </div>
  );
}
