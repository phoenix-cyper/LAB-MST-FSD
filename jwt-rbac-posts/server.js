/**
 * JWT + RBAC demo server
 * Roles: admin (create/edit/delete), viewer (read-only)
 */
const path = require("path");
const express = require("express");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "dev-only-secret-change-me";

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// --- Demo users (in-memory). Password is plain text only because this is a local experiment.
const USERS = [
  { username: "admin", password: "admin123", role: "admin" },
  { username: "viewer", password: "viewer123", role: "viewer" },
];

// --- In-memory posts
let nextId = 3;
let posts = [
  { id: 1, title: "Welcome to the RBAC demo", body: "Admins can edit me. Viewers can only read me." },
  { id: 2, title: "How JWT works here", body: "Login returns a signed token; every request sends it as a Bearer header." },
];

// --- Auth middleware
function authenticate(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing token" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden: your role cannot do this" });
    }
    next();
  };
}

// --- Routes
app.post("/api/login", (req, res) => {
  const { username, password, role } = req.body || {};
  if (!username || !password || !role) {
    return res.status(400).json({ error: "Username, password and role are required" });
  }
  const user = USERS.find((u) => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ error: "Invalid username or password" });
  if (user.role !== role) {
    return res.status(403).json({ error: `This account is not a ${role}` });
  }
  const token = jwt.sign({ sub: user.username, username: user.username, role: user.role }, JWT_SECRET, {
    expiresIn: "1h",
  });
  res.json({ token, user: { username: user.username, role: user.role } });
});

app.get("/api/me", authenticate, (req, res) => {
  res.json({ username: req.user.username, role: req.user.role });
});

// Any logged-in role can read
app.get("/api/posts", authenticate, (req, res) => {
  res.json({ posts, total: posts.length });
});

// Admin only
app.post("/api/posts", authenticate, requireRole("admin"), (req, res) => {
  const { title, body } = req.body || {};
  if (!title || !title.trim()) return res.status(400).json({ error: "Title is required" });
  const post = { id: nextId++, title: title.trim(), body: (body || "").trim() };
  posts.push(post);
  res.status(201).json(post);
});

app.put("/api/posts/:id", authenticate, requireRole("admin"), (req, res) => {
  const post = posts.find((p) => p.id === Number(req.params.id));
  if (!post) return res.status(404).json({ error: "Post not found" });
  const { title, body } = req.body || {};
  if (typeof title === "string" && title.trim()) post.title = title.trim();
  if (typeof body === "string") post.body = body.trim();
  res.json(post);
});

app.delete("/api/posts/:id", authenticate, requireRole("admin"), (req, res) => {
  const id = Number(req.params.id);
  const before = posts.length;
  posts = posts.filter((p) => p.id !== id);
  if (posts.length === before) return res.status(404).json({ error: "Post not found" });
  res.json({ ok: true, total: posts.length });
});

app.listen(PORT, () => {
  console.log(`JWT + RBAC demo running at http://localhost:${PORT}`);
});
