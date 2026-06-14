/**
 * Google Apps Script for Google Sheets Integration
 * 
 * 1. Buka Google Sheets Anda.
 * 2. Klik 'Extensions' > 'Apps Script'.
 * 3. Hapus kode bawaan dan tempel kode di bawah ini.
 * 4. Klik 'Deploy' > 'New Deployment'.
 * 5. Pilih 'Web App', 'Execute as' > Me, 'Who has access' > Anyone.
 * 6. Klik Deploy dan salin URL Web App yang diberikan.
 */

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    
    // Header check (if sheet is empty)
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "ID", "Tanggal", "User_ID", "Tipe", "Nama Pembeli", "Kuantitas", "Jumlah", "Notes"
      ]);
    }
    
    // Append the transaction data
    sheet.appendRow([
      data.id,
      data.tanggal,
      data.userId,
      data.tipe,
      data.namaPembeli,
      data.kuantitas,
      data.jumlah,
      data.notes
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({
      "status": "success",
      "message": "Data saved successfully"
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      "status": "error",
      "message": err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Optional: doGet to show simple status
function doGet() {
  return ContentService.createTextOutput("KroomBox API is active. Use POST to save data.");
}
