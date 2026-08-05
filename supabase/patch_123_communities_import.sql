-- Real Dubai community data import (dubai_communities.csv, 201 rows):
-- adds a "region" grouping column (new -- Deira, Marina & New Dubai,
-- Central Dubai, etc., useful for grouping/filtering the Community
-- Explorer) and backfills it on the 114 communities that
-- already exist here under the same name, then adds the 87
-- real Dubai communities from the same dataset that don't exist yet.
-- Every new row is a real, named place with real coordinates -- x_pct/
-- y_pct (the hand-placed fallback-map pin position used only when the
-- live Mapbox map fails to load) are intentionally left null rather than
-- guessed, since there's no honest way to derive them from lng/lat alone.

alter table communities add column if not exists region text;

update communities set region = 'Deira' where lower(name) = lower('Abu Hail') and region is null;
update communities set region = 'Central Dubai' where lower(name) = lower('Al Badaa') and region is null;
update communities set region = 'Deira' where lower(name) = lower('Al Baraha') and region is null;
update communities set region = 'Dubailand East' where lower(name) = lower('Al Barari') and region is null;
update communities set region = 'Marina & New Dubai' where lower(name) = lower('Al Barsha 1') and region is null;
update communities set region = 'Marina & New Dubai' where lower(name) = lower('Al Barsha 2') and region is null;
update communities set region = 'Marina & New Dubai' where lower(name) = lower('Al Barsha 3') and region is null;
update communities set region = 'Marina & New Dubai' where lower(name) = lower('Al Barsha South') and region is null;
update communities set region = 'JVC / JVT Corridor' where lower(name) = lower('Al Furjan') and region is null;
update communities set region = 'Garhoud & Festival City' where lower(name) = lower('Al Garhoud') and region is null;
update communities set region = 'Central Dubai' where lower(name) = lower('Al Hudaiba') and region is null;
update communities set region = 'Bur Dubai' where lower(name) = lower('Al Jaddaf') and region is null;
update communities set region = 'Central Dubai' where lower(name) = lower('Al Jafiliya') and region is null;
update communities set region = 'Bur Dubai' where lower(name) = lower('Al Karama') and region is null;
update communities set region = 'Mirdif & Khawaneej' where lower(name) = lower('Al Khawaneej 1') and region is null;
update communities set region = 'Mirdif & Khawaneej' where lower(name) = lower('Al Khawaneej 2') and region is null;
update communities set region = 'Deira' where lower(name) = lower('Al Mamzar') and region is null;
update communities set region = 'Jumeirah Coast' where lower(name) = lower('Al Manara') and region is null;
update communities set region = 'Deira' where lower(name) = lower('Al Muraqqabat') and region is null;
update communities set region = 'Deira' where lower(name) = lower('Al Muteena') and region is null;
update communities set region = 'Al Qusais & North East' where lower(name) = lower('Al Qusais Industrial Area') and region is null;
update communities set region = 'Bur Dubai' where lower(name) = lower('Al Raffa') and region is null;
update communities set region = 'Deira' where lower(name) = lower('Al Ras') and region is null;
update communities set region = 'Garhoud & Festival City' where lower(name) = lower('Al Rashidiya') and region is null;
update communities set region = 'Deira' where lower(name) = lower('Al Rigga') and region is null;
update communities set region = 'Jumeirah Coast' where lower(name) = lower('Al Safa 1') and region is null;
update communities set region = 'Jumeirah Coast' where lower(name) = lower('Al Safa 2') and region is null;
update communities set region = 'Central Dubai' where lower(name) = lower('Al Satwa') and region is null;
update communities set region = 'Bur Dubai' where lower(name) = lower('Al Souq Al Kabeer') and region is null;
update communities set region = 'Jumeirah Coast' where lower(name) = lower('Al Sufouh 1') and region is null;
update communities set region = 'Jumeirah Coast' where lower(name) = lower('Al Sufouh 2') and region is null;
update communities set region = 'Al Qusais & North East' where lower(name) = lower('Al Twar') and region is null;
update communities set region = 'Mirdif & Khawaneej' where lower(name) = lower('Al Warqa 1') and region is null;
update communities set region = 'Mirdif & Khawaneej' where lower(name) = lower('Al Warqa 2') and region is null;
update communities set region = 'Mirdif & Khawaneej' where lower(name) = lower('Al Warqa 3') and region is null;
update communities set region = 'Central Dubai' where lower(name) = lower('Al Wasl') and region is null;
update communities set region = 'Dubailand West' where lower(name) = lower('Arabian Ranches') and region is null;
update communities set region = 'Dubailand West' where lower(name) = lower('Arjan') and region is null;
update communities set region = 'Marina & New Dubai' where lower(name) = lower('Bluewaters Island') and region is null;
update communities set region = 'Bur Dubai' where lower(name) = lower('Bur Dubai') and region is null;
update communities set region = 'Central Dubai' where lower(name) = lower('Business Bay') and region is null;
update communities set region = 'Central Dubai' where lower(name) = lower('City Walk') and region is null;
update communities set region = 'Bur Dubai' where lower(name) = lower('Culture Village') and region is null;
update communities set region = 'Dubailand West' where lower(name) = lower('DAMAC Hills') and region is null;
update communities set region = 'Dubailand West' where lower(name) = lower('DAMAC Lagoons') and region is null;
update communities set region = 'Central Dubai' where lower(name) = lower('DIFC') and region is null;
update communities set region = 'Deira' where lower(name) = lower('Deira') and region is null;
update communities set region = 'JVC / JVT Corridor' where lower(name) = lower('Discovery Gardens') and region is null;
update communities set region = 'Meydan & MBR City' where lower(name) = lower('District One') and region is null;
update communities set region = 'Central Dubai' where lower(name) = lower('Downtown Dubai') and region is null;
update communities set region = 'Garhoud & Festival City' where lower(name) = lower('Dubai Creek Harbour') and region is null;
update communities set region = 'Central Dubai' where lower(name) = lower('Dubai Design District (d3)') and region is null;
update communities set region = 'Garhoud & Festival City' where lower(name) = lower('Dubai Festival City') and region is null;
update communities set region = 'Marina & New Dubai' where lower(name) = lower('Dubai Harbour') and region is null;
update communities set region = 'Bur Dubai' where lower(name) = lower('Dubai Healthcare City') and region is null;
update communities set region = 'Dubailand West' where lower(name) = lower('Dubai Hills Estate') and region is null;
update communities set region = 'Jebel Ali & Dubai South' where lower(name) = lower('Dubai Industrial City') and region is null;
update communities set region = 'Deira' where lower(name) = lower('Dubai Islands') and region is null;
update communities set region = 'Marina & New Dubai' where lower(name) = lower('Dubai Marina') and region is null;
update communities set region = 'Bur Dubai' where lower(name) = lower('Dubai Maritime City') and region is null;
update communities set region = 'Marina & New Dubai' where lower(name) = lower('Dubai Science Park') and region is null;
update communities set region = 'Silicon Oasis & Academic City' where lower(name) = lower('Dubai Silicon Oasis') and region is null;
update communities set region = 'Dubailand West' where lower(name) = lower('Dubai Sports City') and region is null;
update communities set region = 'Dubailand West' where lower(name) = lower('Dubai Studio City') and region is null;
update communities set region = 'Marina & New Dubai' where lower(name) = lower('Emaar Beachfront') and region is null;
update communities set region = 'Emirates Living' where lower(name) = lower('Emirates Hills') and region is null;
update communities set region = 'Jebel Ali & Dubai South' where lower(name) = lower('Expo City Dubai') and region is null;
update communities set region = 'Outer Dubai' where lower(name) = lower('Hatta') and region is null;
update communities set region = 'Deira' where lower(name) = lower('Hor Al Anz') and region is null;
update communities set region = 'Silicon Oasis & Academic City' where lower(name) = lower('International City') and region is null;
update communities set region = 'Jebel Ali & Dubai South' where lower(name) = lower('Jebel Ali Industrial Area') and region is null;
update communities set region = 'Jebel Ali & Dubai South' where lower(name) = lower('Jebel Ali Village') and region is null;
update communities set region = 'Jumeirah Coast' where lower(name) = lower('Jumeirah 1') and region is null;
update communities set region = 'Jumeirah Coast' where lower(name) = lower('Jumeirah 2') and region is null;
update communities set region = 'Jumeirah Coast' where lower(name) = lower('Jumeirah 3') and region is null;
update communities set region = 'Marina & New Dubai' where lower(name) = lower('Jumeirah Beach Residence (JBR)') and region is null;
update communities set region = 'JVC / JVT Corridor' where lower(name) = lower('Jumeirah Village Circle (JVC)') and region is null;
update communities set region = 'JVC / JVT Corridor' where lower(name) = lower('Jumeirah Village Triangle (JVT)') and region is null;
update communities set region = 'Dubailand East' where lower(name) = lower('Liwan') and region is null;
update communities set region = 'Jumeirah Coast' where lower(name) = lower('Madinat Jumeirah Living') and region is null;
update communities set region = 'Dubailand East' where lower(name) = lower('Majan') and region is null;
update communities set region = 'Mirdif & Khawaneej' where lower(name) = lower('Mirdif') and region is null;
update communities set region = 'Dubailand West' where lower(name) = lower('Motor City') and region is null;
update communities set region = 'Dubailand West' where lower(name) = lower('Mudon') and region is null;
update communities set region = 'Garhoud & Festival City' where lower(name) = lower('Nad Al Hamar') and region is null;
update communities set region = 'Meydan & MBR City' where lower(name) = lower('Nad Al Sheba 1') and region is null;
update communities set region = 'Meydan & MBR City' where lower(name) = lower('Nad Al Sheba 2') and region is null;
update communities set region = 'Meydan & MBR City' where lower(name) = lower('Nad Al Sheba 3') and region is null;
update communities set region = 'Meydan & MBR City' where lower(name) = lower('Nad Al Sheba 4') and region is null;
update communities set region = 'Deira' where lower(name) = lower('Naif') and region is null;
update communities set region = 'Bur Dubai' where lower(name) = lower('Oud Metha') and region is null;
update communities set region = 'Jebel Ali & Dubai South' where lower(name) = lower('Palm Jebel Ali') and region is null;
update communities set region = 'Jumeirah Coast' where lower(name) = lower('Palm Jumeirah') and region is null;
update communities set region = 'Deira' where lower(name) = lower('Port Saeed') and region is null;
update communities set region = 'Garhoud & Festival City' where lower(name) = lower('Ras Al Khor') and region is null;
update communities set region = 'Dubailand West' where lower(name) = lower('Remraam') and region is null;
update communities set region = 'Meydan & MBR City' where lower(name) = lower('Sobha Hartland') and region is null;
update communities set region = 'JVC / JVT Corridor' where lower(name) = lower('The Gardens') and region is null;
update communities set region = 'Emirates Living' where lower(name) = lower('The Greens') and region is null;
update communities set region = 'Emirates Living' where lower(name) = lower('The Lakes') and region is null;
update communities set region = 'Emirates Living' where lower(name) = lower('The Meadows') and region is null;
update communities set region = 'Emirates Living' where lower(name) = lower('The Springs') and region is null;
update communities set region = 'Dubailand West' where lower(name) = lower('The Sustainable City') and region is null;
update communities set region = 'Emirates Living' where lower(name) = lower('The Views') and region is null;
update communities set region = 'Dubailand East' where lower(name) = lower('The Villa') and region is null;
update communities set region = 'Dubailand West' where lower(name) = lower('Tilal Al Ghaf') and region is null;
update communities set region = 'Dubailand West' where lower(name) = lower('Town Square Dubai') and region is null;
update communities set region = 'Jumeirah Coast' where lower(name) = lower('Umm Al Sheif') and region is null;
update communities set region = 'Garhoud & Festival City' where lower(name) = lower('Umm Ramool') and region is null;
update communities set region = 'Jumeirah Coast' where lower(name) = lower('Umm Suqeim 1') and region is null;
update communities set region = 'Jumeirah Coast' where lower(name) = lower('Umm Suqeim 2') and region is null;
update communities set region = 'Jumeirah Coast' where lower(name) = lower('Umm Suqeim 3') and region is null;
update communities set region = 'Central Dubai' where lower(name) = lower('Zabeel 1') and region is null;
update communities set region = 'Central Dubai' where lower(name) = lower('Zabeel 2') and region is null;

