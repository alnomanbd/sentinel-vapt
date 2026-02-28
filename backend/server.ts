import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Database from "better-sqlite3";
import multer from "multer";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const db = new Database("vapt.db");

// Initialize Database with full schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Viewer'
  );

  CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    appId TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    owner TEXT NOT NULL,
    environment TEXT NOT NULL,
    description TEXT,
    criticalCount INTEGER DEFAULT 0,
    highCount INTEGER DEFAULT 0,
    mediumCount INTEGER DEFAULT 0,
    lowCount INTEGER DEFAULT 0,
    riskScore REAL DEFAULT 0,
    overallRiskLevel TEXT DEFAULT 'Low'
  );

  CREATE TABLE IF NOT EXISTS findings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    findingId TEXT UNIQUE NOT NULL,
    appId TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    impact TEXT,
    cvssScore REAL NOT NULL,
    severity TEXT NOT NULL,
    owaspCategory TEXT,
    status TEXT NOT NULL DEFAULT 'Open',
    assignedTo INTEGER,
    reportedDate TEXT,
    dueDate TEXT,
    remediationSteps TEXT,
    evidenceFile TEXT,
    retestStatus TEXT,
    businessImpact TEXT,
    riskScore REAL,
    comments TEXT,
    auditLog TEXT,
    mitreAttack TEXT,
    FOREIGN KEY (appId) REFERENCES applications(appId),
    FOREIGN KEY (assignedTo) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS risk_register (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    riskId TEXT UNIQUE NOT NULL,
    relatedFindingId TEXT,
    businessImpact TEXT,
    likelihood INTEGER,
    riskRating INTEGER,
    riskLevel TEXT,
    riskOwner TEXT,
    mitigationPlan TEXT,
    status TEXT,
    targetClosureDate TEXT,
    FOREIGN KEY (relatedFindingId) REFERENCES findings(findingId)
  );

  CREATE TABLE IF NOT EXISTS evidence (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    findingId INTEGER NOT NULL,
    fileName TEXT NOT NULL,
    filePath TEXT NOT NULL,
    uploadedAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (findingId) REFERENCES findings(id) ON DELETE CASCADE
  );
