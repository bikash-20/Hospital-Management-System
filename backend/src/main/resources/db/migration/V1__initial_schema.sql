CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(50) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_date TIMESTAMP,
    last_modified_date TIMESTAMP
);

CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY,
    uhid VARCHAR(20) NOT NULL UNIQUE,
    full_name VARCHAR(200) NOT NULL,
    mobile_number VARCHAR(15) NOT NULL,
    dob DATE NOT NULL,
    gender VARCHAR(10) NOT NULL,
    nid VARCHAR(30),
    address VARCHAR(500),
    created_date TIMESTAMP,
    last_modified_date TIMESTAMP
);

CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES patients(id),
    doctor_id UUID NOT NULL REFERENCES users(id),
    appointment_date TIMESTAMP NOT NULL,
    token_number INTEGER,
    status VARCHAR(50) NOT NULL,
    created_date TIMESTAMP,
    last_modified_date TIMESTAMP
);

CREATE TABLE IF NOT EXISTS prescriptions (
    id UUID PRIMARY KEY,
    appointment_id UUID NOT NULL UNIQUE REFERENCES appointments(id),
    patient_id UUID NOT NULL REFERENCES patients(id),
    doctor_id UUID NOT NULL REFERENCES users(id),
    diagnosis TEXT,
    chief_complaints TEXT,
    medicines TEXT,
    lab_orders TEXT,
    created_date TIMESTAMP,
    last_modified_date TIMESTAMP
);

CREATE TABLE IF NOT EXISTS billing (
    id UUID PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES patients(id),
    invoice_number VARCHAR(30) NOT NULL UNIQUE,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    discount NUMERIC(12, 2) DEFAULT 0,
    paid_amount NUMERIC(12, 2) DEFAULT 0,
    status VARCHAR(50) NOT NULL,
    line_items TEXT,
    created_date TIMESTAMP,
    last_modified_date TIMESTAMP
);

CREATE TABLE IF NOT EXISTS beds (
    id UUID PRIMARY KEY,
    bed_number VARCHAR(20) NOT NULL,
    ward_name VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    patient_id UUID REFERENCES patients(id),
    created_date TIMESTAMP,
    last_modified_date TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY,
    entity_name VARCHAR(100) NOT NULL,
    operation VARCHAR(50) NOT NULL,
    entity_id VARCHAR(255) NOT NULL,
    old_values TEXT,
    new_values TEXT,
    user_id VARCHAR(255) NOT NULL,
    user_name VARCHAR(200) NOT NULL,
    timestamp TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sequence_counters (
    id UUID PRIMARY KEY,
    sequence_key VARCHAR(150) NOT NULL UNIQUE,
    current_value BIGINT NOT NULL,
    version BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_patient_mobile ON patients (mobile_number);
CREATE INDEX IF NOT EXISTS idx_patient_name ON patients (full_name);
CREATE INDEX IF NOT EXISTS idx_appointment_date ON appointments (appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointment_doctor_date ON appointments (doctor_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointment_status ON appointments (status);
CREATE INDEX IF NOT EXISTS idx_appointment_patient_date ON appointments (patient_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointment_doctor_token ON appointments (doctor_id, token_number);
CREATE INDEX IF NOT EXISTS idx_prescription_patient_date ON prescriptions (patient_id, created_date);
CREATE INDEX IF NOT EXISTS idx_prescription_doctor_date ON prescriptions (doctor_id, created_date);
CREATE INDEX IF NOT EXISTS idx_billing_status ON billing (status);
CREATE INDEX IF NOT EXISTS idx_billing_patient_date ON billing (patient_id, created_date);
CREATE INDEX IF NOT EXISTS idx_bed_status ON beds (status);
CREATE INDEX IF NOT EXISTS idx_bed_ward ON beds (ward_name);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs (timestamp);