insert into communities (slug, name, region, lng, lat)
select 'al-aweer', 'Al Aweer', 'Mirdif & Khawaneej', 55.4, 25.175
where not exists (select 1 from communities where slug = 'al-aweer');

insert into communities (slug, name, region, lng, lat)
select 'al-fahidi', 'Al Fahidi', 'Bur Dubai', 55.298, 25.264
where not exists (select 1 from communities where slug = 'al-fahidi');

insert into communities (slug, name, region, lng, lat)
select 'al-hamriya-bur-dubai', 'Al Hamriya (Bur Dubai)', 'Bur Dubai', 55.311, 25.262
where not exists (select 1 from communities where slug = 'al-hamriya-bur-dubai');

insert into communities (slug, name, region, lng, lat)
select 'al-khabaisi', 'Al Khabaisi', 'Deira', 55.339, 25.268
where not exists (select 1 from communities where slug = 'al-khabaisi');

insert into communities (slug, name, region, lng, lat)
select 'al-khail-heights', 'Al Khail Heights', 'Dubailand West', 55.235, 25.125
where not exists (select 1 from communities where slug = 'al-khail-heights');

insert into communities (slug, name, region, lng, lat)
select 'al-kifaf', 'Al Kifaf', 'Central Dubai', 55.299, 25.238
where not exists (select 1 from communities where slug = 'al-kifaf');

