-- Stock de cocina — ejecutar en Supabase SQL Editor
CREATE TABLE IF NOT EXISTS stock_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  cantidad      NUMERIC(10,2) NOT NULL DEFAULT 0,
  unidad        TEXT NOT NULL DEFAULT 'u',
  minimo        NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, ingredient_id)
);
CREATE INDEX IF NOT EXISTS idx_stock_items_user ON stock_items(user_id);
ALTER TABLE stock_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_stock_items" ON stock_items FOR ALL USING (true) WITH CHECK (true);
