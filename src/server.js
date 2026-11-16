const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const pool = require('./config/database');
const initializeDatabase = require('./config/initDb'); // Import inisialisasi database otomatis
require('dotenv').config();

const PORT = process.env.PORT || 3000;

// 1. Buat HTTP Server yang membungkus Express app
const server = http.createServer(app);

// 2. Inisialisasi Socket.io di atas HTTP Server
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// 3. Logika Real-Time Socket.io untuk Game Catur Online
io.on('connection', (socket) => {
  console.log(`🔌 Pengguna terhubung: ${socket.id}`);

  // Buat Room Catur Baru
  socket.on('createRoom', async (initialGameState, callback) => {
    try {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let roomCode = '';
      for (let i = 0; i < 6; i++) {
        roomCode += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      const connection = await pool.getConnection();
      await connection.query(
        'INSERT INTO chess_rooms (room_code, game_state) VALUES (?, ?)',
        [roomCode, JSON.stringify(initialGameState)]
      );
      connection.release();
      
      socket.join(roomCode);
      callback({ success: true, roomCode, color: 'w' });
    } catch (err) {
      console.error('Gagal buat room:', err);
      callback({ success: false, message: 'Gagal membuat room catur. Pastikan tabel chess_rooms sudah ada.' });
    }
  });

  // Bergabung ke Room
  socket.on('joinRoom', async (roomCode, callback) => {
    try {
      const code = roomCode.toUpperCase().trim();
      const connection = await pool.getConnection();
      const [rows] = await connection.query('SELECT * FROM chess_rooms WHERE room_code = ?', [code]);
      
      if (rows.length === 0) {
        connection.release();
        return callback({ success: false, message: 'Kode room catur tidak ditemukan.' });
      }

      const room = rows[0];
      await connection.query('UPDATE chess_rooms SET black_connected = TRUE WHERE room_code = ?', [code]);
      connection.release();

      socket.join(code);
      socket.to(code).emit('opponentJoined');

      const gameState = typeof room.game_state === 'string' ? JSON.parse(room.game_state) : room.game_state;
      callback({ success: true, roomCode: code, color: 'b', gameState });
    } catch (err) {
      console.error('Gagal join room:', err);
      callback({ success: false, message: 'Gagal bergabung ke room.' });
    }
  });

  // Sinkronisasi Langkah Catur Real-Time
  socket.on('syncMove', async ({ roomCode, gameState }) => {
    try {
      const connection = await pool.getConnection();
      await connection.query(
        'UPDATE chess_rooms SET game_state = ? WHERE room_code = ?',
        [JSON.stringify(gameState), roomCode]
      );
      connection.release();
      
      // Kirim pergerakan ke lawan di room yang sama
      socket.to(roomCode).emit('boardUpdated', gameState);
    } catch (err) {
      console.error('Gagal sinkronisasi langkah:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log(`❌ Pengguna terputus: ${socket.id}`);
  });
});

async function startServer() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Berhasil terhubung ke MySQL');
    connection.release();

    // Jalankan pembuatan tabel otomatis dari schema.sql sebelum server mendengarkan request
    await initializeDatabase();

    // 4. Ubah dari app.listen menjadi server.listen agar Socket.io aktif
    server.listen(PORT, () => {
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