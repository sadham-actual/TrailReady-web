-- Fix Barnwell trail names and insert 11 named trails missing from original import
-- Run: 2026-04-10

-- 1. Fix name casing on existing named trails
UPDATE public.geo_trails SET name = 'Green Lane 2'          WHERE name = 'greenlane 2';
UPDATE public.geo_trails SET name = 'Jeepy Hollow'          WHERE name = 'jeepy Hollow';
UPDATE public.geo_trails SET name = 'Main Road'             WHERE name = 'main road';
UPDATE public.geo_trails SET name = 'Shake Rattle and Roll' WHERE name = 'shake rattle and roll';
UPDATE public.geo_trails SET name = 'Twister'               WHERE name = 'twister';
UPDATE public.geo_trails SET name = 'JP Expressway'         WHERE name LIKE 'J P expressway';
UPDATE public.geo_trails SET name = 'L&B Turnpike 17'       WHERE name LIKE 'L&B turnpike 17';
UPDATE public.geo_trails SET name = 'Linda Gail'            WHERE name = 'Linda Gale 41';
UPDATE public.geo_trails SET name = 'Jeepy Hollow 18'       WHERE name LIKE 'jeepy hollow 18';
UPDATE public.geo_trails SET name = 'Scorpion Overlook'     WHERE name = 'Scorpion overlook';
UPDATE public.geo_trails SET name = 'Spider Ravine'         WHERE name LIKE 'spider Ravine%';
UPDATE public.geo_trails SET name = 'Horseshoe Gulch'       WHERE name = 'horse shoe gulch';

-- 2. Delete entries that are outside the park (county roads, not OHV trails)
DELETE FROM public.trail_trail_segments
WHERE trail_id IN (
  'df43b701-b713-4edb-9ef9-cb69ce937556',
  '78d7c5aa-74c9-4ddc-b7c0-631cd74cb386'
);
DELETE FROM public.geo_trails WHERE id IN (
  'df43b701-b713-4edb-9ef9-cb69ce937556',
  '78d7c5aa-74c9-4ddc-b7c0-631cd74cb386'
);

-- 3. Rename highway=trunk entries to Park Road (main access roads, not OHV trails)
UPDATE public.geo_trails SET name = 'Park Road'
WHERE id IN (
  'b3125173-95d0-42fd-a5af-6d237b6d47ab',
  '28bff2b5-3a55-47d1-a9f3-22818d6e00e8',
  '3cee1840-eca5-453b-a66f-a1d8f197e5b0',
  '199b732b-a511-4e38-8577-1c19825018e7',
  'e7e0a208-9609-4a5e-ae58-4ae9b46e75bd'
);

-- 4. Rename highway=service camp connector roads
UPDATE public.geo_trails SET name = 'Camp Road'
WHERE id IN (
  '35dfa8c7-22a5-4bba-9331-f4ff98ca0819',
  '57ff2632-b475-4026-981b-5bc6841d3c1c',
  '45c64a65-45e5-4df0-b205-40cedb3ffe11',
  'fa1d5976-de88-4c32-a770-3fa2f22657c3',
  '7d7b6074-c215-46e5-abb9-b0a4f6d6f44d',
  'ed416a9d-3e60-4484-8010-7e861f32d258',
  '36ac6f2e-e2bc-483d-a3a8-a7e979cb18a2',
  'cbdf6c7f-0469-44f1-80a5-cb5d523922ac',
  '6e14ec1d-c34f-4d97-9382-dddb43acf9b3',
  '5b939101-96f8-4de8-a224-ff62f78d80bb',
  '1198edde-40c3-4331-bdc9-6faa56271f0f',
  '51b1cfb2-afa8-47f9-9a3b-828f595cf839',
  '41515c40-60be-4e24-9e98-5532ed394e99',
  '3a5ea245-5949-447c-a0b5-9d3bb3ba178f',
  '3c51670d-e74d-4ff1-baf0-707826241428',
  'a0590bce-7ca0-4724-82cb-dc2d6cf4eac9',
  'b4032fe8-6f13-4da7-a5a1-44020de831ef',
  '98606af6-5b29-4825-bdf2-f2d6f196b5ae',
  '611359a5-967e-49bf-ad5d-bb776a0e0a89',
  'fbd6fd4d-c69f-4736-9fc2-2be8149dda83',
  '94983d3f-931e-4b42-b3b9-1db63047c900',
  '16fea01f-e407-420b-aac6-0682f2fbd025',
  '5dbe6e81-16cd-4b09-86f3-041218496b5b',
  'e165ac87-1364-4714-b408-cb4baec8d3f1'
);

-- 5. Insert 11 named trails missing from original import (OSM source)
-- See migration DO block in applied migration for full geometry
