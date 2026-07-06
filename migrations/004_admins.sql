-- 관리자 역할 (admin 컬렉션)
-- Supabase SQL Editor 등에서 실행하세요.
--
-- 최초 관리자 부여 예시:
-- INSERT INTO admins (user_id, role) VALUES ('<users.id UUID>', 'admin');

CREATE TABLE IF NOT EXISTS admins (
  user_id    UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admins_role ON admins (role);
