ALTER TABLE wish_entries ADD COLUMN weapon_fate_state TEXT
CHECK(weapon_fate_state IS NULL OR (banner_type = 'weapon' AND weapon_fate_state IN ('none','current_1','current_2','legacy_1','legacy_2','legacy_3')));
