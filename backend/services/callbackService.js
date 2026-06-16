/**
 * callbackService.js — Kirim callback ke aplikasi sumber saat status transaksi berubah
 * 
 * Events:
 *   - transaction.verified   → Bendahara ACC
 *   - invoice.generated      → Invoice diterbitkan
 *   - invoice.sent           → Invoice dikirim ke customer
 *   - transaction.paid       → Pembayaran lunas
 *   - transaction.cancelled  → Transaksi dibatalkan
 */

import crypto from 'crypto';
import ApiClientModel from '../models/apiClientModel.js';
import TransactionModel from '../models/transactionModel.js';
import ApiLogModel from '../models/apiLogModel.js';
import { pool } from '../config/db.js';

/**
 * Kirim callback ke source application
 * @param {Object} params
 * @param {number} params.transactionId - ID dari transactions table
 * @param {string} params.event - Event type (transaction.verified, dll)
 * @param {Object} params.extraData - Data tambahan
 */
export async function sendCallback({ transactionId, event, extraData = {} }) {
  try {
    const trx = await TransactionModel.findById(transactionId);
    if (!trx) {
      console.warn(`[Callback] transaction #${transactionId} not found`);
      return null;
    }

    if (trx.source_type !== 'api' || !trx.api_client_id) {
      // Skip if not api sourced transaction
      return null;
    }

    const client = await ApiClientModel.findById(trx.api_client_id);
    if (!client || !client.callback_url) {
      // Skip if client callback_url is not set
      return null;
    }

    // Map new column states to legacy callback values
    let callbackStatus = 'pending';
    if (event === 'transaction.verified') callbackStatus = 'verified';
    else if (event === 'invoice.generated') callbackStatus = 'invoice_sent';
    else if (event === 'transaction.paid') callbackStatus = 'paid';
    else if (event === 'transaction.cancelled') callbackStatus = 'cancelled';

    // Build payload
    const payload = {
      event,
      external_transaction_id: trx.external_transaction_id,
      status: callbackStatus,
      timestamp: new Date().toISOString(),
      ...extraData
    };

    // Sign payload
    const signature = crypto
      .createHmac('sha256', client.callback_secret || client.api_secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    // POST ke callback URL
    let logId;
    try {
      logId = await ApiLogModel.createCallbackLog({
        ext_transaction_id: transactionId,
        client_id: client.id,
        callback_url: client.callback_url,
        payload,
        status: 'pending'
      });

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch(client.callback_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Callback-Signature': signature,
          'X-Callback-Event': event,
          'User-Agent': 'Kroomoney-Callback/1.0'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeout);

      const responseText = await response.text().catch(() => '');

      if (response.ok) {
        await ApiLogModel.updateCallbackResult(logId, {
          http_status: response.status,
          response_body: responseText.substring(0, 2000),
          status: 'success'
        });
        await pool.query('UPDATE transactions SET callback_sent_at = NOW() WHERE id = ?', [transactionId]);
        console.log(`✅ [Callback] ${event} → ${client.callback_url} (${response.status})`);
      } else {
        await ApiLogModel.updateCallbackResult(logId, {
          http_status: response.status,
          response_body: responseText.substring(0, 2000),
          status: 'failed',
          error_message: `HTTP ${response.status}`
        });
        console.warn(`⚠️ [Callback] ${event} → ${client.callback_url} failed (${response.status})`);
      }

      return { success: response.ok, status: response.status };

    } catch (fetchErr) {
      const errorMsg = fetchErr.name === 'AbortError' ? 'Timeout (10s)' : fetchErr.message;
      if (logId) {
        await ApiLogModel.updateCallbackResult(logId, {
          http_status: 0,
          status: 'failed',
          error_message: errorMsg
        });
      }
      console.error(`❌ [Callback] ${event} → ${client.callback_url} error: ${errorMsg}`);
      return { success: false, error: errorMsg };
    }

  } catch (err) {
    console.error('[Callback] Unexpected error:', err.message);
    return null;
  }
}

/**
 * Helper: Kirim callback saat transaksi diverifikasi (ACC)
 */
export async function onTransactionVerified(transactionId, verifiedBy) {
  return sendCallback({
    transactionId,
    event: 'transaction.verified',
    extraData: {
      verified_by: verifiedBy,
      verified_at: new Date().toISOString()
    }
  });
}

/**
 * Helper: Kirim callback saat invoice diterbitkan
 */
export async function onInvoiceGenerated(transactionId, invoiceNumber, invoiceTotal, dueDate) {
  return sendCallback({
    transactionId,
    event: 'invoice.generated',
    extraData: {
      invoice_number: invoiceNumber,
      invoice_total: invoiceTotal,
      due_date: dueDate
    }
  });
}

/**
 * Helper: Kirim callback saat pembayaran lunas
 */
export async function onTransactionPaid(transactionId, receiptNumber) {
  return sendCallback({
    transactionId,
    event: 'transaction.paid',
    extraData: {
      receipt_number: receiptNumber,
      paid_at: new Date().toISOString()
    }
  });
}

/**
 * Helper: Kirim callback saat transaksi dibatalkan
 */
export async function onTransactionCancelled(transactionId, reason) {
  return sendCallback({
    transactionId,
    event: 'transaction.cancelled',
    extraData: { reason }
  });
}
