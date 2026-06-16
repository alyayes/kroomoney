/**
 * reminderService.js
 * Core reminder logic for V7 (Single reminders table):
 *   1. detectDueInvoices()  — temukan invoice mendekati/melewati jatuh tempo
 *   2. scheduleJobs()       — buat reminders job (deduplication via UNIQUE KEY)
 *   3. processJobs()        — kirim email untuk pending jobs
 *   4. run()                — full cycle: detect → schedule → process
 *   5. preview()            — dry-run tanpa pengiriman
 *   6. sendManual()         — trigger manual untuk satu invoice
 */

import { pool } from '../config/db.js';
import { sendEmail } from './emailService.js';
import ReminderModel from '../models/reminderModel.js';

// Status invoice yang boleh mendapat reminder
const ALLOWED_STATUSES = ['draft', 'terkirim', 'overdue'];

// Default template HTML untuk setiap tipe
const DEFAULT_TEMPLATES = {
  H30: {
    subject: '[Kroomoney] Pengingat Tagihan — {{days_remaining}} Hari Lagi',
    body_html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#2563eb">Pengingat Tagihan</h2>
      <p>Yth. <b>{{customer_name}}</b>,</p>
      <p>Kami ingin mengingatkan bahwa Invoice <b>{{invoice_number}}</b> senilai <b>{{amount}}</b> akan jatuh tempo pada <b>{{due_date}}</b> (<b>{{days_remaining}} hari</b> lagi).</p>
      <p>Mohon segera lakukan pembayaran sebelum jatuh tempo untuk menghindari gangguan layanan.</p>
      <p>Terima kasih atas kepercayaan Anda menggunakan layanan <b>{{company_name}}</b>.</p>
      <p style="color:#6b7280;font-size:12px">Email ini dikirim otomatis. Hubungi <a href="mailto:{{support_email}}">{{support_email}}</a> jika ada pertanyaan.</p>
    </div>`
  },
  H7: {
    subject: '[Kroomoney] ⚠️ Tagihan Jatuh Tempo {{days_remaining}} Hari Lagi — {{invoice_number}}',
    body_html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#f59e0b">⚠️ Tagihan Segera Jatuh Tempo</h2>
      <p>Yth. <b>{{customer_name}}</b>,</p>
      <p>Invoice <b>{{invoice_number}}</b> senilai <b>{{amount}}</b> akan jatuh tempo pada <b>{{due_date}}</b> — hanya <b>{{days_remaining}} hari</b> lagi.</p>
      <p>Segera lakukan pembayaran untuk menghindari keterlambatan dan gangguan layanan hosting Anda.</p>
      <p>Terima kasih — <b>{{company_name}}</b>.</p>
      <p style="color:#6b7280;font-size:12px">Email otomatis. Balas ke <a href="mailto:{{support_email}}">{{support_email}}</a> untuk bantuan.</p>
    </div>`
  },
  H1: {
    subject: '[Kroomoney] 🔴 BESOK Jatuh Tempo — Invoice {{invoice_number}}',
    body_html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#dc2626">🔴 Tagihan Jatuh Tempo Besok!</h2>
      <p>Yth. <b>{{customer_name}}</b>,</p>
      <p>Ini adalah pengingat terakhir. Invoice <b>{{invoice_number}}</b> senilai <b>{{amount}}</b> akan jatuh tempo <b>BESOK, {{due_date}}</b>.</p>
      <p>Segera lakukan pembayaran hari ini untuk menghindari suspend layanan.</p>
      <p>— Tim <b>{{company_name}}</b></p>
      <p style="color:#6b7280;font-size:12px">Butuh bantuan? <a href="mailto:{{support_email}}">{{support_email}}</a></p>
    </div>`
  },
  overdue: {
    subject: '[Kroomoney] ❌ TAGIHAN OVERDUE — Invoice {{invoice_number}} Telah Melewati Jatuh Tempo',
    body_html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#dc2626">❌ Tagihan Overdue</h2>
      <p>Yth. <b>{{customer_name}}</b>,</p>
      <p>Invoice <b>{{invoice_number}}</b> senilai <b>{{amount}}</b> telah melewati jatuh tempo pada <b>{{due_date}}</b>.</p>
      <p>Layanan hosting Anda berisiko dinonaktifkan. Harap segera lakukan pembayaran atau hubungi tim kami.</p>
      <p>— Tim <b>{{company_name}}</b></p>
      <p style="color:#6b7280;font-size:12px"><a href="mailto:{{support_email}}">{{support_email}}</a></p>
    </div>`
  }
};