insert into communities (slug, name, region, lng, lat)
select 'al-lisaili', 'Al Lisaili', 'Outer Dubai', 55.37, 24.77
where not exists (select 1 from communities where slug = 'al-lisaili');

insert into communities (slug, name, region, lng, lat)
select 'al-mina', 'Al Mina', 'Bur Dubai', 55.279, 25.266
where not exists (select 1 from communities where slug = 'al-mina');

insert into communities (slug, name, region, lng, lat)
select 'al-mizhar-1', 'Al Mizhar 1', 'Mirdif & Khawaneej', 55.426, 25.248
where not exists (select 1 from communities where slug = 'al-mizhar-1');

insert into communities (slug, name, region, lng, lat)
select 'al-mizhar-2', 'Al Mizhar 2', 'Mirdif & Khawaneej', 55.434, 25.256
where not exists (select 1 from communities where slug = 'al-mizhar-2');

insert into communities (slug, name, region, lng, lat)
select 'al-nahda-1', 'Al Nahda 1', 'Deira', 55.369, 25.29
where not exists (select 1 from communities where slug = 'al-nahda-1');

insert into communities (slug, name, region, lng, lat)
select 'al-nahda-2', 'Al Nahda 2', 'Deira', 55.376, 25.296
where not exists (select 1 from communities where slug = 'al-nahda-2');

