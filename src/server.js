const app = require('./app');
const pool = require('./config/database');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Berhasil terhubung ke MySQL');
    connection.release();

    app.listen(PORT, () => {
      console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Gagal terhubung ke database:');
    console.error(error.message);
    console.log('\nPastikan:');
    console.log('1. MySQL sudah berjalan');
    console.log('2. Database "school_information" sudah dibuat');
    console.log('3. Kredensial di file .env sudah benar');
    process.exit(1);
  }
}

startServer();