/**
 * Hitung selisih hari antara dua tanggal (positif = masih akan datang, negatif = sudah lewat)
 */
function diffDays(targetDate) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - now) / (1000 * 60 * 60 * 24));
}

/**
 * Tentukan tipe reminder berdasarkan selisih hari
 */
function getTipeReminder(days) {
  if (days <= 0) return 'overdue';
  if (days === 1) return 'H1';
  if (days <= 7) return 'H7';
  if (days <= 30) return 'H30';
  return null; // Belum waktunya kirim
}

/**
 * Ambil semua invoice aktif (bukan paid/dibatalkan) beserta data customer & email
 */
async function getActiveInvoices() {
  const [rows] = await pool.query(
    `SELECT 
       i.id, i.invoice_number AS nomor_invoice, i.transaction_id AS transaksi_id, i.customer_id AS pelanggan_id, i.nama_manual, i.no_wa_manual,
       i.total, i.status AS status_invoice, i.due_date AS tanggal_jatuh_tempo,
       c.name AS nama_pelanggan, c.phone AS no_whatsapp,
       t.no_whatsapp_manual AS t_wa_manual,
       t.nama_manual AS t_nama_manual
     FROM invoices i
     LEFT JOIN customers c ON i.customer_id = c.id
     LEFT JOIN transactions t ON i.transaction_id = t.id
     WHERE i.status NOT IN ('dibayar', 'dibatalkan') AND i.deleted_at IS NULL
     ORDER BY i.due_date ASC`
  );
  return rows;
}

/**
 * Ambil email customer
 */
async function getCustomerEmail(pelanggan_id) {
  if (!pelanggan_id) return null;
  const [rows] = await pool.query(
    'SELECT email FROM customers WHERE id = ? AND deleted_at IS NULL LIMIT 1',
    [pelanggan_id]
  );
  return rows[0]?.email || null;
}

/**
 * Render email dari default template
 */
async function renderEmail(tipeReminder, data) {
  const def = DEFAULT_TEMPLATES[tipeReminder] || DEFAULT_TEMPLATES.H7;
  let subject = def.subject;
  let bodyHtml = def.body_html;

  for (const [key, value] of Object.entries(data)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    const safeValue = value || '';
    subject = subject.replace(regex, safeValue);
    bodyHtml = bodyHtml.replace(regex, safeValue);
  }

  return { subject, bodyHtml, bodyText: null };
}

/**
 * DETECT + SCHEDULE: Temukan invoice yang perlu diremind dan buat job-nya
 */
export async function scheduleReminders() {
  // Ambil config scheduler
  const [cfgRows] = await pool.query("SELECT setting_key, setting_value FROM settings WHERE setting_group = 'scheduler'");
  const cfg = {
    reminder_h30_enabled: true,
    reminder_h7_enabled: true,
    reminder_h1_enabled: true,
    reminder_overdue_enabled: true,
  };
  cfgRows.forEach(r => {
    cfg[r.setting_key] = r.setting_value === 'true' || r.setting_value === '1';
  });

  const invoices = await getActiveInvoices();

  let scheduled = 0;
  let skipped = 0;
  const details = [];

  for (const inv of invoices) {
    const days = diffDays(inv.tanggal_jatuh_tempo);
    const tipe = getTipeReminder(days);

    if (!tipe) { skipped++; continue; }
    if (tipe === 'H30' && !cfg.reminder_h30_enabled) { skipped++; continue; }
    if (tipe === 'H7' && !cfg.reminder_h7_enabled) { skipped++; continue; }
    if (tipe === 'H1' && !cfg.reminder_h1_enabled) { skipped++; continue; }
    if (tipe === 'overdue' && !cfg.reminder_overdue_enabled) { skipped++; continue; }

    // Cek duplikat (sudah ada reminder sent/pending untuk tipe ini)
    const existing = await ReminderModel.exists(inv.id, tipe, 'email');
    if (existing && (existing.status === 'sent' || existing.status === 'pending')) {
      skipped++;
      continue;
    }

    // Tentukan email tujuan
    const email = await getCustomerEmail(inv.pelanggan_id);

    await ReminderModel.create({
      invoice_id: inv.id,
      customer_id: inv.pelanggan_id || null,
      recipient_contact: email,
      reminder_type: tipe,
      channel: 'email',
      scheduled_at: new Date(),
    });

    scheduled++;
    details.push({
      invoice_id: inv.id,
      nomor_invoice: inv.nomor_invoice,
      customer: inv.nama_pelanggan || inv.nama_manual || 'Manual',
      tipe,
      days,
      jatuh_tempo: inv.tanggal_jatuh_tempo,
    });
  }

  return { scheduled, skipped, total_invoices: invoices.length, details };
}

