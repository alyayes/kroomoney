import mysql from 'mysql2/promise';

async function alterTable() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'kroomoney'
    });
    
    // Check if columns exist before dropping to avoid errors if already dropped
    const [columns] = await connection.execute("SHOW COLUMNS FROM pengguna");
    const colNames = columns.map(c => c.Field);
    
    let alterQuery = "ALTER TABLE pengguna ";
    let drops = [];
    if (colNames.includes('nama_startup')) {
      drops.push("DROP COLUMN nama_startup");
    }
    if (colNames.includes('alamat_startup')) {
      drops.push("DROP COLUMN alamat_startup");
    }
    
    if (drops.length > 0) {
      alterQuery += drops.join(", ");
      await connection.execute(alterQuery);
      console.log("Columns dropped successfully.");
    } else {
      console.log("Columns already dropped.");
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
alterTable();