insert into communities (slug, name, region, lng, lat)
select 'al-quoz-1', 'Al Quoz 1', 'Al Quoz', 55.24, 25.149
where not exists (select 1 from communities where slug = 'al-quoz-1');

insert into communities (slug, name, region, lng, lat)
select 'al-quoz-2', 'Al Quoz 2', 'Al Quoz', 55.25, 25.165
where not exists (select 1 from communities where slug = 'al-quoz-2');

insert into communities (slug, name, region, lng, lat)
select 'al-quoz-3', 'Al Quoz 3', 'Al Quoz', 55.228, 25.145
where not exists (select 1 from communities where slug = 'al-quoz-3');

insert into communities (slug, name, region, lng, lat)
select 'al-quoz-4', 'Al Quoz 4', 'Al Quoz', 55.25, 25.135
where not exists (select 1 from communities where slug = 'al-quoz-4');

insert into communities (slug, name, region, lng, lat)
select 'al-quoz-industrial-area-1', 'Al Quoz Industrial Area 1', 'Al Quoz', 55.234, 25.14
where not exists (select 1 from communities where slug = 'al-quoz-industrial-area-1');

insert into communities (slug, name, region, lng, lat)
select 'al-qusais-1', 'Al Qusais 1', 'Al Qusais & North East', 55.376, 25.279
where not exists (select 1 from communities where slug = 'al-qusais-1');