/**
 * PROCESS JOBS: Kirim email untuk semua pending jobs
 */
export async function processReminderJobs() {
  const pendingJobs = await ReminderModel.findPending();
  const retryJobs = await ReminderModel.findRetryable();
  const jobs = [...pendingJobs, ...retryJobs];

  let sent = 0, failed = 0, skipped = 0;
  const results = [];

  // Ambil config nama perusahaan
  const [companyRows] = await pool.query(
    "SELECT setting_value FROM settings WHERE setting_key = 'smtp_from_name' LIMIT 1"
  );
  const companyName = companyRows[0]?.setting_value || 'Kroomoney';

  const [supportRows] = await pool.query(
    "SELECT setting_value FROM settings WHERE setting_key = 'smtp_user' LIMIT 1"
  );
  const supportEmail = supportRows[0]?.setting_value || 'support@kroomoney.com';

  for (const job of jobs) {
    // Skip jika invoice sudah dibayar/dibatalkan
    if (['dibayar', 'dibatalkan'].includes(job.status_invoice)) {
      await ReminderModel.updateStatus(job.id, 'skipped', {});
      skipped++;
      continue;
    }

    // Skip jika tidak ada email tujuan
    if (!job.email_tujuan) {
      await ReminderModel.updateStatus(job.id, 'skipped', { error_message: 'Tidak ada alamat email tujuan' });
      skipped++;
      results.push({ job_id: job.id, status: 'skipped', reason: 'no_email' });
      continue;
    }

    // Lock job untuk processing
    const locked = await ReminderModel.markProcessing(job.id);
    if (!locked) continue; // Sudah diproses di run lain

    try {
      const days = diffDays(job.tanggal_jatuh_tempo);
      const rendered = await renderEmail(job.tipe_reminder, {
        customer_name: job.nama_pelanggan || job.nama_manual || 'Pelanggan',
        invoice_number: job.nomor_invoice,
        amount: job.total,
        due_date: job.tanggal_jatuh_tempo,
        days_remaining: Math.max(0, days),
        company_name: companyName,
        support_email: supportEmail,
      });

      const info = await sendEmail({
        to: job.email_tujuan,
        subject: rendered.subject,
        html: rendered.bodyHtml,
        text: rendered.bodyText,
      });

      // Update job sebagai sent
      await ReminderModel.updateStatus(job.id, 'sent', { 
        sent_at: new Date(),
        gateway_response: JSON.stringify({ messageId: info.messageId, accepted: info.accepted }),
        message_content: rendered.subject
      });

      sent++;
      results.push({ job_id: job.id, status: 'sent', to: job.email_tujuan, messageId: info.messageId });

    } catch (err) {
      await ReminderModel.updateStatus(job.id, 'failed', { error_message: err.message });
      failed++;
      results.push({ job_id: job.id, status: 'failed', error: err.message });
    }
  }

  return { sent, failed, skipped, total_jobs: jobs.length, results };
}

/**
 * FULL CYCLE: schedule + process
 */
