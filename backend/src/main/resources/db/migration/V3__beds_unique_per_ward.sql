-- Enforce unique bed numbers within a ward so users cannot
-- add the same bed twice (e.g. two "G-01" in "General Ward A").
-- Safe to add because DataSeeder already uses distinct (bed_number, ward_name) pairs
-- and the BedRepository will check existence before insert as a runtime guard.

-- Pre-existing duplicates would cause this migration to fail on legacy databases,
-- so we de-duplicate first: keep only the oldest row per (ward_name, bed_number)
-- and detach any other beds by suffixing their bed_number with "-DUP-<short_id>".
UPDATE beds b
SET    bed_number = b.bed_number || '-DUP-' || LEFT(LOWER(REPLACE(CAST(b.id AS VARCHAR), '-', '')), 8)
WHERE  EXISTS (
        SELECT 1 FROM beds b2
        WHERE  b2.ward_name = b.ward_name
        AND    b2.bed_number = b.bed_number
        AND    b2.created_date < b.created_date
       );

CREATE UNIQUE INDEX IF NOT EXISTS uq_bed_ward_number
    ON beds (ward_name, bed_number);
