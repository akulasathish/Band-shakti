-- Migration: Seed default band members into gallery_assets
INSERT INTO gallery_assets (type, url, description) VALUES
('BAND_MEMBER', 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=400', '{"name":"Vikram Shakthi","role":"Lead Vocals / Frontman","bio":"The powerhouse voice of the band, bringing pure energy and crowd connection to every single gig."}'),
('BAND_MEMBER', 'https://images.unsplash.com/photo-1525201548982-be346cae56a7?q=80&w=400', '{"name":"Arjun Iyer","role":"Lead Guitarist","bio":"Fusing classical runs with heavy electric blues solos. Shreds guitar riffs that define the Shakthi sound."}'),
('BAND_MEMBER', 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=400', '{"name":"Neha Sen","role":"Bass / Backing Vocals","bio":"The grooving heartbeat of the band. Lays down heavy basslines while backing the vocals with harmonies."}'),
('BAND_MEMBER', 'https://images.unsplash.com/photo-1519750157634-b6d493a0f77c?q=80&w=400', '{"name":"Karan Mehta","role":"Drums / Percussions","bio":"A rhythm powerhouse. Sets the tempo with explosive rock drumming and customized beats."}');
