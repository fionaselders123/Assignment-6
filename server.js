const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const dbPath = path.join(__dirname, 'database', 'university.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
    process.exit(1);
  }
  console.log('Connected to university.db');
});

// Validate the fields required for creating/updating a course
function validateCourse(body) {
  const { courseCode, title, credits, semester } = body || {};
  if (!courseCode || !title || credits === undefined || !semester) {
    return 'courseCode, title, credits, and semester are required';
  }
  if (!Number.isInteger(credits) || credits <= 0) {
    return 'credits must be a positive integer';
  }
  return null;
}

// GET /api/courses - SELECT all courses
app.get('/api/courses', (req, res) => {
  db.all('SELECT * FROM courses', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(200).json(rows);
  });
});

// GET /api/courses/:id - SELECT course by ID
app.get('/api/courses/:id', (req, res) => {
  db.get('SELECT * FROM courses WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Course not found' });
    }
    res.status(200).json(row);
  });
});

// POST /api/courses - INSERT new course
app.post('/api/courses', (req, res) => {
  const validationError = validateCourse(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const { courseCode, title, credits, description, semester } = req.body;
  const sql = `
    INSERT INTO courses (courseCode, title, credits, description, semester)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.run(sql, [courseCode, title, credits, description || null, semester], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({
      id: this.lastID,
      courseCode,
      title,
      credits,
      description: description || null,
      semester
    });
  });
});

// PUT /api/courses/:id - UPDATE existing course
app.put('/api/courses/:id', (req, res) => {
  const validationError = validateCourse(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const { courseCode, title, credits, description, semester } = req.body;
  const sql = `
    UPDATE courses
    SET courseCode = ?, title = ?, credits = ?, description = ?, semester = ?
    WHERE id = ?
  `;

  db.run(sql, [courseCode, title, credits, description || null, semester, req.params.id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    res.status(200).json({
      id: Number(req.params.id),
      courseCode,
      title,
      credits,
      description: description || null,
      semester
    });
  });
});

// DELETE /api/courses/:id - DELETE course
app.delete('/api/courses/:id', (req, res) => {
  db.run('DELETE FROM courses WHERE id = ?', [req.params.id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    res.status(200).json({ message: 'Course deleted successfully' });
  });
});

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

process.on('SIGINT', () => {
  server.close();
  db.close(() => process.exit(0));
});