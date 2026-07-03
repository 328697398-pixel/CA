import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import multer from 'multer';

const app = express();
const PORT = 3000;

// Ensure upload directory exists in the workspace
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Set up multer for file upload storage with custom naming to prevent name collision
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|pdf/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('仅支持上传 JPG, PNG 或 PDF 格式的文件！'));
  }
});

app.use(express.json());

// Serve uploaded files statically
app.use('/uploads', express.static(uploadDir));

// API: Upload invoice file
app.post('/api/upload', upload.single('invoiceFile'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '没有上传文件' });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({
      success: true,
      fileUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API: Send invoice email
app.post('/api/send-invoice', (req, res) => {
  const { email, fileUrl, orderId, title, taxId, amount } = req.body;
  
  console.log('==================================================');
  console.log(`[EMAIL SERVICE] Sending Email to: ${email}`);
  console.log(`[EMAIL SERVICE] Subject: 您购买的订单 ${orderId} 电子发票开具成功`);
  console.log(`[EMAIL SERVICE] Body:`);
  console.log(`  尊敬的客户，您好：`);
  console.log(`  您的订单 ${orderId} 的发票已成功开具。`);
  console.log(`  发票抬头: ${title}`);
  console.log(`  税号: ${taxId}`);
  console.log(`  发票金额: ¥${parseFloat(amount).toFixed(2)}`);
  console.log(`  发票下载链接: http://localhost:3000${fileUrl}`);
  console.log(`  请点击上方链接进行查看或下载。`);
  console.log(`  (西恩贝销售管理系统自动发送)`);
  console.log('==================================================');

  res.json({
    success: true,
    message: `发票发送成功！已成功发送邮件至 ${email}`
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Also serve static uploads in production
    app.use('/uploads', express.static(uploadDir));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
