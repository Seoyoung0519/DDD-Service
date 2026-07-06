-- 운영 콘텐츠 및 관리 테이블 (기존 테이블이 있어도 안전하게 실행 가능)

-- notices
CREATE TABLE IF NOT EXISTS notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notices ADD COLUMN IF NOT EXISTS content text NOT NULL DEFAULT '';
ALTER TABLE notices ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT false;
ALTER TABLE notices ADD COLUMN IF NOT EXISTS published_at timestamptz;

-- banners
CREATE TABLE IF NOT EXISTS banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  image_url text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE banners ADD COLUMN IF NOT EXISTS link_url text;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS sort_order int NOT NULL DEFAULT 0;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS starts_at timestamptz;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS ends_at timestamptz;

-- picks
CREATE TABLE IF NOT EXISTS picks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE picks ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE picks ADD COLUMN IF NOT EXISTS book_isbn text;
ALTER TABLE picks ADD COLUMN IF NOT EXISTS cover_image_url text;
ALTER TABLE picks ADD COLUMN IF NOT EXISTS sort_order int NOT NULL DEFAULT 0;
ALTER TABLE picks ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- dictionary_entries
CREATE TABLE IF NOT EXISTS dictionary_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  term text NOT NULL,
  definition text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE dictionary_entries ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE dictionary_entries ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT false;

-- events
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE events ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT '';
ALTER TABLE events ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS link_url text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- reports
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_user_id uuid NOT NULL,
  target_type text NOT NULL,
  target_id text NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE reports ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS admin_note text;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS resolved_at timestamptz;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS resolved_by uuid;

-- inquiries
CREATE TABLE IF NOT EXISTS inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subject text NOT NULL,
  content text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS admin_reply text;
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS replied_at timestamptz;
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS replied_by uuid;

-- status CHECK 제약 (없을 때만 추가)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'reports_status_check'
  ) THEN
    ALTER TABLE reports ADD CONSTRAINT reports_status_check
      CHECK (status IN ('pending', 'resolved', 'dismissed'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'inquiries_status_check'
  ) THEN
    ALTER TABLE inquiries ADD CONSTRAINT inquiries_status_check
      CHECK (status IN ('open', 'answered', 'closed'));
  END IF;
END $$;

-- indexes
CREATE INDEX IF NOT EXISTS idx_notices_published ON notices (is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_banners_active ON banners (is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_picks_active ON picks (is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_dictionary_published ON dictionary_entries (is_published, term);
CREATE INDEX IF NOT EXISTS idx_events_active ON events (is_active, starts_at);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_user ON inquiries (user_id, created_at DESC);
