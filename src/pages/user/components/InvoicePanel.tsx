import React, { useState, useEffect } from "react";
import { Search, Download, Trash2, FileText, Send, Eye, Package, Plus } from "lucide-react";
import { motion } from "motion/react";

interface InvoicePanelProps {
  formatRupiah: (number: number) => string;
}

export default function InvoicePanel({ formatRupiah }: InvoicePanelProps) {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/invoices", {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await res.json();
      if (data.status === "success") {
        setInvoices(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = (id: string) => {
    window.open(`/api/invoices/${id}/preview?token=${localStorage.getItem("token")}`, "_blank");
  };

  const handleDownloadPdf = (id: string) => {
    window.open(`/api/invoices/${id}/pdf?token=${localStorage.getItem("token")}`, "_blank");
  };

  const handleSendWa = async (id: string) => {
    try {
      const res = await fetch(`/api/invoices/${id}/send-wa`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}`, "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (data.status === "success" && data.waLink) {
        window.open(data.waLink, "_blank");
        fetchInvoices();
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
      const res = await fetch(`/api/invoices/${id}/send-email`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}`, "Content-Type": "application/json" },
        body: JSON.stringify({ emailTujuan: email })
      });
      const data = await res.json();
      if (data.status === "success") {
        alert("Email berhasil dikirim!");
        fetchInvoices();
      } else {
        alert(data.message || "Gagal mengirim email");
      }
    } catch (err) {
      console.error(err);
      alert("Error send email");
    }
  };

  const filteredInvoices = invoices.filter(inv =>
    inv.nomorInvoice.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.namaPelanggan.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div
      key="invoice"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6 w-full"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Data Invoice</h2>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mt-1">Daftar Tagihan Pelanggan</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-grow sm:flex-grow-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari invoice..."
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
                <th className="py-5 px-6">Nomor Invoice</th>
                <th className="py-5 px-6">Tanggal</th>
                <th className="py-5 px-6">Pelanggan</th>
                <th className="py-5 px-6">Total</th>
                <th className="py-5 px-6">Status</th>
                <th className="py-5 px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">Loading...</td>
                </tr>
              ) : filteredInvoices.length > 0 ? (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors text-xs font-bold text-slate-700">
                    <td className="py-5 px-6 font-mono text-blue-600">{inv.nomorInvoice}</td>
                    <td className="py-5 px-6 text-slate-500">{new Date(inv.tanggalTerbit).toLocaleDateString("id-ID")}</td>
                    <td className="py-5 px-6 text-slate-900">{inv.namaPelanggan}</td>
                    <td className="py-5 px-6">{formatRupiah(inv.total)}</td>
                    <td className="py-5 px-6">
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
                        inv.statusInvoice === 'dibayar' ? 'bg-emerald-50 text-emerald-600' :
                        inv.statusInvoice === 'draft' ? 'bg-slate-100 text-slate-600' :
                        'bg-amber-50 text-amber-600'
                      }`}>
                        {inv.statusInvoice}
                      </span>
                    </td>
                    <td className="py-5 px-6 text-right space-x-2">
                      <button onClick={() => handlePreview(inv.id)} className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-lg" title="Preview HTML">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDownloadPdf(inv.id)} className="p-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg" title="Download PDF">
                        <FileText className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleSendWa(inv.id)} className="p-2 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg" title="Kirim WA">
                        <Send className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleSendEmail(inv.id)} className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg" title="Kirim Email">
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
                      <p className="text-xs font-black uppercase tracking-widest">Tidak ada data invoice</p>
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
