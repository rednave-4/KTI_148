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
  status ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'draft',
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
  INDEX idx_announcements_location (location_id)
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
-- Seed Data untuk Tabel locations (Contoh Lokasi SMAN 10 Samarinda)
-- =====================================================
INSERT IGNORE INTO locations (location_id, parent_location_id, name, location_type, description, sort_order) VALUES
(1, NULL, 'SMA Negeri 10 Samarinda', 'SCHOOL', 'Komplek Utama Sekolah', 1),
(2, 1, 'Gedung Utama / Kantor', 'BUILDING', 'Ruang Kepala Sekolah dan Tata Usaha', 2),
(3, 1, 'Gedung Kelas Belajar', 'BUILDING', 'Area Kegiatan Belajar Mengajar (KBM)', 3),
(4, 1, 'Aula Serbaguna', 'FACILITY', 'Tempat Acara / Pertemuan Besar', 4);