insert into communities (slug, name, region, lng, lat)
select 'al-qusais-2', 'Al Qusais 2', 'Al Qusais & North East', 55.386, 25.283
where not exists (select 1 from communities where slug = 'al-qusais-2');

insert into communities (slug, name, region, lng, lat)
select 'al-qusais-3', 'Al Qusais 3', 'Al Qusais & North East', 55.395, 25.287
where not exists (select 1 from communities where slug = 'al-qusais-3');

insert into communities (slug, name, region, lng, lat)
select 'al-warsan-4', 'Al Warsan 4', 'Silicon Oasis & Academic City', 55.416, 25.165
where not exists (select 1 from communities where slug = 'al-warsan-4');

insert into communities (slug, name, region, lng, lat)
select 'al-wuheida', 'Al Wuheida', 'Deira', 55.34, 25.288
where not exists (select 1 from communities where slug = 'al-wuheida');

insert into communities (slug, name, region, lng, lat)
select 'arabian-ranches-2', 'Arabian Ranches 2', 'Dubailand West', 55.287, 25.025
where not exists (select 1 from communities where slug = 'arabian-ranches-2');

insert into communities (slug, name, region, lng, lat)
select 'arabian-ranches-3', 'Arabian Ranches 3', 'Dubailand West', 55.29, 25
where not exists (select 1 from communities where slug = 'arabian-ranches-3');

insert into communities (slug, name, region, lng, lat)
select 'athlon-by-aldar', 'Athlon by Aldar', 'Dubailand West', 55.235, 25.01
where not exists (select 1 from communities where slug = 'athlon-by-aldar');

insert into communities (slug, name, region, lng, lat)
select 'azizi-riviera', 'Azizi Riviera', 'Meydan & MBR City', 55.305, 25.165
where not exists (select 1 from communities where slug = 'azizi-riviera');

insert into communities (slug, name, region, lng, lat)
select 'barsha-heights-tecom', 'Barsha Heights (TECOM)', 'Marina & New Dubai', 55.177, 25.097
where not exists (select 1 from communities where slug = 'barsha-heights-tecom');

insert into communities (slug, name, region, lng, lat)
select 'bukadra', 'Bukadra', 'Meydan & MBR City', 55.316, 25.178
where not exists (select 1 from communities where slug = 'bukadra');

insert into communities (slug, name, region, lng, lat)
select 'damac-hills-2-akoya', 'DAMAC Hills 2 (Akoya)', 'Outer Dubai', 55.32, 24.88
where not exists (select 1 from communities where slug = 'damac-hills-2-akoya');

insert into communities (slug, name, region, lng, lat)
select 'damac-islands', 'DAMAC Islands', 'Dubailand West', 55.27, 24.97
where not exists (select 1 from communities where slug = 'damac-islands');

insert into communities (slug, name, region, lng, lat)
select 'damac-riverside', 'DAMAC Riverside', 'Jebel Ali & Dubai South', 55.17, 24.95
where not exists (select 1 from communities where slug = 'damac-riverside');

insert into communities (slug, name, region, lng, lat)
select 'downtown-jebel-ali', 'Downtown Jebel Ali', 'Jebel Ali & Dubai South', 55.105, 25.011
where not exists (select 1 from communities where slug = 'downtown-jebel-ali');

insert into communities (slug, name, region, lng, lat)
select 'dubai-academic-city', 'Dubai Academic City', 'Silicon Oasis & Academic City', 55.418, 25.115
where not exists (select 1 from communities where slug = 'dubai-academic-city');

insert into communities (slug, name, region, lng, lat)
select 'dubai-airport-free-zone', 'Dubai Airport Free Zone', 'Al Qusais & North East', 55.382, 25.282
where not exists (select 1 from communities where slug = 'dubai-airport-free-zone');

insert into communities (slug, name, region, lng, lat)
select 'dubai-internet-city', 'Dubai Internet City', 'Marina & New Dubai', 55.162, 25.095
where not exists (select 1 from communities where slug = 'dubai-internet-city');

