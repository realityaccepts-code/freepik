const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com'] 
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Database connection
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'freepik_downloader',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

// Initialize database tables
async function initDatabase() {
  try {
    const connection = await pool.getConnection();
    
    // Users table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Downloads table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS downloads (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        url TEXT NOT NULL,
        filename VARCHAR(500) NOT NULL,
        status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
        progress INT DEFAULT 0,
        file_path VARCHAR(1000) NULL,
        error_message TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_status (user_id, status),
        INDEX idx_created_at (created_at)
      )
    `);

    connection.release();
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

// JWT middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [rows] = await pool.execute(
      'SELECT id, name, email FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = rows[0];
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Auth routes
app.post('/api/auth/register', [
  body('name').trim().isLength({ min: 2, max: 100 }).escape(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6, max: 128 })
], handleValidationErrors, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashedPassword]
    );

    res.status(201).json({
      message: 'User created successfully',
      userId: result.insertId
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], handleValidationErrors, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const [users] = await pool.execute(
      'SELECT id, name, email, password FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/auth/verify', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// Download routes
app.get('/api/downloads', authenticateToken, async (req, res) => {
  try {
    const [downloads] = await pool.execute(
      `SELECT id, url, filename, status, progress, file_path, error_message, 
              created_at, completed_at 
       FROM downloads 
       WHERE user_id = ? 
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    // Get statistics
    const [stats] = await pool.execute(
      `SELECT 
         COUNT(*) as total,
         SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
         SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing,
         SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
         SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
       FROM downloads 
       WHERE user_id = ?`,
      [req.user.id]
    );

    res.json({
      downloads,
      stats: stats[0]
    });
  } catch (error) {
    console.error('Get downloads error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/downloads', authenticateToken, [
  body('url').isURL().custom(value => {
    if (!value.includes('freepik.com')) {
      throw new Error('URL must be from Freepik');
    }
    return true;
  })
], handleValidationErrors, async (req, res) => {
  try {
    const { url } = req.body;

    // Extract filename from URL
    const urlMatch = url.match(/\/([^\/]+)_(\d+)\.htm/);
    const filename = urlMatch ? urlMatch[1].replace(/-/g, ' ') : 'freepik-image';

    // Check if URL already exists for this user
    const [existing] = await pool.execute(
      'SELECT id FROM downloads WHERE user_id = ? AND url = ?',
      [req.user.id, url]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'This URL has already been added' });
    }

    // Add download
    const [result] = await pool.execute(
      'INSERT INTO downloads (user_id, url, filename, status) VALUES (?, ?, ?, ?)',
      [req.user.id, url, filename, 'pending']
    );

    // Here you would trigger the download process
    // For now, we'll simulate it
    processDownload(result.insertId, url, filename);

    res.status(201).json({
      message: 'Download added successfully',
      downloadId: result.insertId
    });
  } catch (error) {
    console.error('Add download error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/downloads/:id/file', authenticateToken, async (req, res) => {
  try {
    const downloadId = parseInt(req.params.id);

    const [downloads] = await pool.execute(
      'SELECT file_path, filename FROM downloads WHERE id = ? AND user_id = ? AND status = ?',
      [downloadId, req.user.id, 'completed']
    );

    if (downloads.length === 0) {
      return res.status(404).json({ error: 'Download not found or not completed' });
    }

    const download = downloads[0];
    const filePath = path.join(__dirname, download.file_path);

    try {
      await fs.access(filePath);
      res.download(filePath, download.filename);
    } catch (error) {
      res.status(404).json({ error: 'File not found on server' });
    }
  } catch (error) {
    console.error('Download file error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Simulated download processing function
async function processDownload(downloadId, url, filename) {
  try {
    // Update status to processing
    await pool.execute(
      'UPDATE downloads SET status = ?, progress = ? WHERE id = ?',
      ['processing', 0, downloadId]
    );

    // Simulate download progress
    for (let progress = 10; progress <= 100; progress += 10) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await pool.execute(
        'UPDATE downloads SET progress = ? WHERE id = ?',
        [progress, downloadId]
      );
    }

    // Simulate successful completion
    const filePath = `uploads/${downloadId}_${filename}.jpg`;
    await pool.execute(
      'UPDATE downloads SET status = ?, progress = ?, file_path = ?, completed_at = NOW() WHERE id = ?',
      ['completed', 100, filePath, downloadId]
    );

    console.log(`✅ Download ${downloadId} completed successfully`);
  } catch (error) {
    console.error(`❌ Download ${downloadId} failed:`, error);
    await pool.execute(
      'UPDATE downloads SET status = ?, error_message = ? WHERE id = ?',
      ['failed', error.message, downloadId]
    );
  }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { details: error.message })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
async function startServer() {
  try {
    await initDatabase();
    
    // Create uploads directory
    const uploadsDir = path.join(__dirname, 'uploads');
    try {
      await fs.access(uploadsDir);
    } catch {
      await fs.mkdir(uploadsDir, { recursive: true });
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔒 Security: Helmet, CORS, Rate Limiting enabled`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();