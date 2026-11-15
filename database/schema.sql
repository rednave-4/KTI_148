-- =====================================================
-- School Information & Interactive SVG Wayfinding System
-- Database Schema - SMA Negeri 10 Samarinda
-- =====================================================

-- (Catatan: Baris CREATE DATABASE & USE dihapus agar langsung mengeksekusi 
--  tabel ke database aktif yang disediakan oleh Railway)

-- =====================================================
-- 1. Tabel admins
-- =====================================================
CREATE TABLE IF NOT EXISTS admins (
  admin_id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Gunakan REPLACE INTO agar jika username 'admin' sudah ada, datanya ditimpa/diperbarui
REPLACE INTO admins (username, password_hash, full_name) 
VALUES ('admin', '$argon2id$v=19$m=65536,t=3,p=4$tyguG14rc+qzLFHWoV57FQ$c3KWwTYMdABGSEgfRiA7/ZfrcHZKoqrsByDi5ySi3pY', 'Administrator SMAN 10');

-- =====================================================
-- 2. Tabel locations (Hierarki)
-- =====================================================
CREATE TABLE IF NOT EXISTS locations (
  location_id INT AUTO_INCREMENT PRIMARY KEY,
  parent_location_id INT NULL,
  name VARCHAR(150) NOT NULL,
  location_type ENUM('SCHOOL', 'BUILDING', 'FLOOR', 'ROOM', 'FACILITY') NOT NULL,
  description TEXT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_locations_parent
    FOREIGN KEY (parent_location_id) REFERENCES locations(location_id)
    ON DELETE SET NULL ON UPDATE CASCADE,

  INDEX idx_locations_parent (parent_location_id),
  INDEX idx_locations_type (location_type),
  INDEX idx_locations_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 3. Tabel announcements
-- =====================================================
CREATE TABLE IF NOT EXISTS announcements (
  announcement_id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT NOT NULL,
  location_id INT NULL,
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(220) NULL UNIQUE,
  description TEXT NULL,
  event_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NULL,
  image_path VARCHAR(255) NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'umum',
  status ENUM('draft', 'published', 'archived', 'done') NOT NULL DEFAULT 'draft',
  published_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_announcements_admin
    FOREIGN KEY (admin_id) REFERENCES admins(admin_id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT fk_announcements_location
    FOREIGN KEY (location_id) REFERENCES locations(location_id)
    ON DELETE SET NULL ON UPDATE CASCADE,

  INDEX idx_announcements_status (status),
  INDEX idx_announcements_event_date (event_date),
  INDEX idx_announcements_location (location_id),
  INDEX idx_announcements_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 4. Tabel maps
-- =====================================================
CREATE TABLE IF NOT EXISTS maps (
  map_id INT AUTO_INCREMENT PRIMARY KEY,
  location_id INT NOT NULL,
  map_name VARCHAR(100) NOT NULL,
  map_type ENUM('CAMPUS', 'FLOOR') NOT NULL,
  svg_path VARCHAR(255) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_maps_location
    FOREIGN KEY (location_id) REFERENCES locations(location_id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  INDEX idx_maps_location (location_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 5. Tabel map_elements
-- =====================================================
CREATE TABLE IF NOT EXISTS map_elements (
  map_element_id INT AUTO_INCREMENT PRIMARY KEY,
  map_id INT NOT NULL,
  location_id INT NOT NULL,
  svg_element_id VARCHAR(100) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_map_elements_map
    FOREIGN KEY (map_id) REFERENCES maps(map_id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT fk_map_elements_location
    FOREIGN KEY (location_id) REFERENCES locations(location_id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  UNIQUE KEY uk_map_svg_element (map_id, svg_element_id),
  INDEX idx_map_elements_location (location_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Seed Data untuk Tabel locations (Hierarki SMA Negeri 10 Samarinda)
-- =====================================================
REPLACE INTO locations (location_id, parent_location_id, name, location_type, description, sort_order) VALUES
-- 1. ROOT SCHOOL
(1, NULL, 'SMA Negeri 10 Samarinda', 'SCHOOL', 'Komplek Utama Sekolah', 1),

-- ==========================================
-- 2. AREA AKADEMIK & KELAS (BUILDING)
-- ==========================================
(2, 1, 'Area Akademik', 'BUILDING', 'Pusat kegiatan belajar mengajar utama', 10),
(10, 2, 'Gedung Borneo 1', 'BUILDING', 'Gedung Borneo 1', 11),
(11, 2, 'Gedung Borneo 2', 'BUILDING', 'Gedung Borneo 2', 12),
(12, 2, 'Gedung Borneo 3', 'BUILDING', 'Gedung Borneo 3', 13),
(13, 2, 'Gedung Kelas Belian 1', 'ROOM', 'Gedung Kelas Belian 1', 14),
(14, 2, 'Gedung Kelas Belian 2', 'ROOM', 'Gedung Kelas Belian 2', 15),
(15, 2, 'Gedung Kelas Belian 3', 'ROOM', 'Gedung Kelas Belian 3', 16),
(16, 2, 'Gedung Kelas Belian 4', 'ROOM', 'Gedung Kelas Belian 4', 17),
(17, 2, 'Gedung Bangkirai', 'BUILDING', 'Gedung Bangkirai', 18),
(18, 2, 'Gedung Jepen', 'BUILDING', 'Gedung Jepen', 19),
(19, 2, 'Gedung Keruing', 'BUILDING', 'Gedung Keruing', 20),
(20, 2, 'Gedung Ulin', 'BUILDING', 'Gedung Ulin', 21),
(21, 2, 'Gedung Mahakam', 'BUILDING', 'Gedung Mahakam', 22),
(22, 2, 'Gedung Pandurata', 'BUILDING', 'Gedung Pandurata', 23),
(23, 2, 'Gedung Putri Aji', 'BUILDING', 'Gedung Putri Aji', 24),
(24, 2, 'Gedung Putri Karang Melenu', 'BUILDING', 'Gedung Putri Karang Melenu', 25),
(25, 2, 'Gedung Kresik Luway 1', 'BUILDING', 'Gedung Kresik Luway 1', 26),
(26, 2, 'Gedung Kresik Luway 2', 'BUILDING', 'Gedung Kresik Luway 2', 27),

-- ==========================================
-- 3. AREA PENUNJANG (FACILITY / BUILDING)
-- ==========================================
(3, 1, 'Area Penunjang', 'BUILDING', 'Fasilitas pendukung sekolah', 30),
(30, 3, 'Gedung Kantin Bekepor', 'FACILITY', 'Pusat kuliner dan kantin sekolah', 31),
(31, 3, 'Masjid Qiwwamul Ummah', 'FACILITY', 'Tempat ibadah utama warga sekolah', 32),
(32, 3, 'Wisma Derawan', 'BUILDING', 'Asrama / Wisma Derawan', 33),
(33, 3, 'Wisma Kumala 1', 'BUILDING', 'Asrama / Wisma Kumala 1', 34),
(34, 3, 'Wisma Kumala 2', 'BUILDING', 'Asrama / Wisma Kumala 2', 35),
(35, 3, 'Wisma Kumala 3', 'BUILDING', 'Asrama / Wisma Kumala 3', 36),

-- ==========================================
-- 4. AREA OLAHRAGA & LAPANGAN (FACILITY)
-- ==========================================
(4, 1, 'Area Olahraga & Lapangan', 'BUILDING', 'Zona olahraga dan lapangan terbuka', 40),
(40, 4, 'Lapangan Upacara 1', 'FACILITY', 'Lapangan utama upacara bendera', 41),
(41, 4, 'Lapangan Upacara 2', 'FACILITY', 'Lapangan pendukung upacara', 42),
(42, 4, 'Lapangan Bola Cakrawala 10', 'FACILITY', 'Lapangan sepak bola sekolah', 43),
(43, 4, 'Lapangan Basketball', 'FACILITY', 'Lapangan basket sekolah', 44),
(44, 4, 'Lapangan Volley', 'FACILITY', 'Lapangan bola voli sekolah', 45),

-- ==========================================
-- 5. AREA PARKIR & KEAMANAN (FACILITY)
-- ==========================================
(5, 1, 'Area Parkir & Keamanan', 'BUILDING', 'Zona kendaraan dan pos pengamanan', 50),
(50, 5, 'Parkiran Utara', 'FACILITY', 'Area parkir kendaraan bagian utara', 51),
(51, 5, 'Parkiran Selatan', 'FACILITY', 'Area parkir kendaraan bagian selatan', 52),
(52, 5, 'Pos Punggawa 1', 'FACILITY', 'Pos satpam / keamanan utama', 53),
(53, 5, 'Pos Punggawa 2', 'FACILITY', 'Pos satpam / keamanan kedua', 54);