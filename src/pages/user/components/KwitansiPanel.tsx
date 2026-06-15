import React, { useState, useEffect } from "react";
import { Search, Download, Trash2, FileText, Send, Eye, Package } from "lucide-react";
import { motion } from "motion/react";

interface KwitansiPanelProps {
  formatRupiah: (number: number) => string;
}

export default function KwitansiPanel({ formatRupiah }: KwitansiPanelProps) {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReceipts();
  }, []);

  const fetchReceipts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/receipts", {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await res.json();
      if (data.status === "success") {
        setReceipts(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = (id: string) => {
    window.open(`/api/receipts/${id}/preview?token=${localStorage.getItem("token")}`, "_blank");
  };

  const handleDownloadPdf = (id: string) => {
    window.open(`/api/receipts/${id}/pdf?token=${localStorage.getItem("token")}`, "_blank");
  };

  const handleSendWa = async (id: string) => {
    try {
      const res = await fetch(`/api/receipts/${id}/send-wa`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}`, "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (data.status === "success" && data.waLink) {
        window.open(data.waLink, "_blank");
        fetchReceipts();
      } else {
        alert(data.message || "Gagal membuat link WA");
      }
    } catch (err) {
      console.error(err);
      alert("Error generate WA link");
    }
  };

  const handleSendEmail = async (id: string) => {
    const email = prompt("Masukkan alamat email tujuan:");
    if (!email) return;
    try {
      const res = await fetch(`/api/receipts/${id}/send-email`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}`, "Content-Type": "application/json" },
        body: JSON.stringify({ emailTujuan: email })
      });
      const data = await res.json();
      if (data.status === "success") {
        alert("Email berhasil dikirim!");
        fetchReceipts();
      } else {
        alert(data.message || "Gagal mengirim email");
      }
    } catch (err) {
      console.error(err);
      alert("Error send email");
    }
  };

  const filteredReceipts = receipts.filter(r =>
    r.nomorKwitansi.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.namaPelanggan.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div
      key="kwitansi"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6 w-full"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Data Kwitansi</h2>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mt-1">Daftar Bukti Pembayaran</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-grow sm:flex-grow-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kwitansi..."
              className="w-full sm:w-64 pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden w-full">
        <div className="overflow-x-auto w-full">
          <table className="w-full border-collapse text-left min-w-[900px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-widest select-none">
                <th className="py-5 px-6">Nomor Kwitansi</th>
                <th className="py-5 px-6">Tanggal</th>
                <th className="py-5 px-6">Pelanggan</th>
                <th className="py-5 px-6">Nominal</th>
                <th className="py-5 px-6">Metode</th>
                <th className="py-5 px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">Loading...</td>
                </tr>
              ) : filteredReceipts.length > 0 ? (
                filteredReceipts.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition-colors text-xs font-bold text-slate-700">
                    <td className="py-5 px-6 font-mono text-blue-600">{r.nomorKwitansi}</td>
                    <td className="py-5 px-6 text-slate-500">{new Date(r.tanggalTerbit).toLocaleDateString("id-ID")}</td>
                    <td className="py-5 px-6 text-slate-900">{r.namaPelanggan}</td>
                    <td className="py-5 px-6 text-emerald-600">{formatRupiah(r.nominalDiterima)}</td>
                    <td className="py-5 px-6 text-slate-500">{r.metodePembayaran}</td>
                    <td className="py-5 px-6 text-right space-x-2">
                      <button onClick={() => handlePreview(r.id)} className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-lg" title="Preview HTML">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDownloadPdf(r.id)} className="p-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg" title="Download PDF">
                        <FileText className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleSendWa(r.id)} className="p-2 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg" title="Kirim WA">
                        <Send className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleSendEmail(r.id)} className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg" title="Kirim Email">
                        <span className="font-bold">@</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center opacity-20">
                      <Package className="w-16 h-16 mb-4" />
                      <p className="text-xs font-black uppercase tracking-widest">Tidak ada data kwitansi</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
