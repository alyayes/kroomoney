/**
 * apiAuth.js — Middleware autentikasi untuk endpoint /api/v1/*
 * 
 * Mendukung 2 mode:
 * 1. Bearer Token (JWT) — untuk request API setelah auth
 * 2. API Key (header X-API-Key) — untuk identifikasi client tanpa token
 */

import jwt from 'jsonwebtoken';
import ApiClientModel from '../models/apiClientModel.js';
import ApiTokenModel from '../models/apiTokenModel.js';
import { pool } from '../config/db.js';

const API_JWT_SECRET = process.env.API_JWT_SECRET || process.env.JWT_SECRET || 'kroombox_api_secret_2026';

/**
 * Middleware: Verify Bearer Token (JWT) dari API client
 * Menyimpan req.apiClient = { id, client_name, client_code, ... }
 */
export const verifyApiToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      status: 'error',
      code: 'MISSING_TOKEN',
      message: 'Authorization header dengan Bearer token diperlukan.'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verify JWT
    const decoded = jwt.verify(token, API_JWT_SECRET);

    // Check token belum di-revoke
    const tokenRecord = await ApiTokenModel.findByToken(token);
    if (!tokenRecord) {
      return res.status(401).json({
        status: 'error',
        code: 'TOKEN_INVALID',
        message: 'Token tidak valid atau sudah expired/revoked.'
      });
    }

    // Get client data
    const client = await ApiClientModel.findById(decoded.client_id);
    if (!client || !client.is_active) {
      return res.status(401).json({
        status: 'error',
        code: 'CLIENT_INACTIVE',
        message: 'API client tidak aktif atau tidak ditemukan.'
      });
    }

    // IP Whitelist check (jika dikonfigurasi)
    if (client.allowed_ips) {
      const requestIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
      const allowedList = client.allowed_ips.split(',').map(ip => ip.trim());
      const clientIp = requestIp.replace('::ffff:', '');
      if (!allowedList.includes(clientIp) && !allowedList.includes('*')) {
        return res.status(403).json({
          status: 'error',
          code: 'IP_NOT_ALLOWED',
          message: `IP ${clientIp} tidak diizinkan untuk client ini.`
        });
      }
    }

    req.apiClient = client;
    req.apiTokenId = tokenRecord.id;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        code: 'TOKEN_EXPIRED',
        message: 'Token sudah expired. Silakan request token baru.'
      });
    }
    return res.status(401).json({
      status: 'error',
      code: 'TOKEN_INVALID',
      message: 'Token tidak valid.'
    });
  }
};

/**
 * Middleware: Verify HMAC Signature (optional, diaktifkan per-route)
 * Header: X-Signature = HMAC-SHA256(request_body, api_secret)
 */
export const verifySignature = async (req, res, next) => {
  const signature = req.headers['x-signature'];

  // Signature opsional — skip jika tidak ada
  if (!signature) {
    return next();
  }

  if (!req.apiClient) {
    return res.status(401).json({
      status: 'error',
      code: 'AUTH_REQUIRED',
      message: 'Autentikasi token diperlukan sebelum verifikasi signature.'
    });
  }

  try {
    const isValid = ApiClientModel.validateSignature(req.body, req.apiClient.api_secret, signature);
    if (!isValid) {
      return res.status(401).json({
        status: 'error',
        code: 'INVALID_SIGNATURE',
        message: 'HMAC signature tidak valid. Pastikan body dan secret benar.'
      });
    }
    next();
  } catch (err) {
    return res.status(401).json({
      status: 'error',
      code: 'SIGNATURE_ERROR',
      message: 'Error saat memverifikasi signature.'
    });
  }
};

/**
 * Middleware: Log API request ke api_request_log
 */
export const logApiRequest = async (req, res, next) => {
  const startTime = Date.now();

  // Intercept response finish untuk log response status
  const originalSend = res.send;
  res.send = function (body) {
    const duration = Date.now() - startTime;
    // Fire-and-forget logging
    pool.query(
      `INSERT INTO api_request_log (client_id, method, endpoint, request_body, response_status, ip_address, user_agent, duration_ms)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.apiClient?.id || null,
        req.method,
        req.originalUrl,
        req.method !== 'GET' ? JSON.stringify(req.body).substring(0, 2000) : null,
        res.statusCode,
        req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1',
        (req.headers['user-agent'] || '').substring(0, 500),
        duration
      ]
    ).catch(() => {}); // silently ignore log errors
    return originalSend.call(this, body);
  };

  next();
};

/**
 * Helper: Generate JWT token untuk API client
 */
export function generateApiJwt(client_id, client_code) {
  return jwt.sign(
    { client_id, client_code, type: 'api_client' },
    API_JWT_SECRET,
    { expiresIn: '24h' }
  );
}

export { API_JWT_SECRET };
