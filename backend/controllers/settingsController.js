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
    let apiKey = geminiSetting?.setting_value || process.env.GEMINI_API_KEY;

    const model = geminiSetting?.gemini_model_version || 'gemini-1.5-flash';
    const temp = geminiSetting?.gemini_temperature !== undefined ? geminiSetting.gemini_temperature : 0.2;

    // 2. Fetch all transactions (transaksi) joined with customer names
    const transactions = await TransactionModel.findAll();

    if (transactions.length === 0) {
      return res.status(200).json({
        status: 'success',
        data: 'Halo! Belum ada transaksi tercatat untuk dianalisis oleh AI KroomBox.'
      });
    }

    // Calculate dynamic totals
    let totalDebit = 0;
    let totalKredit = 0;

    const formattedTransactions = transactions.map(t => {
      const isExpense = t.tipe_transaksi === 'Pengeluaran' || t.tipe_transaksi === 'pengeluaran';
      let parsedItems = t.items;
      if (typeof parsedItems === 'string') {
        try { parsedItems = JSON.parse(parsedItems); } catch (e) { parsedItems = null; }
      }
      
      const base = parsedItems && parsedItems.length > 0 ? t.nominal_transfer : t.nominal_transfer * (t.kuantitas || 1);
      const total = Math.max(0, base - (t.diskon || 0));

      if (isExpense) {
        totalKredit += total;
      } else {
        totalDebit += total;
      }

      // Safely parse date
      const d = new Date(t.tanggal_bayar);
      const dateString = isNaN(d.getTime()) ? new Date().toISOString().split('T')[0] : d.toISOString().split('T')[0];

      return {
        tanggal: dateString,
        keterangan: t.nama_pelanggan || t.nama_manual || 'Input Manual',
        tipe: isExpense ? 'Pengeluaran (Kredit)' : 'Pemasukan (Debit)',
        total: total,
        notes: t.notes || ''
      };
    });

    const balance = totalDebit - totalKredit;
    const financialStatus = balance >= 0 ? 'Surplus (Untung)' : 'Defisit (Rugi / Tidak Sehat)';

    // If API key is not set, return a realistic simulated analysis
    if (!apiKey || apiKey.trim() === '') {
      const formatRupiah = (num) => "Rp " + num.toLocaleString("id-ID");
      const diff = totalDebit - totalKredit;
      let mockAnalysis = "";
      if (totalKredit > totalDebit) {
        mockAnalysis = `Analisis Keuangan KroomBox mendeteksi terjadinya kerugian! Total pengeluaran (${formatRupiah(totalKredit)}) melebihi total pemasukan (${formatRupiah(totalDebit)}) dengan defisit sebesar ${formatRupiah(Math.abs(diff))}. Langkah rekomendasi bendahara: segera tunda pengeluaran non-esensial, lakukan audit biaya operasional server/hosting, serta tindak lanjuti tagihan pelanggan yang statusnya masih pending.`;
      } else {
        mockAnalysis = `Analisis Keuangan KroomBox mendeteksi arus kas terpantau sehat! Total pemasukan (${formatRupiah(totalDebit)}) melebihi pengeluaran (${formatRupiah(totalKredit)}) dengan surplus sebesar ${formatRupiah(diff)}. Langkah rekomendasi bendahara: pertahankan efisiensi biaya saat ini, alokasikan surplus dana ke kas cadangan (dana darurat), dan investasikan untuk peningkatan kualitas layanan hosting.`;
      }
      return res.status(200).json({
        status: 'success',
        data: mockAnalysis
      });
    }

    // 3. Compile prompt
    const prompt = `Anda adalah asisten keuangan AI untuk KroomBox (aplikasi manajemen keuangan bendahara startup hosting).
Berikut adalah rangkuman data keuangan startup saat ini:
- Total Pemasukan (Debit): Rp ${totalDebit.toLocaleString('id-ID')}
- Total Pengeluaran (Kredit): Rp ${totalKredit.toLocaleString('id-ID')}
- Saldo Bersih: Rp ${balance.toLocaleString('id-ID')} (${financialStatus})

Rincian Transaksi Terbaru (Maksimal 10):
${JSON.stringify(formattedTransactions.slice(0, 10), null, 2)}

Berdasarkan data keuangan di atas, tolong berikan analisis singkat (maksimal 3 kalimat) dalam 1 paragraf tanpa markdown formatting (jangan gunakan asterisk, bullet points, atau cetak tebal).
PENTING: Jika pengeluaran (Kredit) lebih besar daripada pemasukan (Debit), jelaskan bahwa ini adalah kondisi defisit/kerugian yang kurang baik, dan berikan langkah konkret segera yang harus dilakukan bendahara (seperti menekan biaya operasional server/hosting, menagih tagihan/piutang yang tertunda dari pelanggan, atau membatasi pengeluaran non-esensial).
Gunakan bahasa Indonesia yang kasual, santun, tapi tetap profesional dan memotivasi untuk bendahara.`;

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