`);

// Migration: Add mitreAttack column if it doesn't exist
try {
  db.prepare("ALTER TABLE findings ADD COLUMN mitreAttack TEXT").run();
} catch (e) {
  // Column already exists or other error
}

// Seed Admin User if not exists
const adminExists = db.prepare("SELECT * FROM users WHERE email = ?").get("admin@sentinel.com");
if (!adminExists) {
  const hashedPassword = bcrypt.hashSync("admin123", 10);
  db.prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)").run(
    "System Admin",
    "admin@sentinel.com",
    hashedPassword,
    "Admin"
  );
}

// Seed Additional Users if table is small
const userCount = (db.prepare("SELECT COUNT(*) as count FROM users").get() as any).count;
if (userCount <= 1) {
  const users = [
    ['Security Analyst', 'analyst@sentinel.com', bcrypt.hashSync('analyst123', 10), 'Security Analyst'],
    ['App Developer', 'dev@sentinel.com', bcrypt.hashSync('dev123', 10), 'Developer'],
    ['App Owner', 'owner@sentinel.com', bcrypt.hashSync('owner123', 10), 'App Owner'],
  ];
  const insertUser = db.prepare("INSERT OR IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)");
  users.forEach(u => insertUser.run(...u));
}

// Seed Sample Applications if empty
const appCount = (db.prepare("SELECT COUNT(*) as count FROM applications").get() as any).count;
if (appCount === 0) {
  const apps = [
    ['APP-001', 'Banking Portal', 'John Doe', 'Prod', 'Main customer facing banking application'],
    ['APP-002', 'HRMS', 'Jane Smith', 'UAT', 'Human Resource Management System'],
    ['APP-003', 'ERP System', 'Robert Brown', 'Prod', 'Enterprise Resource Planning'],
    ['APP-004', 'Mobile Banking API', 'Alice White', 'Prod', 'REST API for mobile banking app'],
    ['APP-005', 'E-commerce Portal', 'Charlie Green', 'Dev', 'Customer shopping portal'],
  ];
  const insertApp = db.prepare("INSERT OR IGNORE INTO applications (appId, name, owner, environment, description) VALUES (?, ?, ?, ?, ?)");
  apps.forEach(app => insertApp.run(...app));
}

// Seed Sample Findings if empty
const findingCount = (db.prepare("SELECT COUNT(*) as count FROM findings").get() as any).count;
if (findingCount === 0) {
  const findings = [
    ['FND-001', 'APP-001', 'SQL Injection in Login', 'Vulnerability in login form allows SQLi', 'Full DB access', 9.8, 'Critical', 'Injection', 'Open', '2024-12-31', 'Use parameterized queries'],
    ['FND-002', 'APP-001', 'Broken Authentication', 'Session tokens are predictable', 'Account takeover', 8.1, 'High', 'Broken Access Control', 'In Progress', '2024-12-15', 'Use cryptographically secure random tokens'],
    ['FND-003', 'APP-004', 'Insecure API Endpoint', 'Sensitive data exposed in API', 'Data leak', 7.5, 'High', 'Cryptographic Failures', 'Open', '2024-12-20', 'Implement proper authorization checks'],
    ['FND-004', 'APP-002', 'Cross-Site Scripting (XSS)', 'Reflected XSS in search bar', 'Session hijacking', 6.1, 'Medium', 'Injection', 'Closed', '2024-11-30', 'Sanitize user input'],
    ['FND-005', 'APP-005', 'Insecure Direct Object Reference', 'Access other user profiles', 'Unauthorized access', 5.3, 'Medium', 'Broken Access Control', 'Open', '2025-01-10', 'Validate user ownership of objects'],
  ];
  const insertFinding = db.prepare(`
    INSERT OR IGNORE INTO findings (findingId, appId, title, description, impact, cvssScore, severity, owaspCategory, status, dueDate, remediationSteps, riskScore)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  findings.forEach(f => {
    const riskScore = (f[5] as number) * 10;
    insertFinding.run(...f, riskScore);
  });
}

