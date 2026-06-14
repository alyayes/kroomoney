import React, { useState } from "react";
import { Camera, Edit, ShieldCheck, CheckCircle2, User, Mail, AlertCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Profile {
  nama: string;
  email: string;
  tandaTangan?: string;
  fotoProfil?: string;
  role?: string;
}

interface UserProfileProps {
  profile: Profile;
  setProfile: React.Dispatch<React.SetStateAction<Profile>>;
  token: string | null;
  isOffline: boolean;
  transactionsCount: number;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>, field: "fotoProfil" | "tandaTangan") => void;
}

export default function UserProfile({
  profile,
  setProfile,
  token,
  isOffline,
  transactionsCount,
  handleFileUpload
}: UserProfileProps) {
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [editProfileForm, setEditProfileForm] = useState({
    nama: profile.nama || "",
    email: profile.email || "",
    tandaTangan: profile.tandaTangan || ""
  });

  const API_BASE = "http://127.0.0.1:5000/api";

  const handleSaveProfile = async () => {
    try {
      const apiRequestLocal = async (endpoint: string, options: RequestInit = {}) => {
        const url = `${API_BASE}${endpoint}`;
        const headers = new Headers(options.headers || {});
        if (token) headers.set("Authorization", `Bearer ${token}`);
        if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
          headers.set("Content-Type", "application/json");
        }
        const res = await fetch(url, { ...options, headers });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP error ${res.status}`);
        }
        return await res.json();
      };

      if (token && token !== "offline-token-session" && !isOffline) {
        await apiRequestLocal("/profile", {
          method: "PUT",
          body: JSON.stringify({
            nama: editProfileForm.nama,
            email: editProfileForm.email,
            tandaTangan: editProfileForm.tandaTangan
          })
        });
      }

      setProfile(prev => ({
        ...prev,
        nama: editProfileForm.nama,
        email: editProfileForm.email,
        tandaTangan: editProfileForm.tandaTangan
      }));
      setIsEditProfileModalOpen(false);
    } catch (err: any) {
      console.error("Gagal memperbarui profil:", err);
      // Fallback update locally
      setProfile(prev => ({
        ...prev,
        nama: editProfileForm.nama,
        email: editProfileForm.email,
        tandaTangan: editProfileForm.tandaTangan
      }));
      setIsEditProfileModalOpen(false);
    }
  };

  return (
    <motion.div
      key="profil"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-8 w-full"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Pengaturan Profil</h1>
          <p className="text-slate-500 font-medium text-sm">Kelola informasi profil akun Anda.</p>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-6 md:p-10 relative overflow-hidden flex flex-col md:flex-row items-center gap-8 md:gap-12">
        <div className="flex flex-col items-center gap-5 shrink-0">
          <div className="relative group">
            <div className="w-40 h-40 rounded-full bg-slate-100 overflow-hidden border-4 border-white shadow-xl flex items-center justify-center aspect-square">
              <img src={profile.fotoProfil || "https://api.dicebear.com/7.x/avataaars/svg?seed=Finance"} alt="Foto Profil" className="w-full h-full object-cover object-center" />
            </div>
            <label className="absolute bottom-2 right-2 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:bg-blue-700 transition-colors border-2 border-white">
              <Camera className="w-4 h-4" />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, "fotoProfil")}
                className="hidden"
              />
            </label>
          </div>

          <button
            onClick={() => {
              setEditProfileForm({
                nama: profile.nama || "",
                email: profile.email || "",
                tandaTangan: profile.tandaTangan || ""
              });
              setIsEditProfileModalOpen(true);
            }}
            className="flex w-full items-center justify-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20 active:scale-95 border-none cursor-pointer"
          >
            <Edit className="w-4 h-4" />
            Edit Profil
          </button>
        </div>

        <div className="flex-1 text-center md:text-left space-y-4">
          <div>
            <h2 className="text-4xl font-black text-slate-900">{profile.nama || "Nama Belum Diatur"}</h2>
            <p className="text-slate-500 font-medium text-lg">{profile.email}</p>
          </div>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
            <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-sm font-bold">
              <ShieldCheck className="w-5 h-5" />
              Staf Keuangan
            </div>
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-sm font-bold">
              <CheckCircle2 className="w-5 h-5" />
              {transactionsCount} Transaksi Tercatat
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-8 relative overflow-hidden flex flex-col h-full">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Detail Profil Staf</h3>
              <p className="text-slate-400 text-xs font-medium">Informasi resmi staf KroomBox</p>
            </div>
          </div>

          <div className="space-y-6 flex-1">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Lengkap Staf</label>
              <div className="px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-800">
                {profile.nama || "-"}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Staf</label>
              <div className="px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-800">
                {profile.email || "-"}
              </div>
            </div>
          </div>

          <div className="text-xs bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex items-start gap-3 mt-8 text-blue-900 font-medium">
            <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <p>Informasi profil ini akan digunakan pada kop surat (header) dokumen Invoice dan Kwitansi yang dicetak.</p>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-8 relative overflow-hidden flex flex-col h-full">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
              <Edit className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Tanda Tangan Bendahara</h3>
              <p className="text-slate-400 text-xs font-medium">Pratinjau tanda tangan untuk dokumen PDF</p>
            </div>
          </div>

          <div className="relative border border-slate-200 rounded-3xl p-6 bg-slate-50 flex flex-col items-center justify-center text-center flex-1 min-h-[220px]">
            {profile.tandaTangan ? (
              <div className="flex flex-col items-center gap-4 w-full">
                <div className="relative w-full max-w-[240px] h-[120px] bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex items-center justify-center group">
                  <img src={profile.tandaTangan} alt="Tanda Tangan" className="w-full h-full object-contain p-4" />
                </div>
                <div className="flex gap-2 w-full max-w-[240px]">
                  <label className="flex-1 cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, "tandaTangan")}
                      className="hidden"
                    />
                    <div className="py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-[10px] uppercase tracking-wider text-slate-700 hover:bg-slate-50 transition-all shadow-sm text-center">
                      Ganti
                    </div>
                  </label>
                  <button
                    onClick={async () => {
                      try {
                        if (token && token !== "offline-token-session" && !isOffline) {
                          const headers = new Headers();
                          headers.set("Authorization", `Bearer ${token}`);
                          headers.set("Content-Type", "application/json");
                          await fetch(`${API_BASE}/profile`, {
                            method: "PUT",
                            headers,
                            body: JSON.stringify({
                              nama: profile.nama,
                              email: profile.email,
                              tandaTangan: "",
                              fotoProfil: profile.fotoProfil
                            })
                          });
                        }
                        setProfile(prev => ({ ...prev, tandaTangan: "" }));
                      } catch (err) {
                        console.error("Gagal menghapus tanda tangan:", err);
                        setProfile(prev => ({ ...prev, tandaTangan: "" }));
                      }
                    }}
                    className="flex-1 py-2.5 bg-red-50 border border-red-100 hover:bg-red-100 text-red-600 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-slate-100 text-slate-300 rounded-full flex items-center justify-center mb-4">
                  <Edit className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-slate-500 mb-4">Belum ada tanda tangan yang disimpan.</p>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, "tandaTangan")}
                    className="hidden"
                  />
                  <div className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20">
                    Unggah Tanda Tangan
                  </div>
                </label>
              </div>
            )}
          </div>
        </div>
      </div>

      {isEditProfileModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => { if (e.target === e.currentTarget) setIsEditProfileModalOpen(false); }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden my-auto border border-slate-100"
          >
            <div className="flex items-center justify-between p-6 md:p-8 border-b border-slate-100">
              <h3 className="text-2xl font-black text-slate-800">Edit Personal Information</h3>
              <button
                onClick={() => setIsEditProfileModalOpen(false)}
                className="w-10 h-10 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center hover:bg-slate-100 hover:text-slate-600 transition-colors border-none cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 md:p-8 space-y-6 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-[#e87c1e] transition-colors" />
                    <input
                      type="text"
                      value={editProfileForm.nama}
                      onChange={(e) => setEditProfileForm(prev => ({ ...prev, nama: e.target.value }))}
                      className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-50 focus:border-[#e87c1e] transition-all font-bold text-slate-800"
                      placeholder="Nama Lengkap Anda"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-[#e87c1e] transition-colors" />
                    <input
                      type="email"
                      value={editProfileForm.email}
                      onChange={(e) => setEditProfileForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-50 focus:border-[#e87c1e] transition-all font-bold text-slate-800"
                      placeholder="Email Anda"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Digital Signature</label>
                  <div className="relative border border-slate-200 rounded-3xl p-6 bg-slate-50 flex flex-col items-center justify-center text-center">
                    {editProfileForm.tandaTangan ? (
                      <div className="relative w-full max-w-[240px] h-[120px] bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-5 flex items-center justify-center group">
                        <img src={editProfileForm.tandaTangan} alt="Tanda Tangan" className="w-full h-full object-contain p-4" />
                        <button
                          type="button"
                          onClick={() => setEditProfileForm(prev => ({ ...prev, tandaTangan: "" }))}
                          className="absolute top-2 right-2 p-1.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 border-none cursor-pointer"
                          title="Hapus Tanda Tangan"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-white border border-slate-100 text-slate-300 rounded-full flex items-center justify-center mb-5 shadow-sm">
                        <Edit className="w-6 h-6" />
                      </div>
                    )}
                    <label className="cursor-pointer group">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 2 * 1024 * 1024) {
                              return;
                            }
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setEditProfileForm(prev => ({ ...prev, tandaTangan: reader.result as string }));
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                      />
                      <div className="px-6 py-3 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-700 group-hover:bg-slate-50 group-hover:border-slate-300 transition-all shadow-sm">
                        {editProfileForm.tandaTangan ? "Ganti Tanda Tangan" : "Unggah Tanda Tangan"}
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 md:px-8 md:py-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={handleSaveProfile}
                className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-xs hover:bg-blue-700 transition-all active:scale-95 shadow-md shadow-blue-600/20 border-none cursor-pointer"
              >
                SAVE DETAILS
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}
