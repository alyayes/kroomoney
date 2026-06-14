import React from "react";
import { motion } from "motion/react";

interface AuditLog {
  id: string;
  time: string;
  user: string;
  action: string;
  ip: string;
  severity: "Info" | "Success" | "Warning" | "Danger";
}

interface AuditSecurityProps {
  auditLogs: AuditLog[];
}

export default function AuditSecurity({ auditLogs }: AuditSecurityProps) {
  return (
    <motion.div
      key="audit-security"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-8 w-full"
    >
      {/* Audit trail logs */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
        <div>
          <h4 className="text-lg font-black text-[#1E2D50] tracking-tight">Visual Audit & Security Trail</h4>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">Database audit trail & authorization history</p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase text-slate-400 tracking-widest select-none">
                <th className="py-4 px-6">Timestamp</th>
                <th className="py-4 px-6">Pengguna</th>
                <th className="py-4 px-6">Aktivitas Tindakan</th>
                <th className="py-4 px-6">IP Address</th>
                <th className="py-4 px-6">Tingkat Kerawanan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-medium">
              {auditLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-6 text-xs text-slate-400 font-bold">{log.time}</td>
                  <td className="py-4 px-6 font-bold text-[#1E2D50]">{log.user}</td>
                  <td className="py-4 px-6 font-semibold text-[#5A6A85]">{log.action}</td>
                  <td className="py-4 px-6 font-mono text-xs text-[#2563EB]">{log.ip}</td>
                  <td className="py-4 px-6">
                    <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
                      log.severity === "Info" ? "bg-blue-50 text-[#2563EB]" :
                      log.severity === "Success" ? "bg-emerald-50 text-emerald-600" :
                      log.severity === "Warning" ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-500"
                    }`}>
                      {log.severity}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
