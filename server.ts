import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || "https://yufwfgoxtqmwscqzxsgo.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "sb_publishable_ORhIWvWr58zdIpacmk476g_d81u5gb-";
const supabase = createClient(supabaseUrl, supabaseKey);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("dormitory.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    role TEXT,
    name TEXT
  );

  CREATE TABLE IF NOT EXISTS rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_number TEXT UNIQUE,
    capacity INTEGER,
    status TEXT DEFAULT 'Available'
  );

  CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    name TEXT,
    class TEXT,
    room_id INTEGER,
    phone TEXT,
    parent_phone TEXT,
    status TEXT DEFAULT 'Inside',
    qr_code_id TEXT,
    FOREIGN KEY (room_id) REFERENCES rooms (id)
  );

  CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT,
    action TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT,
    FOREIGN KEY (student_id) REFERENCES students (id)
  );
`);

// Seed Demo Data
const seedData = () => {
  const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
  if (userCount.count === 0) {
    db.prepare("INSERT INTO users (email, password, role, name) VALUES (?, ?, ?, ?)").run("admin@school.com", "admin123", "admin", "Admin User");
    db.prepare("INSERT INTO users (email, password, role, name) VALUES (?, ?, ?, ?)").run("teacher@school.com", "teacher123", "teacher", "Teacher User");

    db.prepare("INSERT INTO rooms (room_number, capacity) VALUES (?, ?)").run("101", 8);
    db.prepare("INSERT INTO rooms (room_number, capacity) VALUES (?, ?)").run("102", 6);
    db.prepare("INSERT INTO rooms (room_number, capacity) VALUES (?, ?)").run("103", 10);

    db.prepare("INSERT INTO students (id, name, class, room_id, phone, parent_phone, status, qr_code_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(
      "ST001", "Nguyen Van A", "10A", 1, "0901234567", "0907654321", "Inside", "QR_ST001"
    );
    db.prepare("INSERT INTO students (id, name, class, room_id, phone, parent_phone, status, qr_code_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(
      "ST002", "Tran Thi B", "11B", 2, "0912345678", "0918765432", "Inside", "QR_ST002"
    );
  }
};
seedData();

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = 3000;

  app.use(express.json());

  app.get("/api/health", (req, res) => {
    try {
      const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as any;
      res.json({ status: "ok", users: userCount.count });
    } catch (e: any) {
      res.status(500).json({ status: "error", message: e.message });
    }
  });

  // Auth API
  app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;
    
    // 1. Hardcoded fallback for Vercel/Demo environments
    if (email === "admin@school.com" && password === "admin123") {
      return res.json({
        id: 0,
        email: "admin@school.com",
        role: "admin",
        name: "Admin (Fallback Mode)"
      });
    }

    if (email === "teacher@school.com" && password === "teacher123") {
      return res.json({
        id: 0,
        email: "teacher@school.com",
        role: "teacher",
        name: "Teacher (Fallback Mode)"
      });
    }

    try {
      // 2. Try Supabase
      try {
        const { data: user, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .eq('password', password)
          .maybeSingle(); // Use maybeSingle to avoid error on "not found"

        if (user) {
          const { password: _, ...userWithoutPassword } = user;
          return res.json(userWithoutPassword);
        }
      } catch (supabaseErr) {
        console.error("Supabase login error:", supabaseErr);
        // Continue to SQLite fallback
      }

      // 3. Fallback to SQLite
      try {
        const sqliteUser = db.prepare("SELECT * FROM users WHERE email = ? AND password = ?").get(email, password) as any;
        if (sqliteUser) {
          const { password: _, ...userWithoutPassword } = sqliteUser;
          return res.json(userWithoutPassword);
        }
      } catch (sqliteErr) {
        console.error("SQLite login error:", sqliteErr);
      }

      res.status(401).json({ message: "Email hoặc mật khẩu không chính xác" });
    } catch (error) {
      console.error("Login process error:", error);
      res.status(500).json({ message: "Lỗi hệ thống khi đăng nhập" });
    }
  });

  // Dashboard API
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      // Try Supabase first
      const { data: students, error: sErr } = await supabase.from('students').select('status');
      const { data: rooms, error: rErr } = await supabase.from('rooms').select('id, capacity');
      const { data: lateLogs, error: lErr } = await supabase.from('logs').select('id').eq('status', 'Late');

      if (students && rooms) {
        const totalStudents = students.length;
        const insideStudents = students.filter(s => s.status === 'Inside').length;
        const outsideStudents = students.filter(s => s.status === 'Outside').length;
        const totalRooms = rooms.length;
        const lateToday = lateLogs ? lateLogs.length : 0; // Simplified for demo

        // Calculate rooms with beds
        // This would normally be a more complex query, but we can do it in JS for now
        const { data: studentRoomCounts } = await supabase.from('students').select('room_id');
        const roomCounts: Record<string, number> = {};
        studentRoomCounts?.forEach(s => {
          if (s.room_id) roomCounts[s.room_id] = (roomCounts[s.room_id] || 0) + 1;
        });
        const roomsWithBeds = rooms.filter(r => (roomCounts[r.id] || 0) < r.capacity).length;

        return res.json({
          totalStudents,
          insideStudents,
          outsideStudents,
          totalRooms,
          roomsWithBeds,
          lateToday
        });
      }
    } catch (e) {
      console.error("Supabase error, falling back to SQLite", e);
    }

    // Fallback to SQLite
    const totalStudents = db.prepare("SELECT COUNT(*) as count FROM students").get() as any;
    const insideStudents = db.prepare("SELECT COUNT(*) as count FROM students WHERE status = 'Inside'").get() as any;
    const outsideStudents = db.prepare("SELECT COUNT(*) as count FROM students WHERE status = 'Outside'").get() as any;
    const totalRooms = db.prepare("SELECT COUNT(*) as count FROM rooms").get() as any;
    
    const roomsWithBeds = db.prepare(`
      SELECT COUNT(*) as count FROM (
        SELECT r.id, r.capacity, COUNT(s.id) as student_count 
        FROM rooms r 
        LEFT JOIN students s ON r.id = s.room_id 
        GROUP BY r.id 
        HAVING student_count < r.capacity
      )
    `).get() as any;

    const lateToday = db.prepare(`
      SELECT COUNT(*) as count FROM logs 
      WHERE status = 'Late' AND date(timestamp) = date('now')
    `).get() as any;

    res.json({
      totalStudents: totalStudents.count,
      insideStudents: insideStudents.count,
      outsideStudents: outsideStudents.count,
      totalRooms: totalRooms.count,
      roomsWithBeds: roomsWithBeds.count,
      lateToday: lateToday.count
    });
  });

  // Students API
  app.get("/api/students", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*, rooms(room_number)');
      
      if (data) {
        const formatted = data.map(s => ({
          ...s,
          room_number: s.rooms ? (s.rooms as any).room_number : null
        }));
        return res.json(formatted);
      }
    } catch (e) {}

    const students = db.prepare(`
      SELECT s.*, r.room_number 
      FROM students s 
      LEFT JOIN rooms r ON s.room_id = r.id
    `).all();
    res.json(students);
  });

  app.post("/api/students", async (req, res) => {
    const { id, name, class: studentClass, room_id, phone, parent_phone, qr_code_id } = req.body;
    
    try {
      await supabase.from('students').insert([{
        id, name, class: studentClass, room_id, phone, parent_phone, qr_code_id
      }]);
    } catch (e) {}

    try {
      db.prepare("INSERT INTO students (id, name, class, room_id, phone, parent_phone, qr_code_id) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
        id, name, studentClass, room_id, phone, parent_phone, qr_code_id
      );
      res.status(201).json({ message: "Student added" });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.put("/api/students/:id", (req, res) => {
    const { id } = req.params;
    const { name, class: studentClass, room_id, phone, parent_phone, status } = req.body;
    db.prepare("UPDATE students SET name = ?, class = ?, room_id = ?, phone = ?, parent_phone = ?, status = ? WHERE id = ?").run(
      name, studentClass, room_id, phone, parent_phone, status, id
    );
    res.json({ message: "Student updated" });
  });

  app.delete("/api/students/:id", (req, res) => {
    db.prepare("DELETE FROM students WHERE id = ?").run(req.params.id);
    res.json({ message: "Student deleted" });
  });

  // Rooms API
  app.get("/api/rooms", async (req, res) => {
    try {
      const { data, error } = await supabase.from('rooms').select('*, students(id)');
      if (data) {
        const formatted = data.map(r => ({
          ...r,
          current_students: r.students ? (r.students as any).length : 0
        }));
        return res.json(formatted);
      }
    } catch (e) {}

    const rooms = db.prepare(`
      SELECT r.*, COUNT(s.id) as current_students 
      FROM rooms r 
      LEFT JOIN students s ON r.id = s.room_id 
      GROUP BY r.id
    `).all();
    res.json(rooms);
  });

  app.post("/api/rooms", async (req, res) => {
    const { room_number, capacity } = req.body;
    try {
      await supabase.from('rooms').insert([{ room_number, capacity }]);
    } catch (e) {}
    
    db.prepare("INSERT INTO rooms (room_number, capacity) VALUES (?, ?)").run(room_number, capacity);
    res.status(201).json({ message: "Room added" });
  });

  // Logs API
  app.get("/api/logs", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('logs')
        .select('*, students(name, rooms(room_number))')
        .order('timestamp', { ascending: false });
      
      if (data) {
        const formatted = data.map(l => ({
          ...l,
          student_name: l.students ? (l.students as any).name : 'Unknown',
          room_number: l.students?.rooms ? (l.students.rooms as any).room_number : null
        }));
        return res.json(formatted);
      }
    } catch (e) {}

    const logs = db.prepare(`
      SELECT l.*, s.name as student_name, r.room_number 
      FROM logs l 
      JOIN students s ON l.student_id = s.id 
      LEFT JOIN rooms r ON s.room_id = r.id 
      ORDER BY l.timestamp DESC
    `).all();
    res.json(logs);
  });

  app.post("/api/check-in-out", async (req, res) => {
    const { student_id, action } = req.body;
    const now = new Date();
    const hours = now.getHours();
    let status = "Normal";
    
    if (action === "Check-in" && hours >= 22) {
      status = "Late";
    }

    try {
      // Update Supabase
      await supabase.from('logs').insert([{ student_id, action, status }]);
      await supabase.from('students').update({ status: action === "Check-in" ? "Inside" : "Outside" }).eq('id', student_id);
    } catch (e) {}

    db.prepare("INSERT INTO logs (student_id, action, status) VALUES (?, ?, ?)").run(student_id, action, status);
    db.prepare("UPDATE students SET status = ? WHERE id = ?").run(action === "Check-in" ? "Inside" : "Outside", student_id);
    
    const student = db.prepare("SELECT name FROM students WHERE id = ?").get(student_id) as any;
    const studentName = student ? student.name : student_id;

    // Emit real-time event
    io.emit("scan_success", {
      student_id,
      student_name: studentName,
      action,
      status
    });

    res.json({ message: `Student ${action} successful`, status });
  });

  // Late Reports
  app.get("/api/reports/late", (req, res) => {
    const lateReports = db.prepare(`
      SELECT l.timestamp as check_in_time, s.name as student_name, s.class, r.room_number 
      FROM logs l 
      JOIN students s ON l.student_id = s.id 
      LEFT JOIN rooms r ON s.room_id = r.id 
      WHERE l.status = 'Late'
      ORDER BY l.timestamp DESC
    `).all();
    res.json(lateReports);
  });

  // Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
