const fs = require('fs');
const path = require('path');
const db = require('./database'); // Sesuaikan jalur file koneksi database Anda jika berbeda

async function initializeDatabase() {
  try {
    // Cari letak file schema.sql (asumsi berada di root proyek atau folder src/config)
    // Sesuaikan path jika file schema.sql Anda berada di tempat lain
    const schemaPath = path.resolve(__dirname, '../../schema.sql'); 

    if (!fs.existsSync(schemaPath)) {
      console.log('⚠️ File schema.sql tidak ditemukan, melewati inisialisasi otomatis.');
      return;
    }

    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // Pisahkan query berdasarkan titik koma (;) agar bisa dieksekusi satu per satu
    const queries = schemaSql
      .split(';')
      .map(q => q.trim())
      .filter(q => q.length > 0);

    console.log('🔄 Memulai inisialisasi tabel database dari schema.sql...');

    for (let query of queries) {
      await db.query(query);
    }

    console.log('✅ Semua tabel dari schema.sql berhasil dibuat/diverifikasi!');
  } catch (error) {
    console.error('❌ Gagal menginisialisasi database dari schema.sql:', error.message);
  }
}

module.exports = initializeDatabase;