insert into communities (slug, name, region, lng, lat)
select 'dubai-investments-park-1', 'Dubai Investments Park 1', 'Jebel Ali & Dubai South', 55.18, 24.98
where not exists (select 1 from communities where slug = 'dubai-investments-park-1');

insert into communities (slug, name, region, lng, lat)
select 'dubai-investments-park-2', 'Dubai Investments Park 2', 'Jebel Ali & Dubai South', 55.16, 24.964
where not exists (select 1 from communities where slug = 'dubai-investments-park-2');

insert into communities (slug, name, region, lng, lat)
select 'dubai-knowledge-park', 'Dubai Knowledge Park', 'Marina & New Dubai', 55.166, 25.1
where not exists (select 1 from communities where slug = 'dubai-knowledge-park');

insert into communities (slug, name, region, lng, lat)
select 'dubai-media-city', 'Dubai Media City', 'Marina & New Dubai', 55.156, 25.095
where not exists (select 1 from communities where slug = 'dubai-media-city');

insert into communities (slug, name, region, lng, lat)
select 'dubai-outlet-city', 'Dubai Outlet City', 'Dubailand East', 55.356, 25.068
where not exists (select 1 from communities where slug = 'dubai-outlet-city');

insert into communities (slug, name, region, lng, lat)
select 'dubai-parks-and-resorts', 'Dubai Parks and Resorts', 'Jebel Ali & Dubai South', 55.019, 24.907
where not exists (select 1 from communities where slug = 'dubai-parks-and-resorts');

insert into communities (slug, name, region, lng, lat)
select 'dubai-polo-and-equestrian-club', 'Dubai Polo & Equestrian Club', 'Dubailand West', 55.268, 25.025
where not exists (select 1 from communities where slug = 'dubai-polo-and-equestrian-club');

insert into communities (slug, name, region, lng, lat)
select 'dubai-production-city-impz', 'Dubai Production City (IMPZ)', 'JVC / JVT Corridor', 55.21, 25.03
where not exists (select 1 from communities where slug = 'dubai-production-city-impz');

insert into communities (slug, name, region, lng, lat)
select 'dubai-south-dwc', 'Dubai South (DWC)', 'Jebel Ali & Dubai South', 55.15, 24.89
where not exists (select 1 from communities where slug = 'dubai-south-dwc');

insert into communities (slug, name, region, lng, lat)
select 'dubailand-residence-complex', 'Dubailand Residence Complex', 'Dubailand East', 55.29, 25.045
where not exists (select 1 from communities where slug = 'dubailand-residence-complex');

insert into communities (slug, name, region, lng, lat)
select 'emaar-south', 'Emaar South', 'Jebel Ali & Dubai South', 55.12, 24.856
where not exists (select 1 from communities where slug = 'emaar-south');

insert into communities (slug, name, region, lng, lat)
select 'falcon-city-of-wonders', 'Falcon City of Wonders', 'Dubailand East', 55.32, 25.07
where not exists (select 1 from communities where slug = 'falcon-city-of-wonders');

insert into communities (slug, name, region, lng, lat)
select 'ghaf-woods', 'Ghaf Woods', 'Dubailand East', 55.29, 25.05
where not exists (select 1 from communities where slug = 'ghaf-woods');

insert into communities (slug, name, region, lng, lat)
select 'green-community-dip', 'Green Community DIP', 'Jebel Ali & Dubai South', 55.174, 24.988
where not exists (select 1 from communities where slug = 'green-community-dip');

insert into communities (slug, name, region, lng, lat)
select 'international-city-phase-2', 'International City Phase 2', 'Silicon Oasis & Academic City', 55.423, 25.154
where not exists (select 1 from communities where slug = 'international-city-phase-2');

insert into communities (slug, name, region, lng, lat)
select 'jumeirah-bay-island', 'Jumeirah Bay Island', 'Jumeirah Coast', 55.247, 25.211
where not exists (select 1 from communities where slug = 'jumeirah-bay-island');

insert into communities (slug, name, region, lng, lat)
select 'jumeirah-garden-city', 'Jumeirah Garden City', 'Central Dubai', 55.272, 25.233
where not exists (select 1 from communities where slug = 'jumeirah-garden-city');

