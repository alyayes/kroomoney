import mysql from 'mysql2/promise';

async function alterTable() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'kroomoney'
    });
    
    const [columns] = await connection.execute("SHOW COLUMNS FROM pengguna");
    const colNames = columns.map(c => c.Field);
    
    if (!colNames.includes('reset_otp')) {
      await connection.execute("ALTER TABLE pengguna ADD COLUMN reset_otp VARCHAR(255) NULL");
      console.log("Column 'reset_otp' added successfully.");
    }
    
    if (!colNames.includes('reset_otp_expiry')) {
      await connection.execute("ALTER TABLE pengguna ADD COLUMN reset_otp_expiry DATETIME NULL");
      console.log("Column 'reset_otp_expiry' added successfully.");
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
alterTable();
