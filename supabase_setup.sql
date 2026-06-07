-- =======================================================
-- English Teacher Management App Database Setup
-- Run this complete script in the Supabase SQL Editor
-- =======================================================

-- 1. Create custom types
CREATE TYPE student_level AS ENUM ('Beginner', 'Elementary', 'Intermediate', 'Advanced');

-- 2. Create Tables
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  level student_level NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  level student_level NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE group_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week >= 1 AND day_of_week <= 7), -- 1=Mon, 7=Sun
  time TIME NOT NULL
);

CREATE TABLE group_students (
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  PRIMARY KEY (group_id, student_id)
);

CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  topic TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE attendance (
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  present BOOLEAN NOT NULL DEFAULT true,
  PRIMARY KEY (class_id, student_id)
);

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  month INT NOT NULL CHECK (month >= 1 AND month <= 12),
  year INT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  paid BOOLEAN NOT NULL DEFAULT false,
  date_paid TIMESTAMPTZ,
  payment_method TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies
-- Teachers can only read, insert, update, and delete their own data

-- Students Policy
CREATE POLICY "Teachers can manage their own students"
ON students FOR ALL
TO authenticated
USING (auth.uid() = teacher_id)
WITH CHECK (auth.uid() = teacher_id);

-- Groups Policy
CREATE POLICY "Teachers can manage their own groups"
ON groups FOR ALL
TO authenticated
USING (auth.uid() = teacher_id)
WITH CHECK (auth.uid() = teacher_id);

-- Group Schedule Policy
CREATE POLICY "Teachers can manage their own group schedules"
ON group_schedule FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM groups WHERE groups.id = group_schedule.group_id AND groups.teacher_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM groups WHERE groups.id = group_schedule.group_id AND groups.teacher_id = auth.uid()));

-- Group Students Policy
CREATE POLICY "Teachers can manage their own group students"
ON group_students FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM groups WHERE groups.id = group_students.group_id AND groups.teacher_id = auth.uid()) AND
  EXISTS (SELECT 1 FROM students WHERE students.id = group_students.student_id AND students.teacher_id = auth.uid())
)
WITH CHECK (
  EXISTS (SELECT 1 FROM groups WHERE groups.id = group_students.group_id AND groups.teacher_id = auth.uid()) AND
  EXISTS (SELECT 1 FROM students WHERE students.id = group_students.student_id AND students.teacher_id = auth.uid())
);

-- Classes Policy
CREATE POLICY "Teachers can manage their own classes"
ON classes FOR ALL
TO authenticated
USING (auth.uid() = teacher_id)
WITH CHECK (auth.uid() = teacher_id);

-- Attendance Policy
CREATE POLICY "Teachers can manage their own attendance records"
ON attendance FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM classes WHERE classes.id = attendance.class_id AND classes.teacher_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM classes WHERE classes.id = attendance.class_id AND classes.teacher_id = auth.uid()));

-- Payments Policy
CREATE POLICY "Teachers can manage their own payments records"
ON payments FOR ALL
TO authenticated
USING (auth.uid() = teacher_id)
WITH CHECK (auth.uid() = teacher_id);

-- =======================================================
-- MIGRATION: Run this if you already have the database set up
-- ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_method TEXT;
-- =======================================================

-- =======================================================
-- Setup complete! Environment should be ready to go.
-- =======================================================
