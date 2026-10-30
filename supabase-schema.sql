-- Supabase/PostgreSQL Schema for Fito (Custom Auth)
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE (Custom Auth)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  daily_calorie_target INTEGER NOT NULL DEFAULT 2000,
  target_protein_g INTEGER NOT NULL DEFAULT 150,
  target_carbs_g INTEGER NOT NULL DEFAULT 200,
  target_fat_g INTEGER NOT NULL DEFAULT 67,
  streak_days INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================
-- MEALS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS meals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  meal_name TEXT NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('Kahvaltı', 'Öğle', 'Akşam', 'Ara Öğün')),
  portion_count INTEGER NOT NULL DEFAULT 1,
  total_grams DECIMAL(10,2) NOT NULL DEFAULT 0,
  calories INTEGER NOT NULL DEFAULT 0,
  protein_g DECIMAL(10,2) NOT NULL DEFAULT 0,
  carbs_g DECIMAL(10,2) NOT NULL DEFAULT 0,
  fat_g DECIMAL(10,2) NOT NULL DEFAULT 0,
  image_url TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE, -- YYYY-MM-DD format for date-based queries
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_meals_user_id ON meals(user_id);
CREATE INDEX IF NOT EXISTS idx_meals_created_at ON meals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_meals_meal_type ON meals(meal_type);
CREATE INDEX IF NOT EXISTS idx_meals_user_date ON meals(user_id, date DESC);

-- ============================================
-- WATER_LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS water_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE, -- YYYY-MM-DD format
  amount_ml INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_water_logs_user_id ON water_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_water_logs_date ON water_logs(date DESC);
CREATE INDEX IF NOT EXISTS idx_water_logs_user_date ON water_logs(user_id, date DESC);

-- Trigger for water_logs updated_at
DROP TRIGGER IF EXISTS update_water_logs_updated_at ON water_logs;
CREATE TRIGGER update_water_logs_updated_at
  BEFORE UPDATE ON water_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- AI_CHATS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS ai_chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'ai')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_ai_chats_user_id ON ai_chats(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chats_created_at ON ai_chats(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chats ENABLE ROW LEVEL SECURITY;

-- Users policies - users can only see/update their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (id = auth.uid()::uuid);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (id = auth.uid()::uuid);

-- Meals policies
CREATE POLICY "Users can view own meals" ON meals
  FOR SELECT USING (user_id = auth.uid()::uuid);

CREATE POLICY "Users can insert own meals" ON meals
  FOR INSERT WITH CHECK (user_id = auth.uid()::uuid);

CREATE POLICY "Users can update own meals" ON meals
  FOR UPDATE USING (user_id = auth.uid()::uuid);

CREATE POLICY "Users can delete own meals" ON meals
  FOR DELETE USING (user_id = auth.uid()::uuid);

-- Water Logs policies
CREATE POLICY "Users can view own water logs" ON water_logs
  FOR SELECT USING (user_id = auth.uid()::uuid);

CREATE POLICY "Users can insert own water logs" ON water_logs
  FOR INSERT WITH CHECK (user_id = auth.uid()::uuid);

CREATE POLICY "Users can update own water logs" ON water_logs
  FOR UPDATE USING (user_id = auth.uid()::uuid);

-- AI Chats policies
CREATE POLICY "Users can view own chats" ON ai_chats
  FOR SELECT USING (user_id = auth.uid()::uuid);

CREATE POLICY "Users can insert own chats" ON ai_chats
  FOR INSERT WITH CHECK (user_id = auth.uid()::uuid);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for users updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SAMPLE VIEW: Daily Nutrition Summary
-- ============================================
CREATE OR REPLACE VIEW daily_nutrition_summary AS
SELECT
  m.user_id,
  DATE(m.created_at AT TIME ZONE 'UTC') as date,
  SUM(m.calories) as total_calories,
  SUM(m.protein_g) as total_protein_g,
  SUM(m.carbs_g) as total_carbs_g,
  SUM(m.fat_g) as total_fat_g,
  COUNT(*) as meal_count
FROM meals m
GROUP BY m.user_id, DATE(m.created_at AT TIME ZONE 'UTC');

-- Grant permissions
GRANT SELECT ON daily_nutrition_summary TO authenticated;