import SettingModel from '../models/settingModel.js';
import TransactionModel from '../models/transactionModel.js';

// Get all system settings mapped as a key-value object
export const getSystemSettings = async (req, res) => {
  try {
    const rows = await SettingModel.findAll();
    const settingsObj = {};
    
    rows.forEach(row => {
      settingsObj[row.setting_key] = {
        value: row.setting_value,
        model: row.gemini_model_version,
        temperature: row.gemini_temperature,
        updatedAt: row.updated_at
      };
    });

    return res.status(200).json({
      status: 'success',
      data: settingsObj
    });
  } catch (err) {
    console.error('Get system settings error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal memuat pengaturan sistem.'
    });
  }
};

// Update global setting keys
export const updateSystemSettings = async (req, res) => {
  try {
    const { settings } = req.body; // Expecting an array: [{ key, value, model, temperature }]

    if (!settings || !Array.isArray(settings)) {
      return res.status(400).json({
        status: 'error',
        message: 'Format payload tidak valid! Butuh array data settings.'
      });
    }

    const now = new Date();

    for (const setting of settings) {
      const { key, value, model, temperature } = setting;
      
      // Upsert setting using SettingModel
      await SettingModel.upsert({
        key,
        value,
        model,
        temperature,
        now
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Pengaturan sistem berhasil diperbarui secara dinamis!'
    });

  } catch (err) {
    console.error('Update system settings error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal memperbarui pengaturan sistem.'
    });
  }
};

// Generate financial AI insight based on dynamic settings & transactions data
export const getAiInsights = async (req, res) => {
  try {
    // 1. Fetch Gemini settings from database
    const geminiSetting = await SettingModel.findByKey('gemini_api_key');
    
    if (!geminiSetting || !geminiSetting.setting_value) {
      return res.status(200).json({
        status: 'success',
        data: 'Silakan atur Google Gemini API Key Anda di panel Admin untuk mengaktifkan asisten AI KroomBox secara dinamis.'
      });
    }

    const apiKey = geminiSetting.setting_value;
    const model = geminiSetting.gemini_model_version || 'gemini-1.5-flash';
    const temp = geminiSetting.gemini_temperature !== undefined ? geminiSetting.gemini_temperature : 0.2;

    // 2. Fetch all transactions (transaksi) joined with customer names
    const transactions = await TransactionModel.findAll();

    if (transactions.length === 0) {
      return res.status(200).json({
        status: 'success',
        data: 'Halo! Belum ada transaksi pembayaran masuk tercatat untuk dianalisis oleh AI KroomBox.'
      });
    }

    // 3. Compile prompt
    const prompt = `Anda adalah asisten keuangan AI untuk KroomBox. 
Berikut adalah rangkuman data pembayaran masuk dari pelanggan hosting:
${JSON.stringify(transactions.slice(0, 10), null, 2)}

Berdasarkan data di atas, berikan 1 paragraf analisis keuangan yang singkat, padat, dan memotivasi untuk bendahara. 
Gunakan bahasa Indonesia yang kasual tapi profesional. Jangan gunakan markdown formatting (seperti bintang tebal atau bullet points), hanya teks kutipan dalam 1 paragraf pendek saja (maksimal 3 kalimat).`;

    // 4. Hit Gemini developer API via native fetch
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: temp }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API returned error status:', response.status, errorText);
      return res.status(200).json({
        status: 'success',
        data: 'Gagal terhubung dengan layanan Google Gemini AI. Pastikan API Key Anda aktif dan valid.'
      });
    }

    const result = await response.json();
    const aiText = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 
                   'Google Gemini AI tidak menghasilkan respons. Coba sesuaikan tingkat kreativitas (temperature) di pengaturan.';

    return res.status(200).json({
      status: 'success',
      data: aiText
    });

  } catch (err) {
    console.error('AI Insights generation error:', err);
    return res.status(200).json({
      status: 'success',
      data: 'Maaf, terjadi kesalahan sistem saat memproses AI Insights Anda.'
    });
  }
};
