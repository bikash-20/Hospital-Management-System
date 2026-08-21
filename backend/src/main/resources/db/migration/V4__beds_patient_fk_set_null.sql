-- Allow patient deletion even when the patient is currently assigned to a bed.
-- The Bed.patient column becomes NULL on patient deletion (discharge semantics).
--
-- PostgreSQL doesn't support changing an FK's ON DELETE clause in place when
-- the existing default is NO ACTION; we drop and re-add the constraint.

ALTER TABLE beds DROP CONSTRAINT IF EXISTS beds_patient_id_fkey;

ALTER TABLE beds
    ADD CONSTRAINT beds_patient_id_fkey
    FOREIGN KEY (patient_id) REFERENCES patients(id)
    ON DELETE SET NULL;