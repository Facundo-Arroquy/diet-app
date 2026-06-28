-- ============================================================
-- DIET APP — SCHEMA
-- Ejecutar en Supabase SQL Editor (en orden)
-- ============================================================

-- Extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre     TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_users" ON users FOR ALL USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- CATEGORIES  (jerarquía, parent_id nullable)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre     TEXT NOT NULL,
  parent_id  UUID REFERENCES categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_categories" ON categories FOR ALL USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- INGREDIENTS
-- macros por 100 g + gramos por porción propios del ingrediente
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ingredients (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre           TEXT NOT NULL,
  category_id      UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  calorias         NUMERIC(8,2) NOT NULL DEFAULT 0,
  proteinas        NUMERIC(8,2) NOT NULL DEFAULT 0,
  carbohidratos    NUMERIC(8,2) NOT NULL DEFAULT 0,
  grasas           NUMERIC(8,2) NOT NULL DEFAULT 0,
  fibra            NUMERIC(8,2) NOT NULL DEFAULT 0,
  grams_per_portion NUMERIC(8,2) NOT NULL DEFAULT 100,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ingredients_category ON ingredients(category_id);
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_ingredients" ON ingredients FOR ALL USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- MEAL TYPES  (por usuario, ej: Desayuno, Almuerzo, Cena)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS meal_types (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nombre     TEXT NOT NULL,
  orden      INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_meal_types_user ON meal_types(user_id);
ALTER TABLE meal_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_meal_types" ON meal_types FOR ALL USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- DIET CATEGORY RULES
-- Porciones requeridas por categoría para una comida del usuario
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS diet_category_rules (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  meal_type_id      UUID NOT NULL REFERENCES meal_types(id) ON DELETE CASCADE,
  category_id       UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  required_portions NUMERIC(8,2) NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, meal_type_id, category_id)
);
CREATE INDEX IF NOT EXISTS idx_diet_category_rules_user_meal ON diet_category_rules(user_id, meal_type_id);
ALTER TABLE diet_category_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_diet_category_rules" ON diet_category_rules FOR ALL USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- DIET MACRO TARGETS
-- Objetivo de macros por comida del usuario (campos null = sin objetivo)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS diet_macro_targets (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  meal_type_id   UUID NOT NULL REFERENCES meal_types(id) ON DELETE CASCADE,
  calorias       NUMERIC(8,2),
  proteinas      NUMERIC(8,2),
  carbohidratos  NUMERIC(8,2),
  grasas         NUMERIC(8,2),
  fibra          NUMERIC(8,2),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, meal_type_id)
);
CREATE INDEX IF NOT EXISTS idx_diet_macro_targets_user_meal ON diet_macro_targets(user_id, meal_type_id);
ALTER TABLE diet_macro_targets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_diet_macro_targets" ON diet_macro_targets FOR ALL USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- MEAL LOGS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS meal_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  meal_type_id UUID NOT NULL REFERENCES meal_types(id) ON DELETE RESTRICT,
  fecha        DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_meal_logs_user_fecha ON meal_logs(user_id, fecha);
ALTER TABLE meal_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_meal_logs" ON meal_logs FOR ALL USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- MEAL LOG ITEMS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS meal_log_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_log_id   UUID NOT NULL REFERENCES meal_logs(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE RESTRICT,
  grams         NUMERIC(8,2) NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_meal_log_items_log ON meal_log_items(meal_log_id);
ALTER TABLE meal_log_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_meal_log_items" ON meal_log_items FOR ALL USING (true) WITH CHECK (true);
