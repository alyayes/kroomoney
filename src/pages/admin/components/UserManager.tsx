import React from "react";
import { Plus, X, UserMinus, UserCheck, Edit2, Trash2 } from "lucide-react";
import { motion } from "motion/react";

interface Treasurer {
  id: string;
  nama: string;
  email: string;
  status: string;
  startup: string;
  lastActive: string;
}

interface UserForm {
  nama: string;
  email: string;
  startup: string;
  status: string;
}

interface UserManagerProps {
  treasurers: Treasurer[];
  showAddUserModal: boolean;
  setShowAddUserModal: (val: boolean) => void;
  editingUser: Treasurer | null;
  setEditingUser: (user: Treasurer | null) => void;
  userForm: UserForm;
  setUserForm: React.Dispatch<React.SetStateAction<UserForm>>;
  handleSaveUser: (e: React.FormEvent) => void;
  handleToggleStatus: (id: string) => void;
  handleDeleteUser: (id: string, name: string) => void;
}

export default function UserManager({
  treasurers,
  showAddUserModal,
  setShowAddUserModal,
  editingUser,
  setEditingUser,
  userForm,
  setUserForm,
  handleSaveUser,
  handleToggleStatus,
  handleDeleteUser
}: UserManagerProps) {
  return (
    <motion.div
      key="user-management"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-8"
    >
      {/* Actions bar */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-[#DBEEFF] shadow-[0_4px_12px_-4px_rgba(58,123,213,0.04)]">
        <h4 className="text-base font-black text-[#1E2D50]">Daftar Staf Bendahara KroomBox</h4>
        <button
          onClick={() => {
            setEditingUser(null);
            setUserForm({ nama: "", email: "", startup: "Kroombox Corp", status: "Active" });
            setShowAddUserModal(true);
          }}
          className="flex items-center gap-2 bg-[#2563EB] hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer border-none"
        >
          <Plus className="w-4 h-4" /> TAMBAH BENDAHARA BARU
        </button>
      </div>

      {/* Treasurers list in visual cards & table */}
      <div className="bg-white rounded-2xl border border-[#DBEEFF] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-[#EAF4FF] border-b border-[#DBEEFF] text-[10px] font-black uppercase text-[#5A6A85] tracking-widest select-none">
                <th className="py-5 px-6">ID Staf</th>
                <th className="py-5 px-6">Nama & Email</th>
                <th className="py-5 px-6">Startup Afiliasi</th>
                <th className="py-5 px-6">Terakhir Aktif</th>
                <th className="py-5 px-6">Status</th>
                <th className="py-5 px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DBEEFF]">
              {treasurers.map(user => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors text-sm font-medium">
                  <td className="py-5 px-6 font-mono font-bold text-xs text-[#2563EB]">{user.id}</td>
                  <td className="py-5 px-6">
                    <div>
                      <p className="font-bold text-[#1E2D50]">{user.nama}</p>
                      <span className="text-xs text-[#5A6A85]">{user.email}</span>
                    </div>
                  </td>
                  <td className="py-5 px-6 text-xs font-bold text-[#5A6A85]">{user.startup}</td>
                  <td className="py-5 px-6 text-xs text-slate-400">{user.lastActive}</td>
                  <td className="py-5 px-6">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
                      user.status === "Active" ? "bg-emerald-50 text-emerald-600" :
                      user.status === "Pending" ? "bg-amber-50 text-amber-600 animate-pulse" : "bg-red-50 text-red-500"
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="py-5 px-6 text-right space-x-2">
                    {/* Toggle active / deactivate */}
                    <button
                      onClick={() => handleToggleStatus(user.id)}
                      className={`p-2 rounded-lg border transition-all active:scale-90 cursor-pointer ${
                        user.status === "Active"
                          ? "bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100"
                          : "bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100"
                      }`}
                      title={user.status === "Active" ? "Nonaktifkan Pengguna" : "Aktifkan Pengguna"}
                    >
                      {user.status === "Active" ? <UserMinus className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                    </button>
                    
                    {/* Edit details */}
                    <button
                      onClick={() => {
                        setEditingUser(user);
                        setUserForm({ nama: user.nama, email: user.email, startup: user.startup, status: user.status });
                        setShowAddUserModal(true);
                      }}
                      className="p-2 bg-slate-50 border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-100 transition-all active:scale-90 cursor-pointer"
                      title="Edit Biodata"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {/* Delete account */}
                    <button
                      onClick={() => handleDeleteUser(user.id, user.nama)}
                      className="p-2 bg-red-50 border border-red-200 text-red-500 rounded-lg hover:bg-red-100 transition-all active:scale-90 cursor-pointer"
                      title="Hapus Akun"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL FOR ADD/EDIT USER */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-[#1E2D50]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl border border-[#DBEEFF] shadow-2xl p-6 w-full max-w-md relative overflow-hidden"
          >
            <button
              onClick={() => setShowAddUserModal(false)}
              className="absolute right-4 top-4 p-2 bg-slate-50 hover:bg-slate-100 text-slate-400 rounded-xl border-none cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-black text-[#1E2D50] tracking-tight mb-4">
              {editingUser ? "Edit Profil Bendahara" : "Tambah Bendahara Baru"}
            </h3>

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-[#5A6A85] tracking-widest ml-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  placeholder="Fina Selia"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:outline-none focus:border-[#2563EB] focus:bg-white transition-all"
                  value={userForm.nama}
                  onChange={e => setUserForm(prev => ({ ...prev, nama: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-[#5A6A85] tracking-widest ml-1">Email Staf</label>
                <input
                  type="email"
                  required
                  placeholder="fina@kroombox.com"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:outline-none focus:border-[#2563EB] focus:bg-white transition-all"
                  value={userForm.email}
                  onChange={e => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-[#5A6A85] tracking-widest ml-1">Startup / Lembaga</label>
                <input
                  type="text"
                  placeholder="Contoh: Telkom Studio"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:outline-none focus:border-[#2563EB] focus:bg-white transition-all"
                  value={userForm.startup}
                  onChange={e => setUserForm(prev => ({ ...prev, startup: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-[#5A6A85] tracking-widest ml-1">Status Awal</label>
                <select
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:outline-none focus:border-[#2563EB] focus:bg-white transition-all cursor-pointer"
                  value={userForm.status}
                  onChange={e => setUserForm(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-[#2563EB] hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl text-xs shadow-md transition-all active:scale-98 cursor-pointer border-none"
                >
                  SIMPAN DATA SECARA AMAN
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
