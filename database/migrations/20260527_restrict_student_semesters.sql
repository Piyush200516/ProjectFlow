UPDATE students
SET semester = 6
WHERE semester IN (1, 2, 3, 4);

ALTER TABLE students DROP CONSTRAINT IF EXISTS students_semester_check;
ALTER TABLE students DROP CONSTRAINT IF EXISTS semester_check;

ALTER TABLE students
ADD CONSTRAINT semester_check
CHECK (semester BETWEEN 5 AND 8);