// Seed Risk Register Data if empty
const riskCount = (db.prepare("SELECT COUNT(*) as count FROM risk_register").get() as any).count;
if (riskCount === 0) {
  const risks = [
    ['RSK-001', 'FND-001', 'High business impact due to potential data breach', 4, 16, 'Critical', 'CTO', 'Implement WAF and parameterized queries', 'Open', '2024-12-31'],
    ['RSK-002', 'FND-003', 'Exposure of customer PII via API', 3, 12, 'High', 'Security Lead', 'Apply OAuth2 and rate limiting', 'In Progress', '2024-12-20'],
    ['RSK-003', 'FND-005', 'Unauthorized access to user profiles', 2, 6, 'Medium', 'App Owner', 'Implement object-level authorization', 'Open', '2025-01-10'],
  ];
  const insertRisk = db.prepare(`
    INSERT OR IGNORE INTO risk_register (riskId, relatedFindingId, businessImpact, likelihood, riskRating, riskLevel, riskOwner, mitigationPlan, status, targetClosureDate)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  risks.forEach(r => insertRisk.run(...r));
}

// Multer config for evidence upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

const app = express();
const PORT = 3000;
const JWT_SECRET = "sentinel-vapt-secret-key-2024";

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(uploadsDir));

// Auth Middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

const checkRole = (roles: string[]) => (req: any, res: any, next: any) => {
  if (!roles.includes(req.user.role)) return res.status(403).json({ message: "Unauthorized" });
  next();
};

// --- AUTH ROUTES ---
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  const user: any = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ message: "Invalid credentials" });
  }
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET);
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

// --- APP ROUTES ---
app.get("/api/apps", authenticateToken, (req, res) => {
  const apps = db.prepare("SELECT * FROM applications").all();
  res.json(apps);
});

app.post("/api/apps", authenticateToken, checkRole(['Admin', 'Security Analyst']), (req, res) => {
  const { appId, name, owner, environment, description } = req.body;
  try {
    db.prepare("INSERT INTO applications (appId, name, owner, environment, description) VALUES (?, ?, ?, ?, ?)")
      .run(appId, name, owner, environment, description);
    res.status(201).json({ message: "App created" });
  } catch (e) {
    res.status(400).json({ message: "App ID already exists" });
  }
});

app.put("/api/apps/:id", authenticateToken, checkRole(['Admin', 'Security Analyst']), (req, res) => {
  const { name, owner, environment, description } = req.body;
  db.prepare("UPDATE applications SET name = ?, owner = ?, environment = ?, description = ? WHERE id = ?")
    .run(name, owner, environment, description, req.params.id);
  res.json({ message: "App updated" });
});

app.delete("/api/apps/:id", authenticateToken, checkRole(['Admin']), (req, res) => {
  db.prepare("DELETE FROM applications WHERE id = ?").run(req.params.id);
  res.json({ message: "App deleted" });
});

// --- FINDINGS ROUTES ---
app.get("/api/findings", authenticateToken, (req, res) => {
  const findings = db.prepare(`
    SELECT f.*, a.name as appName 
    FROM findings f 
    JOIN applications a ON f.appId = a.appId
  `).all();
  res.json(findings);
});

app.post("/api/findings", authenticateToken, checkRole(['Admin', 'Security Analyst']), (req, res) => {
  const { findingId, appId, title, description, impact, cvssScore, severity, owaspCategory, mitreAttack, status, dueDate, remediationSteps } = req.body;
  const riskScore = cvssScore * 10;
  try {
    db.prepare(`
      INSERT INTO findings (findingId, appId, title, description, impact, cvssScore, severity, owaspCategory, mitreAttack, status, dueDate, remediationSteps, riskScore)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(findingId, appId, title, description, impact, cvssScore, severity, owaspCategory, mitreAttack, status, dueDate, remediationSteps, riskScore);
    res.status(201).json({ message: "Finding created" });
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: "Finding ID already exists" });
  }
});

app.put("/api/findings/:id", authenticateToken, checkRole(['Admin', 'Security Analyst', 'Developer']), (req, res) => {
  const { title, description, impact, cvssScore, severity, owaspCategory, mitreAttack, status, dueDate, remediationSteps } = req.body;
  const riskScore = cvssScore * 10;
  db.prepare(`
    UPDATE findings SET title = ?, description = ?, impact = ?, cvssScore = ?, severity = ?, owaspCategory = ?, mitreAttack = ?, status = ?, dueDate = ?, remediationSteps = ?, riskScore = ?
    WHERE id = ?
  `).run(title, description, impact, cvssScore, severity, owaspCategory, mitreAttack, status, dueDate, remediationSteps, riskScore, req.params.id);
  res.json({ message: "Finding updated" });
});

app.delete("/api/findings/:id", authenticateToken, checkRole(['Admin']), (req, res) => {
  db.prepare("DELETE FROM findings WHERE id = ?").run(req.params.id);
  res.json({ message: "Finding deleted" });
});

app.get("/api/findings/:id/evidence", authenticateToken, (req, res) => {
  const evidence = db.prepare("SELECT * FROM evidence WHERE findingId = ?").all(req.params.id);
  res.json(evidence);
});

app.post("/api/findings/:id/upload", authenticateToken, upload.single("evidence"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  const filePath = `/uploads/${req.file.filename}`;
  const fileName = req.file.originalname;
  
  db.prepare("INSERT INTO evidence (findingId, fileName, filePath) VALUES (?, ?, ?)")
    .run(req.params.id, fileName, filePath);
    
  res.json({ message: "File uploaded", filePath, fileName });
});

