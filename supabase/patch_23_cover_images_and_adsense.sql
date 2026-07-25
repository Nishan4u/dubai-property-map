-- Real cover photos for project listings (homepage cards, map pins, compare,
-- project detail hero) instead of the decorative gradient-only placeholder.
-- Developers set this from their Media Library ("set as cover" on a gallery
-- photo); these UPDATEs just seed the existing demo projects with real
-- sample photography so listings aren't all gradients out of the box.

alter table projects add column if not exists cover_image_url text;

update projects set cover_image_url = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80' where slug = 'chelsea-residences';
update projects set cover_image_url = 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80' where slug = 'sobha-hartland-ii';
update projects set cover_image_url = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80' where slug = 'binghatti-skyrise';
update projects set cover_image_url = 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80' where slug in ('bay-by-cavalli', 'creek-rise-towers');
update projects set cover_image_url = 'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80' where slug = 'ellington-house-iv';
update projects set cover_image_url = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80' where slug = 'palm-beach-towers';
update projects set cover_image_url = 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80' where slug = 'marina-vista';
update projects set cover_image_url = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80' where slug = 'jlt-city-towers';
update projects set cover_image_url = 'https://images.unsplash.com/photo-1580216643062-cf460548a66a?auto=format&fit=crop&w=1200&q=80' where slug in ('circle-mansions', 'hills-park-villas');
update projects set cover_image_url = 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80' where slug = 'damac-lagoons-venice';
update projects set cover_image_url = 'https://images.unsplash.com/photo-1591474200742-8e512e6f98f8?auto=format&fit=crop&w=1200&q=80' where slug in ('trump-estates', 'meydan-canal-villas');
update projects set cover_image_url = 'https://images.unsplash.com/photo-1523217582562-09d0def993a6?auto=format&fit=crop&w=1200&q=80' where slug = 'arjan-green-residence';

-- Google AdSense/Ad Manager config fields (inert storage like the other 13
-- integration fields — actually serving ads needs a real, approved Google
-- account; this just gives you a place to store the IDs once you have one).
insert into platform_settings (key, label, value) values
  ('google_adsense_publisher_id', 'Google AdSense Publisher ID', ''),
  ('google_ad_manager_network_code', 'Google Ad Manager Network Code', '')
on conflict (key) do nothing;
