const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'university.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
});

const createCoursesTable = `
  CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    courseCode TEXT NOT NULL,
    title TEXT NOT NULL,
    credits INTEGER NOT NULL,
    description TEXT,
    semester TEXT NOT NULL
  )
`;

db.run(createCoursesTable, (err) => {
  if (err) {
    console.error('Error creating courses table:', err.message);
  } else {
    console.log('Database university.db and courses table created successfully.');
  }

  db.close((closeErr) => {
    if (closeErr) {
      console.error('Error closing database:', closeErr.message);
    }
  });
});