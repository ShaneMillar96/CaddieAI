
-- CaddieAI Database Migration V1.6.0
-- Northern Ireland courses + hole data (Batch 1: completed for 10 courses;)

/************************************************************
 * COURSES
 ************************************************************/

-- Royal Portrush - Dunluce Links
INSERT INTO courses (
    name, description, address, city, country, phone, email,
    par_total, total_holes, yardage_total, course_rating, slope_rating, difficulty,
    location, boundary, timezone, green_fee_range, amenities, course_metadata,
    is_active, created_at, updated_at
) VALUES (
             'Royal Portrush Golf Club - Dunluce Links',
             'Championship links; Open venue (1951, 2019, 2025).',
             'Dunluce Rd, Portrush BT56 8JQ',
             'Portrush',
             'Northern Ireland',
             NULL,
             NULL,
             71,
             18,
             7381,
             NULL,
             NULL,
             NULL,
             ST_SetSRID(ST_MakePoint(-6.635, 55.200), 4326),
             ST_SetSRID(ST_Buffer(ST_MakePoint(-6.635, 55.200)::geography, 900)::geometry, 4326),
             'Europe/London',
             NULL,
             NULL,
             '{"website":"https://www.royalportrushgolfclub.com/"}',
             TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
         );

-- Royal Portrush - Valley Links
INSERT INTO courses (
    name, description, address, city, country, phone, email,
    par_total, total_holes, yardage_total, course_rating, slope_rating, difficulty,
    location, boundary, timezone, green_fee_range, amenities, course_metadata,
    is_active, created_at, updated_at
) VALUES (
             'Royal Portrush Golf Club - Valley Links',
             'Second links course at Royal Portrush.',
             'Dunluce Rd, Portrush BT56 8JQ',
             'Portrush',
             'Northern Ireland',
             NULL,
             NULL,
             70,
             18,
             NULL,
             NULL,
             NULL,
             NULL,
             ST_SetSRID(ST_MakePoint(-6.635, 55.200), 4326),
             ST_SetSRID(ST_Buffer(ST_MakePoint(-6.635, 55.200)::geography, 900)::geometry, 4326),
             'Europe/London',
             NULL,
             NULL,
             '{"website":"https://www.royalportrushgolfclub.com/courses/the-valley/"}',
             TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
         );

-- Royal County Down - Championship Links
INSERT INTO courses (
    name, description, address, city, country, phone, email,
    par_total, total_holes, yardage_total, course_rating, slope_rating, difficulty,
    location, boundary, timezone, green_fee_range, amenities, course_metadata,
    is_active, created_at, updated_at
) VALUES (
             'Royal County Down - Championship Links',
             'World #1-ranked links in Murlough Nature Reserve.',
             '36 Golf Links Rd, Newcastle BT33 0AN',
             'Newcastle',
             'Northern Ireland',
             '+44 28 4372 3314',
             'golf@royalcountydown.org',
             71,
             18,
             NULL,
             NULL,
             NULL,
             NULL,
             ST_SetSRID(ST_MakePoint(-5.884, 54.218), 4326),
             ST_SetSRID(ST_Buffer(ST_MakePoint(-5.884, 54.218)::geography, 900)::geometry, 4326),
             'Europe/London',
             NULL,
             NULL,
             '{"website":"https://www.royalcountydown.org/"}',
             TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
         );

-- Royal County Down - Annesley Links
INSERT INTO courses (
    name, description, address, city, country, phone, email,
    par_total, total_holes, yardage_total, course_rating, slope_rating, difficulty,
    location, boundary, timezone, green_fee_range, amenities, course_metadata,
    is_active, created_at, updated_at
) VALUES (
             'Royal County Down - Annesley Links',
             'Shorter links; ideal warm-up to Championship course.',
             '36 Golf Links Rd, Newcastle BT33 0AN',
             'Newcastle',
             'Northern Ireland',
             '+44 28 4372 3314',
             'golf@royalcountydown.org',
             66,
             18,
             NULL,
             NULL,
             NULL,
             NULL,
             ST_SetSRID(ST_MakePoint(-5.884, 54.218), 4326),
             ST_SetSRID(ST_Buffer(ST_MakePoint(-5.884, 54.218)::geography, 900)::geometry, 4326),
             'Europe/London',
             NULL,
             NULL,
             '{"website":"https://www.royalcountydown.org/"}',
             TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
         );

-- Portstewart - Strand Course
INSERT INTO courses (
    name, description, address, city, country, phone, email,
    par_total, total_holes, yardage_total, course_rating, slope_rating, difficulty,
    location, boundary, timezone, green_fee_range, amenities, course_metadata,
    is_active, created_at, updated_at
) VALUES (
             'Portstewart Golf Club - Strand Course',
             'Championship links; hosted 2017 Irish Open.',
             'Strand Rd, Portstewart BT55 7PG',
             'Portstewart',
             'Northern Ireland',
             NULL,
             NULL,
             71,
             18,
             NULL,
             NULL,
             NULL,
             NULL,
             ST_SetSRID(ST_MakePoint(-6.7251561, 55.1715283), 4326),
             ST_SetSRID(ST_Buffer(ST_MakePoint(-6.7251561, 55.1715283)::geography, 900)::geometry, 4326),
             'Europe/London',
             NULL,
             NULL,
             '{"website":"https://www.portstewartgc.co.uk/"}',
             TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
         );

