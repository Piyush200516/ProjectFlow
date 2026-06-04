// services/studentService.js

/**
 * Centralized student related utilities for academic year filtering, archiving, and mentor sync.
 */

const db = require('../config/db');
const logger = require('../utils/logger');

// Allowed academic years pattern: 2025-26 and onward
const MIN_YEAR = '2025-26';

/**
 * Checks if the given academic year string is >= MIN_YEAR.
 * Assumes format 'YYYY-YY' where the second part is the ending year.
 */
function isEligibleYear(year) {
  if (!year) return false;
  // Simple lexical compare works because format is zero‑padded and chronological.
  return year >= MIN_YEAR;
}

/**
 * Returns a promise resolving to an array of eligible student rows.
 * Eligible = active status and academic_year >= MIN_YEAR.
 */
async function filterEligibleStudents() {
  const { rows } = await db.pool.query(
    `SELECT * FROM students WHERE status = 'active' AND academic_year >= $1`,
    [MIN_YEAR]
  );
  return rows;
}

/**
 * Archives old student records (status -> 'archived') for years older than MIN_YEAR.
 * Returns the count of affected rows.
 */
async function archiveOldStudents() {
  const { rowCount } = await db.pool.query(
    `UPDATE students SET status = 'archived' WHERE academic_year < $1 AND status = 'active'`,
    [MIN_YEAR]
  );
  logger.info('Archived old students', { archivedCount: rowCount });
  return rowCount;
}

/**
 * Normalizes legacy academic year values (e.g., '2024-25' -> MIN_YEAR).
 * Returns number of rows updated.
 */
async function normalizeAcademicYears() {
  const { rowCount } = await db.pool.query(
    `UPDATE students SET academic_year = $1 WHERE academic_year = '2024-25'`,
    [MIN_YEAR]
  );
  logger.info('Normalized academic years', { normalizedCount: rowCount });
  return rowCount;
}

/**
 * Synchronizes mentor allocations so that only eligible students are referenced.
 * Removes mentor_allocations entries that point to ineligible students.
 */
async function syncMentorAllocations() {
  // Delete allocations where the linked student record is now archived or out of range.
  const { rowCount } = await db.pool.query(
    `DELETE FROM mentor_allocations ma
     USING students s
     WHERE ma.id = ma.id
       AND s.id = ma.student_id
       AND (s.status <> 'active' OR s.academic_year < $1)`,
    [MIN_YEAR]
  );
  logger.info('Synced mentor allocations', { removedAllocations: rowCount });
  return rowCount;
}

module.exports = {
  isEligibleYear,
  filterEligibleStudents,
  archiveOldStudents,
  normalizeAcademicYears,
  syncMentorAllocations,
};