insert into communities (slug, name, region, lng, lat)
select 'jumeirah-golf-estates', 'Jumeirah Golf Estates', 'Emirates Living', 55.178, 25.035
where not exists (select 1 from communities where slug = 'jumeirah-golf-estates');

insert into communities (slug, name, region, lng, lat)
select 'jumeirah-heights', 'Jumeirah Heights', 'Emirates Living', 55.144, 25.062
where not exists (select 1 from communities where slug = 'jumeirah-heights');

insert into communities (slug, name, region, lng, lat)
select 'jumeirah-islands', 'Jumeirah Islands', 'Emirates Living', 55.151, 25.055
where not exists (select 1 from communities where slug = 'jumeirah-islands');

insert into communities (slug, name, region, lng, lat)
select 'jumeirah-lake-towers-jlt', 'Jumeirah Lake Towers (JLT)', 'Marina & New Dubai', 55.144, 25.0693
where not exists (select 1 from communities where slug = 'jumeirah-lake-towers-jlt');

insert into communities (slug, name, region, lng, lat)
select 'jumeirah-park', 'Jumeirah Park', 'Emirates Living', 55.152, 25.043
where not exists (select 1 from communities where slug = 'jumeirah-park');

insert into communities (slug, name, region, lng, lat)
select 'la-mer-port-de-la-mer', 'La Mer / Port de La Mer', 'Jumeirah Coast', 55.2575, 25.2355
where not exists (select 1 from communities where slug = 'la-mer-port-de-la-mer');

insert into communities (slug, name, region, lng, lat)
select 'living-legends', 'Living Legends', 'Dubailand East', 55.306, 25.048
where not exists (select 1 from communities where slug = 'living-legends');

insert into communities (slug, name, region, lng, lat)
select 'liwan-2', 'Liwan 2', 'Dubailand East', 55.348, 25.05
where not exists (select 1 from communities where slug = 'liwan-2');

insert into communities (slug, name, region, lng, lat)
select 'mbr-city-district-11', 'MBR City District 11', 'Meydan & MBR City', 55.32, 25.155
where not exists (select 1 from communities where slug = 'mbr-city-district-11');

insert into communities (slug, name, region, lng, lat)
select 'mankhool', 'Mankhool', 'Bur Dubai', 55.294, 25.253
where not exists (select 1 from communities where slug = 'mankhool');

insert into communities (slug, name, region, lng, lat)
select 'margham', 'Margham', 'Outer Dubai', 55.6, 24.7
where not exists (select 1 from communities where slug = 'margham');

insert into communities (slug, name, region, lng, lat)
select 'meydan-city', 'Meydan City', 'Meydan & MBR City', 55.302, 25.161
where not exists (select 1 from communities where slug = 'meydan-city');

insert into communities (slug, name, region, lng, lat)
select 'mina-rashid', 'Mina Rashid', 'Bur Dubai', 55.276, 25.267
where not exists (select 1 from communities where slug = 'mina-rashid');

insert into communities (slug, name, region, lng, lat)
select 'mohammed-bin-rashid-city-mbr-city', 'Mohammed Bin Rashid City (MBR City)', 'Meydan & MBR City', 55.29, 25.17
where not exists (select 1 from communities where slug = 'mohammed-bin-rashid-city-mbr-city');

insert into communities (slug, name, region, lng, lat)
select 'muhaisnah-1', 'Muhaisnah 1', 'Al Qusais & North East', 55.413, 25.279
where not exists (select 1 from communities where slug = 'muhaisnah-1');

insert into communities (slug, name, region, lng, lat)
select 'muhaisnah-4', 'Muhaisnah 4', 'Al Qusais & North East', 55.429, 25.286
where not exists (select 1 from communities where slug = 'muhaisnah-4');

insert into communities (slug, name, region, lng, lat)
select 'mushrif', 'Mushrif', 'Mirdif & Khawaneej', 55.42, 25.228
where not exists (select 1 from communities where slug = 'mushrif');

