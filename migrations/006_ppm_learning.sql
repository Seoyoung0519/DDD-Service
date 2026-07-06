-- PPM 학습: 타이머 세션 추천 시간 + 세션별 실측 PPM 기록
ALTER TABLE reading_sessions ADD COLUMN IF NOT EXISTS planned_minutes numeric;
ALTER TABLE reading_sessions ADD COLUMN IF NOT EXISTS actual_ppm numeric;
