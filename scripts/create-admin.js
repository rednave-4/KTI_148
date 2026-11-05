/**
 * Script untuk membuat admin pertama
 * Cara menjalankan: npm run create-admin
 */

const argon2 = require('argon2');
const mysql = require('mysql2/promise');
const readline = require('readline');
require('dotenv').config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  let connection;

  try {
    console.log('\n=== Create Admin Account ===\n');

    const username = await question('Username: ');
    const fullName = await question('Nama Lengkap: ');
    const password = await question('Password: ');
    const confirmPassword = await question('Ulangi Password: ');

    if (!username || !fullName || !password) {
      console.log('\n❌ Semua field wajib diisi.');
      process.exit(1);
    }

    if (password !== confirmPassword) {
      console.log('\n❌ Password tidak cocok.');
      process.exit(1);
    }

    if (password.length < 6) {
      console.log('\n❌ Password minimal 6 karakter.');
      process.exit(1);
    }

    // Hash password
    const passwordHash = await argon2.hash(password);

    // Koneksi database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'school_information'
    });

    // Cek apakah username sudah ada
    const [existing] = await connection.execute(
      'SELECT admin_id FROM admins WHERE username = ?',
      [username]
    );

    if (existing.length > 0) {
      console.log('\n❌ Username sudah digunakan.');
      process.exit(1);
    }

    // Insert admin
    await connection.execute(
      `INSERT INTO admins (username, password_hash, full_name, is_active)
       VALUES (?, ?, ?, 1)`,
      [username, passwordHash, fullName]
    );

    console.log('\n✅ Admin berhasil dibuat!');
    console.log(`   Username : ${username}`);
    console.log(`   Nama     : ${fullName}`);
    console.log('\nSekarang kamu bisa login menggunakan akun ini.\n');

  } catch (error) {
    console.error('\n❌ Terjadi kesalahan:');
    console.error(error.message);
  } finally {
    if (connection) await connection.end();
    rl.close();
  }
}

main();