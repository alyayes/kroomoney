import ApiClientModel from '../../../models/apiClientModel.js';
import { generateApiJwt } from '../../../middleware/apiAuth.js';

class AuthApiController {
  static async getToken(req, res) {
    const { api_key, api_secret } = req.body;

    if (!api_key || !api_secret) {
      return res.status(400).json({
        status: 'error',
        code: 'MISSING_CREDENTIALS',
        message: 'api_key dan api_secret diperlukan.'
      });
    }

    try {
      // Find client by API key
      const client = await ApiClientModel.findByApiKey(api_key);

      // Verify client and secret
      if (!client || client.api_secret !== api_secret) {
        return res.status(401).json({
          status: 'error',
          code: 'INVALID_CREDENTIALS',
          message: 'api_key atau api_secret tidak valid.'
        });
      }

      // Generate token
      const token = generateApiJwt(client.id, client.client_code);
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours expiry

      return res.status(200).json({
        status: 'success',
        message: 'Token berhasil dibuat.',
        data: {
          token,
          expires_at: expiresAt.toISOString(),
          client: {
            name: client.client_name,
            code: client.client_code
          }
        }
      });
    } catch (err) {
      console.error('Error in getToken:', err);
      return res.status(500).json({
        status: 'error',
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Terjadi kesalahan pada server.'
      });
    }
  }
}

export default AuthApiController;
