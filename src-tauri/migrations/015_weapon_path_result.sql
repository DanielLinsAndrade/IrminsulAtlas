-- Unknown historical selections remain NULL; promotional does not mean chosen.
ALTER TABLE wish_entries ADD COLUMN weapon_path_result TEXT
CHECK (weapon_path_result IS NULL OR (banner_type = 'weapon' AND weapon_path_result IN ('won', 'lost', 'guaranteed')));
