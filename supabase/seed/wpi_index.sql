-- WPI seed data (OEA Government of India — January values)
CREATE TABLE IF NOT EXISTS wpi_index (
  month        TEXT PRIMARY KEY,  -- format: "YYYY-MM"
  index_value  NUMERIC NOT NULL,
  source       TEXT DEFAULT 'OEA_GoI'
);

INSERT INTO wpi_index (month, index_value) VALUES
  ('2020-01', 121.1),
  ('2021-01', 127.3),
  ('2022-01', 143.6),
  ('2023-01', 154.2),
  ('2024-01', 158.8),
  ('2025-01', 163.4)
ON CONFLICT (month) DO UPDATE SET index_value = EXCLUDED.index_value;