app.delete("/api/evidence/:id", authenticateToken, checkRole(['Admin', 'Security Analyst']), (req, res) => {
  const file: any = db.prepare("SELECT filePath FROM evidence WHERE id = ?").get(req.params.id);
  if (file) {
    // filePath is like "/uploads/filename.ext"
    // We need to strip the leading slash if we join with __dirname, or use uploadsDir
    const fileName = path.basename(file.filePath);
    const fullPath = path.join(uploadsDir, fileName);
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    db.prepare("DELETE FROM evidence WHERE id = ?").run(req.params.id);
  }
  res.json({ message: "Evidence deleted" });
});

// --- RISK REGISTER ROUTES ---
app.get("/api/risks", authenticateToken, (req, res) => {
  const risks = db.prepare("SELECT * FROM risk_register").all();
  res.json(risks);
});

app.post("/api/risks", authenticateToken, checkRole(['Admin', 'Security Analyst']), (req, res) => {
  const { riskId, relatedFindingId, businessImpact, likelihood, riskRating, riskLevel, riskOwner, mitigationPlan, status, targetClosureDate } = req.body;
  db.prepare(`
    INSERT INTO risk_register (riskId, relatedFindingId, businessImpact, likelihood, riskRating, riskLevel, riskOwner, mitigationPlan, status, targetClosureDate)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(riskId, relatedFindingId, businessImpact, likelihood, riskRating, riskLevel, riskOwner, mitigationPlan, status, targetClosureDate);
  res.status(201).json({ message: "Risk created" });
});

app.put("/api/risks/:id", authenticateToken, checkRole(['Admin', 'Security Analyst']), (req, res) => {
  const { businessImpact, likelihood, riskRating, riskLevel, riskOwner, mitigationPlan, status, targetClosureDate } = req.body;
  db.prepare(`
    UPDATE risk_register SET businessImpact = ?, likelihood = ?, riskRating = ?, riskLevel = ?, riskOwner = ?, mitigationPlan = ?, status = ?, targetClosureDate = ?
    WHERE id = ?
  `).run(businessImpact, likelihood, riskRating, riskLevel, riskOwner, mitigationPlan, status, targetClosureDate, req.params.id);
  res.json({ message: "Risk updated" });
});

app.delete("/api/risks/:id", authenticateToken, checkRole(['Admin']), (req, res) => {
  db.prepare("DELETE FROM risk_register WHERE id = ?").run(req.params.id);
  res.json({ message: "Risk deleted" });
});

// --- DASHBOARD STATS ---
app.get("/api/dashboard/stats", authenticateToken, (req, res) => {
  const totalFindings = db.prepare("SELECT COUNT(*) as count FROM findings").get() as any;
  const openFindings = db.prepare("SELECT COUNT(*) as count FROM findings WHERE status = 'Open'").get() as any;
  const severityStats = db.prepare("SELECT severity, COUNT(*) as count FROM findings GROUP BY severity").all();
  const statusStats = db.prepare("SELECT status, COUNT(*) as count FROM findings GROUP BY status").all();
  const overdueFindings = db.prepare("SELECT COUNT(*) as count FROM findings WHERE status != 'Closed' AND dueDate < date('now')").get() as any;
  
  res.json({
    total: totalFindings.count,
    open: openFindings.count,
    overdue: overdueFindings.count,
    severityStats,
    statusStats
  });
});

// --- USER MANAGEMENT ---
app.get("/api/users", authenticateToken, checkRole(['Admin']), (req, res) => {
  const users = db.prepare("SELECT id, name, email, role FROM users").all();
  res.json(users);
});

app.post("/api/users", authenticateToken, checkRole(['Admin']), (req, res) => {
  const { name, email, password, role } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);
  try {
    db.prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)")
      .run(name, email, hashedPassword, role);
    res.status(201).json({ message: "User created" });
  } catch (e) {
    res.status(400).json({ message: "Email already exists" });
  }
});

// Vite middleware for development
if (process.env.NODE_ENV !== "production") {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.join(__dirname, "../dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../dist", "index.html"));
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
