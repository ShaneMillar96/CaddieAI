-- CaddieAI Database Migration V1.4.0
-- Insert accurate Faughan Valley Golf Centre data with enhanced fields

-- Insert accurate Faughan Valley Golf Centre course data
INSERT INTO courses (
    id,
    name,
    description,
    address,
    city,
    country,
    phone,
    email,
    par_total,
    total_holes,
    yardage_total,
    course_rating,
    slope_rating,
    difficulty,
    location,
    boundary,
    timezone,
    green_fee_range,
    amenities,
    course_metadata,
    is_active,
    created_at,
    updated_at
) VALUES (
    'a1b2c3d4-e5f6-4789-a012-123456789abc',
    'Faughan Valley Golf Centre',
    'An 18-hole parkland golf course built on the naturally free draining banks of the River Faughan. The River Faughan borders the course for some 2500 yards and the many water features within the course ensure a stern test of golfing ability.',
    '8 Carmoney Road, Eglinton',
    'Londonderry',
    'Northern Ireland',
    '02871 860707',
    'info@faughanvalleygolfclub.co.uk',
    68,
    18,
    5800,
    67.0,
    116,
    'moderate',
    ST_SetSRID(ST_MakePoint(-7.24823457304385, 55.020930777624045), 4326),
    ST_SetSRID(ST_Buffer(ST_MakePoint(-7.24823457304385, 55.020930777624045)::geography, 800)::geometry, 4326),
    'Europe/London',
    '{"weekday_range": "£15-25", "weekend_range": "£20-30", "twilight_range": "£10-15"}',
    '{"clubhouse": true, "pro_shop": true, "restaurant": true, "bar": true, "driving_range": true, "putting_green": true, "parking": true, "buggy_hire": true, "club_hire": true, "lessons": true}',
    '{"designer": "David Forbes", "year_opened": 2001, "course_type": "parkland", "signature_feature": "River Faughan water features", "updated_data": "accurate_2024"}',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Insert accurate Faughan Valley Golf Club hole data with enhanced fields
INSERT INTO holes (
    id, course_id, hole_number, name, par, hole_type, yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index, hole_tips, simple_hazards, hole_metadata,
    created_at, updated_at
) VALUES
-- Front Nine
(gen_random_uuid(), 'a1b2c3d4-e5f6-4789-a012-123456789abc', 1, 'Under Orders', 4, 'par4', 332, 332, 322, 322, 15, 262, 4, 13, 'Keep your tee shot down the left side of the fairway, giving you the best line into the green. Don''t attack the flag, this green can be firm. Avoid greenside bunker just short right.', '[]', '{"accurate_data": true, "source": "official_course_website"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

(gen_random_uuid(), 'a1b2c3d4-e5f6-4789-a012-123456789abc', 2, 'Fisherman Fore', 3, 'par3', 172, 172, 164, 164, 7, 159, 3, 15, 'Elevated tee box on this Par 3, downwind plays a club less than yardage indicates, being short of the green presents a challenging chip shot.', '[]', '{"accurate_data": true, "source": "official_course_website"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

(gen_random_uuid(), 'a1b2c3d4-e5f6-4789-a012-123456789abc', 3, 'The Lake', 5, 'par5', 493, 493, 482, 482, 11, 335, 4, 3, 'Regulation Par 5, try and find fairway with your 2nd shot, green is surrounded by water and protected with a bunker on the left front edge.', '[{"type": "water", "description": "Green surrounded by water"}, {"type": "bunker", "description": "Left front edge of green"}]', '{"accurate_data": true, "source": "official_course_website"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

(gen_random_uuid(), 'a1b2c3d4-e5f6-4789-a012-123456789abc', 4, 'Water Jump', 4, 'par4', 350, 350, 321, 321, 5, 242, 4, 5, 'Depending upon tee position and wind direction this may not be a driver hole. 2nd shot over the water uphill should stop just short of the pin to allow for an uphill putt.', '[{"type": "water", "description": "Water hazard before green on approach shot"}]', '{"accurate_data": true, "source": "official_course_website"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

(gen_random_uuid(), 'a1b2c3d4-e5f6-4789-a012-123456789abc', 5, 'The Dam', 4, 'par4', 399, 399, 391, 391, 1, 356, 4, 1, 'The hardest hole on the course requires a good tee shot allowing you to reach the green in two. The green is elevated and deceptively long, depending upon pin position use enough club to carry to the flag.', '[]', '{"accurate_data": true, "source": "official_course_website"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

(gen_random_uuid(), 'a1b2c3d4-e5f6-4789-a012-123456789abc', 6, 'Binevenagh', 4, 'par4', 402, 402, 378, 378, 3, 402, 5, 9, 'Fairway falls from right to left with many hazards along the left. Try and place your tee shot down the right to allow for this. Then choose to go for the green or lay up for a safe bogey.', '[{"type": "hazards", "description": "Many hazards along the left side"}]', '{"accurate_data": true, "source": "official_course_website"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

(gen_random_uuid(), 'a1b2c3d4-e5f6-4789-a012-123456789abc', 7, 'Whins', 3, 'par3', 139, 139, 121, 121, 13, 115, 3, 17, 'Elevated Green on this short Par 3, Will normally play one more club more than the yardage indicates, being short of the green presents a challenging chip shot.', '[]', '{"accurate_data": true, "source": "official_course_website"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

(gen_random_uuid(), 'a1b2c3d4-e5f6-4789-a012-123456789abc', 8, 'The Field', 3, 'par3', 183, 183, 162, 162, 9, 140, 3, 11, 'A tough Par 3, out of bounds carries the length of the hole on the left. Ideally hit the green or lay up short. A bogey here is no disgrace.', '[{"type": "out_of_bounds", "description": "Out of bounds runs length of hole on left side"}]', '{"accurate_data": true, "source": "official_course_website"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

(gen_random_uuid(), 'a1b2c3d4-e5f6-4789-a012-123456789abc', 9, 'Big Easy', 5, 'par5', 415, 415, 405, 405, 17, 405, 5, 7, 'To finish the front nine a gentle Par 5 with out of bounds along the left. Stay straight off the tee and a par is a sure thing. Approach shot should be aimed a little left of the pin.', '[{"type": "out_of_bounds", "description": "Out of bounds along the left side"}]', '{"accurate_data": true, "source": "official_course_website"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Back Nine
(gen_random_uuid(), 'a1b2c3d4-e5f6-4789-a012-123456789abc', 10, 'The Pulpit', 3, 'par3', 195, 195, 191, 191, 4, 141, 3, 14, 'The Pulpit, the most challenging par 3 on the course. The shielded elevated tee can give false impression of both wind and distance. Requires a long tee shot onto the bunker protected green.', '[{"type": "bunker", "description": "Bunker protected green"}]', '{"accurate_data": true, "source": "official_course_website"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

(gen_random_uuid(), 'a1b2c3d4-e5f6-4789-a012-123456789abc', 11, 'Shanks', 4, 'par4', 336, 336, 321, 321, 12, 273, 4, 8, 'The Signature hole, River Faughan all along the right, prevailing wind normally off the left. Centre to right of fairway off the tee will leave the best line in for your approach to the bunker protected green.', '[{"type": "water", "description": "River Faughan runs along right side"}, {"type": "bunker", "description": "Bunker protected green"}]', '{"accurate_data": true, "source": "official_course_website"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

(gen_random_uuid(), 'a1b2c3d4-e5f6-4789-a012-123456789abc', 12, 'Pampas', 4, 'par4', 234, 234, 229, 229, 18, 218, 4, 6, 'Risk / Reward hole. This short Par 4 hole has hazards on both sides. The green is elevated, narrow and difficult to hold if playing in from the left, best line is always just right of the flag.', '[{"type": "hazards", "description": "Hazards on both sides"}, {"type": "elevated_green", "description": "Elevated, narrow green"}]', '{"accurate_data": true, "source": "official_course_website"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

(gen_random_uuid(), 'a1b2c3d4-e5f6-4789-a012-123456789abc', 13, 'Lynch''s', 4, 'par4', 278, 278, 267, 267, 16, 240, 4, 18, 'Gentle downhill Par 4, easiest hole on the course with the only real danger on the right, a great chance to get a shot back on the course.', '[{"type": "danger", "description": "Danger on the right side"}]', '{"accurate_data": true, "source": "official_course_website"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

(gen_random_uuid(), 'a1b2c3d4-e5f6-4789-a012-123456789abc', 14, 'The Bridge', 4, 'par4', 321, 321, 289, 289, 2, 200, 4, 16, 'A tough tee shot with water left and right. Accuracy is the safest bet so use a club that will find the fairway. Get your yardage correct on approach to leave you a straight-forward putt on this mildly contoured green.', '[{"type": "water", "description": "Water left and right of tee shot"}]', '{"accurate_data": true, "source": "official_course_website"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

(gen_random_uuid(), 'a1b2c3d4-e5f6-4789-a012-123456789abc', 15, 'Quarry', 4, 'par4', 327, 327, 320, 320, 14, 246, 4, 10, 'Smooth dog-leg left to right normally helped by the prevailing wind. Place your tee shot middle to left of the fairway, leaving you the best line for your approach to this slightly elevated green.', '[]', '{"accurate_data": true, "source": "official_course_website"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

(gen_random_uuid(), 'a1b2c3d4-e5f6-4789-a012-123456789abc', 16, 'Bell Tower', 3, 'par3', 188, 188, 180, 180, 8, 136, 3, 12, 'Another demanding Par 3 requiring a solid tee shot. Better to be left of the pin giving you and easy chip shot or putt.', '[]', '{"accurate_data": true, "source": "official_course_website"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

(gen_random_uuid(), 'a1b2c3d4-e5f6-4789-a012-123456789abc', 17, 'The Hollow', 4, 'par4', 322, 322, 315, 315, 10, 308, 4, 2, 'A lavish wide open fairway with out of bounds along the right hand side. Good position off the tee will make this a birdie opportunity. The green runs left to right but is easily read.', '[{"type": "out_of_bounds", "description": "Out of bounds along right side"}]', '{"accurate_data": true, "source": "official_course_website"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

(gen_random_uuid(), 'a1b2c3d4-e5f6-4789-a012-123456789abc', 18, 'Home Straight', 4, 'par4', 367, 367, 356, 356, 6, 336, 4, 4, 'A great finishing hole, with out of bounds both left and right. Find the fairway from the tee, avoid the right hand greenside bunker to ensure you have a great finish to your round.', '[{"type": "out_of_bounds", "description": "Out of bounds both left and right"}, {"type": "bunker", "description": "Right hand greenside bunker"}]', '{"accurate_data": true, "source": "official_course_website"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Verify course data insertion
SELECT 
    'Faughan Valley data inserted successfully' as status,
    COUNT(*) as total_holes,
    SUM(par) as total_par,
    SUM(yardage_white) as total_yardage
FROM holes h
JOIN courses c ON h.course_id = c.id
WHERE c.name = 'Faughan Valley Golf Centre';