-- Seed data for development/testing

-- Sample anonymous profile
INSERT INTO wp_profiles (id, is_anonymous, preferred_unit, timezone) VALUES 
('00000000-0000-0000-0000-000000000001', true, 'lbs', 'America/New_York');

-- Sample weight entries for the anonymous user
INSERT INTO wp_entries (user_id, weight, recorded_at) VALUES 
('00000000-0000-0000-0000-000000000001', 180.5, '2025-01-01 08:00:00+00'),
('00000000-0000-0000-0000-000000000001', 179.8, '2025-01-08 08:00:00+00'),
('00000000-0000-0000-0000-000000000001', 178.2, '2025-01-15 08:00:00+00'),
('00000000-0000-0000-0000-000000000001', 177.6, '2025-01-22 08:00:00+00');

-- Sample goal for the anonymous user
INSERT INTO wp_goals (user_id, start_weight, target_weight, target_date) VALUES 
('00000000-0000-0000-0000-000000000001', 180.5, 170.0, '2025-06-01');