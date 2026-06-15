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
import ExtTransactionModel from '../models/extTransactionModel.js';
import CallbackLogModel from '../models/callbackLogModel.js';

/**
 * Kirim callback ke source application
 * @param {Object} params
 * @param {number} params.extTransactionId - ID dari ext_transactions
 * @param {string} params.event - Event type (transaction.verified, dll)
 * @param {Object} params.extraData - Data tambahan (invoice_number, receipt_number, dll)
 */
export async function sendCallback({ extTransactionId, event, extraData = {} }) {
  try {
    const extTrx = await ExtTransactionModel.findById(extTransactionId);
    if (!extTrx) {
      console.warn(`[Callback] ext_transaction #${extTransactionId} not found`);
      return null;
    }

    const client = await ApiClientModel.findById(extTrx.source_client_id);
    if (!client || !client.callback_url) {
      // Client tidak punya callback URL — skip silently
      return null;
    }

    // Build payload
    const payload = {
      event,
      external_transaction_id: extTrx.external_transaction_id,
      status: extTrx.status,
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
      logId = await CallbackLogModel.create({
        ext_transaction_id: extTransactionId,
        client_id: client.id,
        callback_url: client.callback_url,
        event_type: event,
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
        await CallbackLogModel.updateResult(logId, {
          http_status: response.status,
          response_body: responseText.substring(0, 2000),
          status: 'success'
        });
        await ExtTransactionModel.markCallbackSent(extTransactionId);
        console.log(`✅ [Callback] ${event} → ${client.callback_url} (${response.status})`);
      } else {
        await CallbackLogModel.updateResult(logId, {
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
        await CallbackLogModel.updateResult(logId, {
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
export async function onTransactionVerified(extTransactionId, verifiedBy) {
  return sendCallback({
    extTransactionId,
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
export async function onInvoiceGenerated(extTransactionId, invoiceNumber, invoiceTotal, dueDate) {
  return sendCallback({
    extTransactionId,
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
export async function onTransactionPaid(extTransactionId, receiptNumber) {
  return sendCallback({
    extTransactionId,
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
export async function onTransactionCancelled(extTransactionId, reason) {
  return sendCallback({
    extTransactionId,
    event: 'transaction.cancelled',
    extraData: { reason }
  });
}