export async function runReminderCycle() {
  const scheduleResult = await scheduleReminders();
  const processResult = await processReminderJobs();
  return {
    cycle_at: new Date().toISOString(),
    schedule: scheduleResult,
    process: processResult,
  };
}

/**
 * PREVIEW: Dry-run tanpa pengiriman
 */
export async function previewReminders() {
  const invoices = await getActiveInvoices();
  const preview = [];

  for (const inv of invoices) {
    const days = diffDays(inv.tanggal_jatuh_tempo);
    const tipe = getTipeReminder(days);
    if (!tipe) continue;

    const existing = await ReminderModel.exists(inv.id, tipe, 'email');
    const alreadySent = existing?.status === 'sent';
    const email = await getCustomerEmail(inv.pelanggan_id);

    preview.push({
      invoice_id: inv.id,
      nomor_invoice: inv.nomor_invoice,
      customer: inv.nama_pelanggan || inv.nama_manual || 'Manual',
      email: email || '— tidak ada —',
      status_invoice: inv.status_invoice,
      tipe_reminder: tipe,
      days_remaining: days,
      jatuh_tempo: inv.tanggal_jatuh_tempo,
      will_send: !alreadySent && !!email,
      skip_reason: alreadySent ? 'already_sent' : !email ? 'no_email' : null,
    });
  }

  return preview;
}

/**
 * MANUAL SEND: Kirim reminder langsung ke satu invoice
 */
export async function sendManualReminder({ invoice_id, tipe_reminder, email_tujuan, dikirim_oleh }) {
  // Fetch invoice
  const [invRows] = await pool.query(
    `SELECT i.id, i.invoice_number AS nomor_invoice, i.total, i.status AS status_invoice, i.due_date AS tanggal_jatuh_tempo,
            i.nama_manual, i.customer_id AS pelanggan_id, c.name AS nama_pelanggan 
     FROM invoices i
     LEFT JOIN customers c ON i.customer_id = c.id
     WHERE i.id = ? AND i.deleted_at IS NULL`,
    [invoice_id]
  );
  const inv = invRows[0];
  if (!inv) throw new Error('Invoice tidak ditemukan');
  if (['dibayar', 'dibatalkan'].includes(inv.status_invoice)) {
    throw new Error(`Invoice ${inv.nomor_invoice} sudah ${inv.status_invoice}, tidak perlu reminder.`);
  }

  const days = diffDays(inv.tanggal_jatuh_tempo);
  const [companyRows] = await pool.query("SELECT setting_value FROM settings WHERE setting_key = 'smtp_from_name' LIMIT 1");
  const companyName = companyRows[0]?.setting_value || 'Kroomoney';
  const [supportRows] = await pool.query("SELECT setting_value FROM settings WHERE setting_key = 'smtp_user' LIMIT 1");
  const supportEmail = supportRows[0]?.setting_value || 'support@kroomoney.com';

  const rendered = await renderEmail(tipe_reminder || 'manual', {
    customer_name: inv.nama_pelanggan || inv.nama_manual || 'Pelanggan',
    invoice_number: inv.nomor_invoice,
    amount: inv.total,
    due_date: inv.tanggal_jatuh_tempo,
    days_remaining: Math.max(0, days),
    company_name: companyName,
    support_email: supportEmail,
  });

  const info = await sendEmail({
    to: email_tujuan,
    subject: rendered.subject,
    html: rendered.bodyHtml,
    text: rendered.bodyText,
  });

  // Log to reminders
  const reminderId = await ReminderModel.create({
    invoice_id,
    customer_id: inv.pelanggan_id || null,
    recipient_contact: email_tujuan,
    reminder_type: tipe_reminder || 'manual',
    channel: 'email',
    scheduled_at: new Date(),
    message_content: rendered.subject,
    sent_by: dikirim_oleh
  });
  
  await ReminderModel.updateStatus(reminderId, 'sent', {
    sent_at: new Date(),
    gateway_response: JSON.stringify(info)
  });

  return {
    sent: true,
    to: email_tujuan,
    subject: rendered.subject,
    messageId: info.messageId,
  };
}
