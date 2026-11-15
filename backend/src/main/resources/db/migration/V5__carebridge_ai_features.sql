-- Migration V5: CareBridge AI Schema Extensions
-- Adds bed categorization (ICU, Emergency, General, Cabin),
-- public online seat reservations, and prescription analysis cache.

-- 1. Ensure pgvector extension if available
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS vector;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pgvector extension could not be loaded; vector columns optional';
END $$;

-- 2. Add bed category and daily rate to beds
ALTER TABLE beds ADD COLUMN IF NOT EXISTS bed_type VARCHAR(50) DEFAULT 'GENERAL';
ALTER TABLE beds ADD COLUMN IF NOT EXISTS daily_rate NUMERIC(10, 2) DEFAULT 0;

-- Set initial bed types based on existing ward naming or bed numbers
UPDATE beds SET bed_type = 'ICU', daily_rate = 5000.00 WHERE ward_name ILIKE '%ICU%' OR bed_number ILIKE 'ICU%';
UPDATE beds SET bed_type = 'EMERGENCY', daily_rate = 2500.00 WHERE ward_name ILIKE '%Emergency%' OR bed_number ILIKE 'EMG%';
UPDATE beds SET bed_type = 'CABIN', daily_rate = 3500.00 WHERE ward_name ILIKE '%Cabin%' OR bed_number ILIKE 'CAB%';
UPDATE beds SET bed_type = 'GENERAL', daily_rate = 800.00 WHERE bed_type IS NULL OR bed_type = 'GENERAL';

CREATE INDEX IF NOT EXISTS idx_bed_type ON beds (bed_type);

-- 3. Online seat & bed reservations (public self-service booking)
CREATE TABLE IF NOT EXISTS bed_bookings (
    id UUID PRIMARY KEY,
    booking_reference VARCHAR(50) NOT NULL UNIQUE,
    patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
    guest_name VARCHAR(200) NOT NULL,
    guest_phone VARCHAR(20) NOT NULL,
    guest_nid VARCHAR(30),
    guest_gender VARCHAR(10) NOT NULL,
    guest_age INTEGER NOT NULL,
    bed_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'CONFIRMED', -- CONFIRMED, PENDING, CANCELLED, ADMITTED
    assigned_bed_id UUID REFERENCES beds(id) ON DELETE SET NULL,
    payment_method VARCHAR(50) NOT NULL, -- BKASH, NAGAD, UPAY, CASH
    payment_trx_id VARCHAR(100) NOT NULL,
    payment_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    payment_status VARCHAR(50) NOT NULL DEFAULT 'PAID',
    symptoms TEXT,
    notes TEXT,
    created_date TIMESTAMP,
    last_modified_date TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_booking_reference ON bed_bookings (booking_reference);
CREATE INDEX IF NOT EXISTS idx_booking_phone ON bed_bookings (guest_phone);
CREATE INDEX IF NOT EXISTS idx_booking_status ON bed_bookings (status);
CREATE INDEX IF NOT EXISTS idx_booking_bed_type ON bed_bookings (bed_type);

-- 4. Prescription OCR & RAG Knowledge Store
CREATE TABLE IF NOT EXISTS prescription_knowledge (
    id UUID PRIMARY KEY,
    image_hash VARCHAR(64) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    extracted_medicines TEXT,
    diagnosis TEXT,
    precautions TEXT,
    dietary_advice TEXT,
    created_date TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_presc_hash ON prescription_knowledge (image_hash);