-- Castlerock - Mussenden Course
INSERT INTO courses (
    name, description, address, city, country, phone, email,
    par_total, total_holes, yardage_total, course_rating, slope_rating, difficulty,
    location, boundary, timezone, green_fee_range, amenities, course_metadata,
    is_active, created_at, updated_at
) VALUES (
             'Castlerock Golf Club - Mussenden Course',
             'Championship links overlooking Atlantic dunes.',
             '8 Ballyreagh Rd, Castlerock BT51 4SD',
             'Castlerock',
             'Northern Ireland',
             NULL,
             NULL,
             73,
             18,
             NULL,
             NULL,
             NULL,
             NULL,
             ST_SetSRID(ST_MakePoint(-6.78377, 55.16411), 4326),
             ST_SetSRID(ST_Buffer(ST_MakePoint(-6.78377, 55.16411)::geography, 900)::geometry, 4326),
             'Europe/London',
             NULL,
             NULL,
             '{"website":"https://www.castlerockgc.co.uk/"}',
             TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
         );

-- Ardglass Golf Club
INSERT INTO courses (
    name, description, address, city, country, phone, email,
    par_total, total_holes, yardage_total, course_rating, slope_rating, difficulty,
    location, boundary, timezone, green_fee_range, amenities, course_metadata,
    is_active, created_at, updated_at
) VALUES (
             'Ardglass Golf Club',
             'Clifftop links with historic clubhouse.',
             'Castle Pl, Ardglass BT30 7TP',
             'Ardglass',
             'Northern Ireland',
             NULL,
             NULL,
             70,
             18,
             NULL,
             NULL,
             NULL,
             NULL,
             ST_SetSRID(ST_MakePoint(-5.60591, 54.25768), 4326),
             ST_SetSRID(ST_Buffer(ST_MakePoint(-5.60591, 54.25768)::geography, 800)::geometry, 4326),
             'Europe/London',
             NULL,
             NULL,
             '{"website":"https://ardglassgolfclub.com/"}',
             TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
         );

-- Galgorm Castle Golf Club - Castle Course
INSERT INTO courses (
    name, description, address, city, country, phone, email,
    par_total, total_holes, yardage_total, course_rating, slope_rating, difficulty,
    location, boundary, timezone, green_fee_range, amenities, course_metadata,
    is_active, created_at, updated_at
) VALUES (
             'Galgorm Castle Golf Club - Castle Course',
             'Championship parkland; NI Open & Irish Open host.',
             'Galgorm Rd, Ballymena BT42 1HL',
             'Ballymena',
             'Northern Ireland',
             '+44 28 2565 2707',
             NULL,
             72,
             18,
             7276,
             NULL,
             NULL,
             NULL,
             ST_SetSRID(ST_MakePoint(-6.312182, 54.855091), 4326),
             ST_SetSRID(ST_Buffer(ST_MakePoint(-6.312182, 54.855091)::geography, 800)::geometry, 4326),
             'Europe/London',
             NULL,
             NULL,
             '{"website":"https://www.galgormcastle.com/"}',
             TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
         );

-- Malone Golf Club (Drumbridge/Ballydrain)
INSERT INTO courses (
    name, description, address, city, country, phone, email,
    par_total, total_holes, yardage_total, course_rating, slope_rating, difficulty,
    location, boundary, timezone, green_fee_range, amenities, course_metadata,
    is_active, created_at, updated_at
) VALUES (
             'Malone Golf Club (Drumbridge/Ballydrain)',
             '27-hole parkland with 20-acre lake; main 18 shown.',
             '240 Upper Malone Rd, Belfast BT17 9LB',
             'Belfast',
             'Northern Ireland',
             NULL,
             NULL,
             70,
             18,
             6689,
             NULL,
             NULL,
             NULL,
             ST_SetSRID(ST_MakePoint(-5.975006, 54.539597), 4326),
             ST_SetSRID(ST_Buffer(ST_MakePoint(-5.975006, 54.539597)::geography, 900)::geometry, 4326),
             'Europe/London',
             NULL,
             NULL,
             '{"website":"https://malonegolfclub.co.uk/"}',
             TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
         );

-- Belvoir Park Golf Club
INSERT INTO courses (
    name, description, address, city, country, phone, email,
    par_total, total_holes, yardage_total, course_rating, slope_rating, difficulty,
    location, boundary, timezone, green_fee_range, amenities, course_metadata,
    is_active, created_at, updated_at
) VALUES (
             'Belvoir Park Golf Club',
             'Harry Colt-designed parkland in Belfast.',
             '73 Church Rd, Belfast BT8 7AN',
             'Belfast',
             'Northern Ireland',
             NULL,
             NULL,
             71,
             18,
             6595,
             NULL,
             NULL,
             NULL,
             ST_SetSRID(ST_MakePoint(-5.914187, 54.561466), 4326),
             ST_SetSRID(ST_Buffer(ST_MakePoint(-5.914187, 54.561466)::geography, 700)::geometry, 4326),
             'Europe/London',
             NULL,
             NULL,
             '{"website":"https://www.belvoirparkgolfclub.com/"}',
             TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
         );