insert into communities (slug, name, region, lng, lat)
select 'nad-al-sheba-gardens', 'Nad Al Sheba Gardens', 'Meydan & MBR City', 55.318, 25.165
where not exists (select 1 from communities where slug = 'nad-al-sheba-gardens');

insert into communities (slug, name, region, lng, lat)
select 'pearl-jumeira', 'Pearl Jumeira', 'Jumeirah Coast', 55.254, 25.227
where not exists (select 1 from communities where slug = 'pearl-jumeira');

insert into communities (slug, name, region, lng, lat)
select 'rukan-community', 'Rukan Community', 'Dubailand East', 55.36, 25
where not exists (select 1 from communities where slug = 'rukan-community');

insert into communities (slug, name, region, lng, lat)
select 'serena', 'Serena', 'Dubailand West', 55.262, 25.006
where not exists (select 1 from communities where slug = 'serena');

insert into communities (slug, name, region, lng, lat)
select 'sobha-hartland-ii', 'Sobha Hartland II', 'Meydan & MBR City', 55.305, 25.17
where not exists (select 1 from communities where slug = 'sobha-hartland-ii');

insert into communities (slug, name, region, lng, lat)
select 'the-oasis-by-emaar', 'The Oasis by Emaar', 'Jebel Ali & Dubai South', 55.2, 24.97
where not exists (select 1 from communities where slug = 'the-oasis-by-emaar');

insert into communities (slug, name, region, lng, lat)
select 'the-valley-by-emaar', 'The Valley by Emaar', 'Dubailand East', 55.44, 24.925
where not exists (select 1 from communities where slug = 'the-valley-by-emaar');

insert into communities (slug, name, region, lng, lat)
select 'the-world-islands', 'The World Islands', 'Jumeirah Coast', 55.17, 25.22
where not exists (select 1 from communities where slug = 'the-world-islands');

insert into communities (slug, name, region, lng, lat)
select 'trade-centre-sheikh-zayed-road', 'Trade Centre / Sheikh Zayed Road', 'Central Dubai', 55.2845, 25.2265
where not exists (select 1 from communities where slug = 'trade-centre-sheikh-zayed-road');

insert into communities (slug, name, region, lng, lat)
select 'umm-hurair-1', 'Umm Hurair 1', 'Bur Dubai', 55.306, 25.245
where not exists (select 1 from communities where slug = 'umm-hurair-1');

insert into communities (slug, name, region, lng, lat)
select 'umm-hurair-2', 'Umm Hurair 2', 'Bur Dubai', 55.316, 25.234
where not exists (select 1 from communities where slug = 'umm-hurair-2');

insert into communities (slug, name, region, lng, lat)
select 'uptown-mirdif', 'Uptown Mirdif', 'Mirdif & Khawaneej', 55.426, 25.223
where not exists (select 1 from communities where slug = 'uptown-mirdif');

insert into communities (slug, name, region, lng, lat)
select 'victory-heights', 'Victory Heights', 'Dubailand West', 55.215, 25.043
where not exists (select 1 from communities where slug = 'victory-heights');

insert into communities (slug, name, region, lng, lat)
select 'villanova', 'Villanova', 'Dubailand East', 55.32, 25
where not exists (select 1 from communities where slug = 'villanova');

insert into communities (slug, name, region, lng, lat)
select 'wadi-al-safa-5', 'Wadi Al Safa 5', 'Dubailand East', 55.295, 25.055
where not exists (select 1 from communities where slug = 'wadi-al-safa-5');

insert into communities (slug, name, region, lng, lat)
select 'wadi-al-safa-7', 'Wadi Al Safa 7', 'Dubailand East', 55.315, 25.035
where not exists (select 1 from communities where slug = 'wadi-al-safa-7');

insert into communities (slug, name, region, lng, lat)
select 'warsan-village', 'Warsan Village', 'Silicon Oasis & Academic City', 55.405, 25.17
where not exists (select 1 from communities where slug = 'warsan-village');

insert into communities (slug, name, region, lng, lat)
select 'wasl-gate', 'Wasl Gate', 'Jebel Ali & Dubai South', 55.118, 25.025
where not exists (select 1 from communities where slug = 'wasl-gate');

notify pgrst, 'reload schema';
