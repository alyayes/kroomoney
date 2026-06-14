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
    
    if (!colNames.includes('foto_profil')) {
      await connection.execute("ALTER TABLE pengguna ADD COLUMN foto_profil LONGTEXT");
      console.log("Column 'foto_profil' added successfully.");
    } else {
      console.log("Column 'foto_profil' already exists.");
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
alterTable();
