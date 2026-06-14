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
    
    if (!colNames.includes('role')) {
      await connection.execute("ALTER TABLE pengguna ADD COLUMN role VARCHAR(50) DEFAULT 'Treasurer' AFTER kata_sandi");
      console.log("Column 'role' added successfully.");
    } else {
      console.log("Column 'role' already exists.");
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
alterTable();
