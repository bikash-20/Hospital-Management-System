-- Doctor Schedules table
CREATE TABLE IF NOT EXISTS doctor_schedules (
    id UUID PRIMARY KEY,
    doctor_id UUID NOT NULL REFERENCES users(id),
    day_of_week VARCHAR(20) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_date TIMESTAMP,
    last_modified_date TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_schedule_doctor_day ON doctor_schedules (doctor_id, day_of_week);

-- Lab Results table
CREATE TABLE IF NOT EXISTS lab_results (
    id UUID PRIMARY KEY,
    appointment_id UUID NOT NULL REFERENCES appointments(id),
    patient_id UUID NOT NULL REFERENCES patients(id),
    ordered_by_id UUID NOT NULL REFERENCES users(id),
    test_name VARCHAR(200) NOT NULL,
    priority VARCHAR(50),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    result_value TEXT,
    notes TEXT,
    completed_at TIMESTAMP,
    created_date TIMESTAMP,
    last_modified_date TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_lab_patient ON lab_results (patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_appointment ON lab_results (appointment_id);
CREATE INDEX IF NOT EXISTS idx_lab_status ON lab_results (status);