-- Holywood Golf Club
INSERT INTO courses (
    name, description, address, city, country, phone, email,
    par_total, total_holes, yardage_total, course_rating, slope_rating, difficulty,
    location, boundary, timezone, green_fee_range, amenities, course_metadata,
    is_active, created_at, updated_at
) VALUES (
             'Holywood Golf Club',
             'Parkland home club of Rory McIlroy.',
             'Nuns Walk, Holywood BT18 9LE',
             'Holywood',
             'Northern Ireland',
             '+44 28 9042 3135',
             'info@holywoodgolfclub.co.uk',
             69,
             18,
             6019,
             NULL,
             NULL,
             NULL,
             ST_SetSRID(ST_MakePoint(-5.8247, 54.639), 4326),
             ST_SetSRID(ST_Buffer(ST_MakePoint(-5.8247, 54.639)::geography, 700)::geometry, 4326),
             'Europe/London',
             NULL,
             NULL,
             '{"website":"https://www.holywoodgolfclub.co.uk/"}',
             TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
         );

/************************************************************
 * HOLES — VERIFIED COURSES
 ************************************************************/

-- Royal County Down - Championship Links (official scorecard)
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES
-- Front Nine
((SELECT id FROM courses WHERE name='Royal County Down - Championship Links'),1,NULL,5,'par5',523,NULL,539,483,13,483,5,13,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
((SELECT id FROM courses WHERE name='Royal County Down - Championship Links'),2,NULL,4,'par4',424,NULL,444,344,9,344,4,3,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
((SELECT id FROM courses WHERE name='Royal County Down - Championship Links'),3,NULL,4,'par4',475,NULL,475,423,3,423,5,9,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
((SELECT id FROM courses WHERE name='Royal County Down - Championship Links'),4,NULL,3,'par3',215,NULL,229,159,15,159,3,15,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
((SELECT id FROM courses WHERE name='Royal County Down - Championship Links'),5,NULL,4,'par4',429,NULL,440,395,7,395,4,7,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
((SELECT id FROM courses WHERE name='Royal County Down - Championship Links'),6,NULL,4,'par4',369,NULL,396,338,11,338,4,1,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
((SELECT id FROM courses WHERE name='Royal County Down - Championship Links'),7,NULL,3,'par3',135,NULL,144,113,17,113,3,17,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
((SELECT id FROM courses WHERE name='Royal County Down - Championship Links'),8,NULL,4,'par4',424,NULL,429,405,1,405,5,5,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
((SELECT id FROM courses WHERE name='Royal County Down - Championship Links'),9,NULL,4,'par4',427,NULL,483,429,5,429,5,11,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
-- Back Nine
((SELECT id FROM courses WHERE name='Royal County Down - Championship Links'),10,NULL,3,'par3',188,NULL,196,172,18,172,3,16,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
((SELECT id FROM courses WHERE name='Royal County Down - Championship Links'),11,NULL,4,'par4',430,NULL,442,389,8,389,4,2,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
((SELECT id FROM courses WHERE name='Royal County Down - Championship Links'),12,NULL,5,'par5',478,NULL,545,455,16,455,5,8,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
((SELECT id FROM courses WHERE name='Royal County Down - Championship Links'),13,NULL,4,'par4',423,NULL,446,409,2,409,5,12,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
((SELECT id FROM courses WHERE name='Royal County Down - Championship Links'),14,NULL,3,'par3',202,NULL,212,195,12,195,3,14,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
((SELECT id FROM courses WHERE name='Royal County Down - Championship Links'),15,NULL,4,'par4',454,NULL,468,410,4,410,5,4,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
((SELECT id FROM courses WHERE name='Royal County Down - Championship Links'),16,NULL,4,'par4',318,NULL,337,276,14,276,4,18,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
((SELECT id FROM courses WHERE name='Royal County Down - Championship Links'),17,NULL,4,'par4',416,NULL,433,374,10,374,4,6,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
((SELECT id FROM courses WHERE name='Royal County Down - Championship Links'),18,NULL,5,'par5',548,NULL,548,480,6,480,5,10,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);

-- Portstewart - Strand (official club scorecard)
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES
-- Front 9
((SELECT id FROM courses WHERE name='Portstewart Golf Club - Strand Course'),1,NULL,4,'par4',409,427,417,400,11,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
((SELECT id FROM courses WHERE name='Portstewart Golf Club - Strand Course'),2,NULL,4,'par4',322,366,360,347,7,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
((SELECT id FROM courses WHERE name='Portstewart Golf Club - Strand Course'),3,NULL,3,'par3',174,218,205,166,13,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
((SELECT id FROM courses WHERE name='Portstewart Golf Club - Strand Course'),4,NULL,5,'par5',503,583,522,442,5,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
((SELECT id FROM courses WHERE name='Portstewart Golf Club - Strand Course'),5,NULL,4,'par4',431,461,449,334,1,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
((SELECT id FROM courses WHERE name='Portstewart Golf Club - Strand Course'),6,NULL,3,'par3',120,143,135,110,15,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
((SELECT id FROM courses WHERE name='Portstewart Golf Club - Strand Course'),7,NULL,5,'par5',445,516,475,423,17,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
((SELECT id FROM courses WHERE name='Portstewart Golf Club - Strand Course'),8,NULL,4,'par4',382,445,411,357,3,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
((SELECT id FROM courses WHERE name='Portstewart Golf Club - Strand Course'),9,NULL,4,'par4',272,378,350,268,9,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
-- Back 9
((SELECT id FROM courses WHERE name='Portstewart Golf Club - Strand Course'),10,NULL,4,'par4',384,413,396,370,10,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
((SELECT id FROM courses WHERE name='Portstewart Golf Club - Strand Course'),11,NULL,4,'par4',318,407,376,312,4,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
((SELECT id FROM courses WHERE name='Portstewart Golf Club - Strand Course'),12,NULL,3,'par3',146,167,154,140,18,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
((SELECT id FROM courses WHERE name='Portstewart Golf Club - Strand Course'),13,NULL,5,'par5',502,556,535,459,16,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
((SELECT id FROM courses WHERE name='Portstewart Golf Club - Strand Course'),14,NULL,4,'par4',390,460,430,345,12,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
((SELECT id FROM courses WHERE name='Portstewart Golf Club - Strand Course'),15,NULL,3,'par3',123,168,148,104,14,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
((SELECT id FROM courses WHERE name='Portstewart Golf Club - Strand Course'),16,NULL,4,'par4',370,418,389,363,6,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
((SELECT id FROM courses WHERE name='Portstewart Golf Club - Strand Course'),17,NULL,4,'par4',388,446,428,419,2,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
((SELECT id FROM courses WHERE name='Portstewart Golf Club - Strand Course'),18,NULL,4,'par4',396,471,424,371,8,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);

-- Galgorm Castle - Castle Course (tournament yardage sheet)
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES
-- Front 9
((SELECT id FROM courses WHERE name='Galgorm Castle Golf Club - Castle Course'),1,NULL,5,'par5',455,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'[]','{"source":"tournament_official_yardage"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
((SELECT id FROM courses WHERE name='Galgorm Castle Golf Club - Castle Course'),2,NULL,4,'par4',326,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'[]','{"source":"tournament_official_yardage"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
((SELECT id FROM courses WHERE name='Galgorm Castle Golf Club - Castle Course'),3,NULL,4,'par4',380,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'[]','{"source":"tournament_official_yardage"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
((SELECT id FROM courses WHERE name='Galgorm Castle Golf Club - Castle Course'),4,NULL,4,'par4',348,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'[]','{"source":"tournament_official_yardage"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
((SELECT id FROM courses WHERE name='Galgorm Castle Golf Club - Castle Course'),5,NULL,3,'par3',208,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'[]','{"source":"tournament_official_yardage"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
((SELECT id FROM courses WHERE name='Galgorm Castle Golf Club - Castle Course'),6,NULL,4,'par4',410,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'[]','{"source":"tournament_official_yardage"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
((SELECT id FROM courses WHERE name='Galgorm Castle Golf Club - Castle Course'),7,NULL,3,'par3',159,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'[]','{"source":"tournament_official_yardage"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
((SELECT id FROM courses WHERE name='Galgorm Castle Golf Club - Castle Course'),8,NULL,4,'par4',410,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'[]','{"source":"tournament_official_yardage"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
((SELECT id FROM courses WHERE name='Galgorm Castle Golf Club - Castle Course'),9,NULL,5,'par5',508,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'[]','{"source":"tournament_official_yardage"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
-- Back 9
((SELECT id FROM courses WHERE name='Galgorm Castle Golf Club - Castle Course'),10,NULL,5,'par5',477,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'[]','{"source":"tournament_official_yardage"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
((SELECT id FROM courses WHERE name='Galgorm Castle Golf Club - Castle Course'),11,NULL,4,'par4',420,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'[]','{"source":"tournament_official_yardage"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
((SELECT id FROM courses WHERE name='Galgorm Castle Golf Club - Castle Course'),12,NULL,3,'par3',170,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'[]','{"source":"tournament_official_yardage"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
((SELECT id FROM courses WHERE name='Galgorm Castle Golf Club - Castle Course'),13,NULL,4,'par4',384,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'[]','{"source":"tournament_official_yardage"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
((SELECT id FROM courses WHERE name='Galgorm Castle Golf Club - Castle Course'),14,NULL,3,'par3',139,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'[]','{"source":"tournament_official_yardage"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
((SELECT id FROM courses WHERE name='Galgorm Castle Golf Club - Castle Course'),15,NULL,4,'par4',409,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'[]','{"source":"tournament_official_yardage"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
((SELECT id FROM courses WHERE name='Galgorm Castle Golf Club - Castle Course'),16,NULL,4,'par4',407,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'[]','{"source":"tournament_official_yardage"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
((SELECT id FROM courses WHERE name='Galgorm Castle Golf Club - Castle Course'),17,NULL,4,'par4',408,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'[]','{"source":"tournament_official_yardage"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
((SELECT id FROM courses WHERE name='Galgorm Castle Golf Club - Castle Course'),18,NULL,5,'par5',509,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'[]','{"source":"tournament_official_yardage"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);

-- Castlerock - Mussenden (club scorecard whites & blues; red where applicable)
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES
-- Front 9 (White = yardage_white, Blue = yardage_blue, Red = yardage_red)
((SELECT id FROM courses WHERE name='Castlerock Golf Club - Mussenden Course'),1,NULL,4,'par4',346,NULL,367,328,9,328,4,9,NULL,'[]','{"source":"club_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
((SELECT id FROM courses WHERE name='Castlerock Golf Club - Mussenden Course'),2,NULL,4,'par4',325,NULL,334,278,5,278,4,5,NULL,'[]','{"source":"club_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
((SELECT id FROM courses WHERE name='Castlerock Golf Club - Mussenden Course'),3,NULL,5,'par5',493,NULL,523,425,13,425,5,13,NULL,'[]','{"source":"club_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
((SELECT id FROM courses WHERE name='Castlerock Golf Club - Mussenden Course'),4,NULL,3,'par3',184,NULL,200,163,11,163,3,11,NULL,'[]','{"source":"club_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
((SELECT id FROM courses WHERE name='Castlerock Golf Club - Mussenden Course'),5,NULL,5,'par5',472,NULL,477,452,15,452,5,15,NULL,'[]','{"source":"club_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
((SELECT id FROM courses WHERE name='Castlerock Golf Club - Mussenden Course'),6,NULL,4,'par4',336,NULL,347,287,7,287,4,7,NULL,'[]','{"source":"club_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
((SELECT id FROM courses WHERE name='Castlerock Golf Club - Mussenden Course'),7,NULL,4,'par4',407,NULL,418,394,1,394,4,1,NULL,'[]','{"source":"club_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
((SELECT id FROM courses WHERE name='Castlerock Golf Club - Mussenden Course'),8,NULL,4,'par4',400,NULL,411,320,3,320,4,3,NULL,'[]','{"source":"club_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
((SELECT id FROM courses WHERE name='Castlerock Golf Club - Mussenden Course'),9,NULL,3,'par3',193,NULL,214,162,17,162,3,17,NULL,'[]','{"source":"club_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
-- Back 9
((SELECT id FROM courses WHERE name='Castlerock Golf Club - Mussenden Course'),10,NULL,4,'par4',386,NULL,415,348,4,348,4,4,NULL,'[]','{"source":"club_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
((SELECT id FROM courses WHERE name='Castlerock Golf Club - Mussenden Course'),11,NULL,5,'par5',485,NULL,529,422,16,422,5,16,NULL,'[]','{"source":"club_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
((SELECT id FROM courses WHERE name='Castlerock Golf Club - Mussenden Course'),12,NULL,4,'par4',420,NULL,430,412,2,412,4,2,NULL,'[]','{"source":"club_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
((SELECT id FROM courses WHERE name='Castlerock Golf Club - Mussenden Course'),13,NULL,4,'par4',379,NULL,398,342,14,342,4,14,NULL,'[]','{"source":"club_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
((SELECT id FROM courses WHERE name='Castlerock Golf Club - Mussenden Course'),14,NULL,3,'par3',182,NULL,192,166,8,166,3,8,NULL,'[]','{"source":"club_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
((SELECT id FROM courses WHERE name='Castlerock Golf Club - Mussenden Course'),15,NULL,5,'par5',510,NULL,518,482,6,482,5,6,NULL,'[]','{"source":"club_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
((SELECT id FROM courses WHERE name='Castlerock Golf Club - Mussenden Course'),16,NULL,3,'par3',145,NULL,157,128,18,128,3,18,NULL,'[]','{"source":"club_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
((SELECT id FROM courses WHERE name='Castlerock Golf Club - Mussenden Course'),17,NULL,5,'par5',485,NULL,493,435,12,435,5,12,NULL,'[]','{"source":"club_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
((SELECT id FROM courses WHERE name='Castlerock Golf Club - Mussenden Course'),18,NULL,4,'par4',333,NULL,357,310,10,310,4,10,NULL,'[]','{"source":"club_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);

-- Royal Portrush - Dunluce (The Open 2025 hole guide distances)
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES
      ((SELECT id FROM courses WHERE name='Royal Portrush Golf Club - Dunluce Links'),1,'Hughie''s',4,'par4',420,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'[]','{"source":"the_open_hole_guide_2025"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
      ((SELECT id FROM courses WHERE name='Royal Portrush Golf Club - Dunluce Links'),2,'Giant''s Grave',5,'par5',575,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'[]','{"source":"the_open_hole_guide_2025"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
      ((SELECT id FROM courses WHERE name='Royal Portrush Golf Club - Dunluce Links'),3,'Islay',3,'par3',176,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'[]','{"source":"the_open_hole_guide_2025"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
      ((SELECT id FROM courses WHERE name='Royal Portrush Golf Club - Dunluce Links'),4,'Fred Daly''s',4,'par4',502,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'[]','{"source":"the_open_hole_guide_2025"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
      ((SELECT id FROM courses WHERE name='Royal Portrush Golf Club - Dunluce Links'),5,'White Rocks',4,'par4',372,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'[]','{"source":"the_open_hole_guide_2025"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
      ((SELECT id FROM courses WHERE name='Royal Portrush Golf Club - Dunluce Links'),6,'Harry Colt''s',3,'par3',193,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'[]','{"source":"the_open_hole_guide_2025"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
      ((SELECT id FROM courses WHERE name='Royal Portrush Golf Club - Dunluce Links'),7,'Curran Point',5,'par5',607,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'[]','{"source":"the_open_hole_guide_2025"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
      ((SELECT id FROM courses WHERE name='Royal Portrush Golf Club - Dunluce Links'),8,'Dunluce',4,'par4',434,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'[]','{"source":"the_open_hole_guide_2025"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
      ((SELECT id FROM courses WHERE name='Royal Portrush Golf Club - Dunluce Links'),9,'Tavern',4,'par4',432,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'[]','{"source":"the_open_hole_guide_2025"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
      ((SELECT id FROM courses WHERE name='Royal Portrush Golf Club - Dunluce Links'),10,'Himalayas',4,'par4',450,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'[]','{"source":"the_open_hole_guide_2025"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
      ((SELECT id FROM courses WHERE name='Royal Portrush Golf Club - Dunluce Links'),11,'PG Stevenson''s',4,'par4',475,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'[]','{"source":"the_open_hole_guide_2025","note":"member par 5"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
      ((SELECT id FROM courses WHERE name='Royal Portrush Golf Club - Dunluce Links'),12,'Dhu Varren',5,'par5',532,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'[]','{"source":"the_open_hole_guide_2025"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
      ((SELECT id FROM courses WHERE name='Royal Portrush Golf Club - Dunluce Links'),13,'Feather Bed',3,'par3',199,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'[]','{"source":"the_open_hole_guide_2025"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
      ((SELECT id FROM courses WHERE name='Royal Portrush Golf Club - Dunluce Links'),14,'Causeway',4,'par4',466,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'[]','{"source":"the_open_hole_guide_2025"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
      ((SELECT id FROM courses WHERE name='Royal Portrush Golf Club - Dunluce Links'),15,'Skerries',4,'par4',429,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'[]','{"source":"the_open_hole_guide_2025"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
      ((SELECT id FROM courses WHERE name='Royal Portrush Golf Club - Dunluce Links'),16,'Calamity Corner',3,'par3',236,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'[]','{"source":"the_open_hole_guide_2025"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
      ((SELECT id FROM courses WHERE name='Royal Portrush Golf Club - Dunluce Links'),17,'Purgatory',4,'par4',409,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'[]','{"source":"the_open_hole_guide_2025"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
      ((SELECT id FROM courses WHERE name='Royal Portrush Golf Club - Dunluce Links'),18,'Babington''s',4,'par4',474,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'[]','{"source":"the_open_hole_guide_2025"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);

/************************************************************
 * HOLES — REMAINING COURSES (scaffolded; paste verified rows)
 ************************************************************/

-- Royal Portrush - Valley Links
-- TODO: Insert 18 rows (use club scorecard at https://www.royalportrushgolfclub.com/courses/the-valley/)

-- Ardglass Golf Club
-- TODO: Insert 18 rows (use official scorecard or BlueGolf)

-- Malone Golf Club (Drumbridge/Ballydrain)
-- TODO: Insert 18 rows (official PDF scorecard)

-- Belvoir Park Golf Club
-- TODO: Insert 18 rows (official/BlueGolf)

-- Holywood Golf Club
-- TODO: Insert 18 rows (official scorecard page)


/************************************************************
 * HOLES — ADDED FROM SCORECARDS (REMAINING 5 COURSES)
 ************************************************************/

INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Royal Portrush Golf Club - Valley Links'),1,NULL,4,'par4',349,NULL,NULL,NULL,11,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Royal Portrush Golf Club - Valley Links'),2,NULL,4,'par4',385,NULL,NULL,NULL,7,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Royal Portrush Golf Club - Valley Links'),3,NULL,3,'par3',141,NULL,NULL,NULL,15,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Royal Portrush Golf Club - Valley Links'),4,NULL,5,'par5',534,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Royal Portrush Golf Club - Valley Links'),5,NULL,4,'par4',443,NULL,NULL,NULL,9,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Royal Portrush Golf Club - Valley Links'),6,NULL,4,'par4',409,NULL,NULL,NULL,13,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Royal Portrush Golf Club - Valley Links'),7,NULL,4,'par4',320,NULL,NULL,NULL,3,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Royal Portrush Golf Club - Valley Links'),8,NULL,5,'par5',496,NULL,NULL,NULL,17,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Royal Portrush Golf Club - Valley Links'),9,NULL,3,'par3',140,NULL,NULL,NULL,7,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Royal Portrush Golf Club - Valley Links'),10,NULL,4,'par4',465,NULL,NULL,NULL,2,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Royal Portrush Golf Club - Valley Links'),11,NULL,5,'par5',486,NULL,NULL,NULL,10,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Royal Portrush Golf Club - Valley Links'),12,NULL,4,'par4',421,NULL,NULL,NULL,4,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Royal Portrush Golf Club - Valley Links'),13,NULL,5,'par5',653,NULL,NULL,NULL,12,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Royal Portrush Golf Club - Valley Links'),14,NULL,3,'par3',191,NULL,NULL,NULL,8,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Royal Portrush Golf Club - Valley Links'),15,NULL,3,'par3',171,NULL,NULL,NULL,16,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Royal Portrush Golf Club - Valley Links'),16,NULL,5,'par5',493,NULL,NULL,NULL,6,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Royal Portrush Golf Club - Valley Links'),17,NULL,3,'par3',194,NULL,NULL,NULL,14,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Royal Portrush Golf Club - Valley Links'),18,NULL,4,'par4',333,NULL,NULL,NULL,5,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Ardglass Golf Club'),1,NULL,4,'par4',332,NULL,NULL,NULL,10,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Ardglass Golf Club'),2,NULL,3,'par3',168,NULL,NULL,NULL,14,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Ardglass Golf Club'),3,NULL,4,'par4',339,NULL,NULL,NULL,16,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Ardglass Golf Club'),4,NULL,4,'par4',371,NULL,NULL,NULL,8,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Ardglass Golf Club'),5,NULL,3,'par3',139,NULL,NULL,NULL,18,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Ardglass Golf Club'),6,NULL,4,'par4',407,NULL,NULL,NULL,4,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Ardglass Golf Club'),7,NULL,3,'par3',217,NULL,NULL,NULL,12,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Ardglass Golf Club'),8,NULL,4,'par4',441,NULL,NULL,NULL,2,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Ardglass Golf Club'),9,NULL,5,'par5',529,NULL,NULL,NULL,8,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Ardglass Golf Club'),10,NULL,4,'par4',302,NULL,NULL,NULL,13,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Ardglass Golf Club'),11,NULL,5,'par5',483,NULL,NULL,NULL,7,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Ardglass Golf Club'),12,NULL,3,'par3',195,NULL,NULL,NULL,17,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Ardglass Golf Club'),13,NULL,4,'par4',407,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Ardglass Golf Club'),14,NULL,4,'par4',380,NULL,NULL,NULL,11,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Ardglass Golf Club'),15,NULL,5,'par5',491,NULL,NULL,NULL,15,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Ardglass Golf Club'),16,NULL,5,'par5',605,NULL,NULL,NULL,5,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Ardglass Golf Club'),17,NULL,3,'par3',163,NULL,NULL,NULL,9,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Ardglass Golf Club'),18,NULL,4,'par4',330,NULL,NULL,NULL,17,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Malone Golf Club (Drumbridge/Ballydrain)'),1,NULL,4,'par4',389,NULL,NULL,NULL,5,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Malone Golf Club (Drumbridge/Ballydrain)'),2,NULL,5,'par5',533,NULL,NULL,NULL,11,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Malone Golf Club (Drumbridge/Ballydrain)'),3,NULL,5,'par5',484,NULL,NULL,NULL,9,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Malone Golf Club (Drumbridge/Ballydrain)'),4,NULL,3,'par3',158,NULL,NULL,NULL,17,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Malone Golf Club (Drumbridge/Ballydrain)'),5,NULL,4,'par4',435,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Malone Golf Club (Drumbridge/Ballydrain)'),6,NULL,3,'par3',194,NULL,NULL,NULL,15,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Malone Golf Club (Drumbridge/Ballydrain)'),7,NULL,5,'par5',485,NULL,NULL,NULL,13,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Malone Golf Club (Drumbridge/Ballydrain)'),8,NULL,4,'par4',363,NULL,NULL,NULL,3,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Malone Golf Club (Drumbridge/Ballydrain)'),9,NULL,4,'par4',374,NULL,NULL,NULL,7,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Malone Golf Club (Drumbridge/Ballydrain)'),10,NULL,4,'par4',423,NULL,NULL,NULL,10,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Malone Golf Club (Drumbridge/Ballydrain)'),11,NULL,4,'par4',404,NULL,NULL,NULL,8,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Malone Golf Club (Drumbridge/Ballydrain)'),12,NULL,3,'par3',191,NULL,NULL,NULL,12,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Malone Golf Club (Drumbridge/Ballydrain)'),13,NULL,4,'par4',415,NULL,NULL,NULL,2,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Malone Golf Club (Drumbridge/Ballydrain)'),14,NULL,4,'par4',385,NULL,NULL,NULL,14,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Malone Golf Club (Drumbridge/Ballydrain)'),15,NULL,3,'par3',168,NULL,NULL,NULL,16,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Malone Golf Club (Drumbridge/Ballydrain)'),16,NULL,5,'par5',504,NULL,NULL,NULL,18,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Malone Golf Club (Drumbridge/Ballydrain)'),17,NULL,4,'par4',460,NULL,NULL,NULL,6,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Malone Golf Club (Drumbridge/Ballydrain)'),18,NULL,4,'par4',431,NULL,NULL,NULL,4,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Belvoir Park Golf Club'),1,NULL,4,'par4',279,NULL,NULL,NULL,18,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Belvoir Park Golf Club'),2,NULL,4,'par4',402,NULL,NULL,NULL,6,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Belvoir Park Golf Club'),3,NULL,4,'par4',417,NULL,NULL,NULL,2,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Belvoir Park Golf Club'),4,NULL,3,'par3',187,NULL,NULL,NULL,8,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Belvoir Park Golf Club'),5,NULL,5,'par5',524,NULL,NULL,NULL,14,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Belvoir Park Golf Club'),6,NULL,4,'par4',389,NULL,NULL,NULL,10,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Belvoir Park Golf Club'),7,NULL,4,'par4',427,NULL,NULL,NULL,4,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Belvoir Park Golf Club'),8,NULL,3,'par3',144,NULL,NULL,NULL,16,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Belvoir Park Golf Club'),9,NULL,5,'par5',481,NULL,NULL,NULL,12,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Belvoir Park Golf Club'),10,NULL,5,'par5',478,NULL,NULL,NULL,11,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Belvoir Park Golf Club'),11,NULL,3,'par3',179,NULL,NULL,NULL,15,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Belvoir Park Golf Club'),12,NULL,4,'par4',455,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Belvoir Park Golf Club'),13,NULL,4,'par4',405,NULL,NULL,NULL,13,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Belvoir Park Golf Club'),14,NULL,3,'par3',176,NULL,NULL,NULL,17,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Belvoir Park Golf Club'),15,NULL,5,'par5',547,NULL,NULL,NULL,3,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Belvoir Park Golf Club'),16,NULL,3,'par3',193,NULL,NULL,NULL,7,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Belvoir Park Golf Club'),17,NULL,4,'par4',430,NULL,NULL,NULL,9,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Belvoir Park Golf Club'),18,NULL,4,'par4',388,NULL,NULL,NULL,5,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Holywood Golf Club'),1,NULL,4,'par4',337,NULL,NULL,NULL,15,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Holywood Golf Club'),2,NULL,4,'par4',339,NULL,NULL,NULL,13,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Holywood Golf Club'),3,NULL,4,'par4',339,NULL,NULL,NULL,7,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Holywood Golf Club'),4,NULL,3,'par3',171,NULL,NULL,NULL,17,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Holywood Golf Club'),5,NULL,5,'par5',491,NULL,NULL,NULL,3,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Holywood Golf Club'),6,NULL,4,'par4',433,NULL,NULL,NULL,9,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Holywood Golf Club'),7,NULL,3,'par3',183,NULL,NULL,NULL,5,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Holywood Golf Club'),8,NULL,5,'par5',483,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Holywood Golf Club'),9,NULL,4,'par4',308,NULL,NULL,NULL,11,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Holywood Golf Club'),10,NULL,3,'par3',169,NULL,NULL,NULL,16,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Holywood Golf Club'),11,NULL,4,'par4',386,NULL,NULL,NULL,14,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Holywood Golf Club'),12,NULL,4,'par4',336,NULL,NULL,NULL,8,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Holywood Golf Club'),13,NULL,4,'par4',404,NULL,NULL,NULL,4,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Holywood Golf Club'),14,NULL,4,'par4',336,NULL,NULL,NULL,12,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Holywood Golf Club'),15,NULL,4,'par4',336,NULL,NULL,NULL,10,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Holywood Golf Club'),16,NULL,4,'par4',311,NULL,NULL,NULL,2,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Holywood Golf Club'),17,NULL,4,'par4',386,NULL,NULL,NULL,6,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
INSERT INTO holes (
    course_id, hole_number, name, par, hole_type,
    yardage_white, yardage_black, yardage_blue, yardage_red,
    stroke_index, ladies_yardage, ladies_par, ladies_stroke_index,
    hole_tips, simple_hazards, hole_metadata, created_at, updated_at
) VALUES (
             (SELECT id FROM courses WHERE name='Holywood Golf Club'),18,NULL,4,'par4',370,NULL,NULL,NULL,18,NULL,NULL,NULL,NULL,'[]','{"source":"official_scorecard"}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
         );
