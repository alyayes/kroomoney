import { pool } from '../config/db.js';

class EmailTemplateModel {
  // Get all templates
  static async findAll() {
    const [rows] = await pool.query(
      'SELECT * FROM email_templates ORDER BY tipe_reminder, nama_template'
    );
    return rows;
  }

  // Get template by id
  static async findById(id) {
    const [rows] = await pool.query('SELECT * FROM email_templates WHERE id = ?', [id]);
    return rows[0] || null;
  }

  // Get default template for a tipe_reminder
  static async findDefault(tipe_reminder) {
    const [rows] = await pool.query(
      'SELECT * FROM email_templates WHERE tipe_reminder = ? AND is_default = 1 AND is_active = 1 LIMIT 1',
      [tipe_reminder]
    );
    // Fallback: get any active template for this type
    if (rows.length > 0) return rows[0];
    const [fallback] = await pool.query(
      'SELECT * FROM email_templates WHERE tipe_reminder = ? AND is_active = 1 LIMIT 1',
      [tipe_reminder]
    );
    return fallback[0] || null;
  }

  // Create template
  static async create({ nama_template, tipe_reminder, subject, body_html, body_text, is_active, is_default, created_by }) {
    // If is_default=true, unset other defaults for same type
    if (is_default) {
      await pool.query(
        'UPDATE email_templates SET is_default = 0 WHERE tipe_reminder = ?',
        [tipe_reminder]
      );
    }
    const [result] = await pool.query(
      `INSERT INTO email_templates (nama_template, tipe_reminder, subject, body_html, body_text, is_active, is_default, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [nama_template, tipe_reminder, subject, body_html, body_text || null, is_active ?? 1, is_default ?? 0, created_by || null]
    );
    return result.insertId;
  }

  // Update template
  static async update(id, { nama_template, tipe_reminder, subject, body_html, body_text, is_active, is_default }) {
    if (is_default) {
      // Get current tipe for this template
      const tpl = await EmailTemplateModel.findById(id);
      if (tpl) {
        await pool.query('UPDATE email_templates SET is_default = 0 WHERE tipe_reminder = ?', [tpl.tipe_reminder]);
      }
    }
    const fields = [];
    const values = [];
    const map = { nama_template, tipe_reminder, subject, body_html, body_text, is_active, is_default };
    for (const [k, v] of Object.entries(map)) {
      if (v !== undefined) { fields.push(`${k} = ?`); values.push(v); }
    }
    if (fields.length === 0) return;
    values.push(id);
    await pool.query(`UPDATE email_templates SET ${fields.join(', ')} WHERE id = ?`, values);
  }

  // Delete template
  static async delete(id) {
    await pool.query('DELETE FROM email_templates WHERE id = ?', [id]);
  }

  // Render template — replace all {{placeholder}} with actual values
  static render(template, data) {
    let subject = template.subject;
    let bodyHtml = template.body_html;
    let bodyText = template.body_text || '';

    const replacements = {
      customer_name: data.customer_name || '-',
      invoice_number: data.invoice_number || '-',
      amount: data.amount ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(data.amount) : '-',
      due_date: data.due_date ? new Date(data.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-',
      days_remaining: data.days_remaining !== undefined ? String(data.days_remaining) : '-',
      payment_link: data.payment_link || '#',
      company_name: data.company_name || 'Kroomoney',
      support_email: data.support_email || 'support@kroomoney.com',
      invoice_status: data.invoice_status || '-',
    };

    for (const [key, value] of Object.entries(replacements)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      subject = subject.replace(regex, value);
      bodyHtml = bodyHtml.replace(regex, value);
      bodyText = bodyText.replace(regex, value);
    }

    return { subject, bodyHtml, bodyText };
  }
}

export default EmailTemplateModel;
