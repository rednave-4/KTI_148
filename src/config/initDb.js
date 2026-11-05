const fs = require('fs');
const path = require('path');
const db = require('./database');

async function initializeDatabase() {
  try {
    // Sesuaikan path karena schema.sql berada di dalam folder database/schema.sql
    const schemaPath = path.resolve(__dirname, '../../database/schema.sql'); 

    if (!fs.existsSync(schemaPath)) {
      console.log('⚠️ File schema.sql tidak ditemukan di folder database/, melewati inisialisasi.');
      return;
    }

    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // Pisahkan query berdasarkan titik koma (;)
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