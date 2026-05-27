ALTER TABLE registration_forms
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE;

UPDATE registration_forms
SET is_published = TRUE
WHERE LOWER(COALESCE(status, '')) = 'published';

UPDATE registration_forms
SET section = 'ALL'
WHERE section IS NULL OR TRIM(section) = '';

UPDATE registration_forms
SET subsection = 'ALL'
WHERE subsection IS NULL OR TRIM(subsection) = '';
