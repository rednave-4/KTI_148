const app = require('./app');
const pool = require('./config/database');
const initializeDatabase = require('./config/initDb'); // Import inisialisasi database otomatis
require('dotenv').config();

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Berhasil terhubung ke MySQL');
    connection.release();

    // Jalankan pembuatan tabel otomatis dari schema.sql sebelum server mendengarkan request
    await initializeDatabase();

    app.listen(PORT, () => {
      console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Gagal terhubung ke database:');
    console.error(error.message);
    console.log('\nPastikan:');
    console.log('1. MySQL sudah berjalan');
    console.log('2. Database sudah dibuat');
    console.log('3. Kredensial di environment variables sudah benar');
    process.exit(1);
  }
}

startServer();