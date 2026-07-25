create table platform_settings (
  key text primary key,
  label text not null,
  value text not null default '',
  updated_at timestamptz not null default now()
);

alter table platform_settings enable row level security;

create policy "platform_settings: admin manages" on platform_settings for all
  using (is_admin()) with check (is_admin());

insert into platform_settings (key, label, value) values
  ('google_maps_api_key', 'Google Maps API', ''),
  ('mapbox_api_key', 'Mapbox API', ''),
  ('smtp_host', 'SMTP Host', ''),
  ('whatsapp_api_key', 'WhatsApp API', ''),
  ('firebase_config', 'Firebase', ''),
  ('payment_gateway', 'Payment Gateway', ''),
  ('cloud_storage_bucket', 'Cloud Storage Bucket', 'project-media'),
  ('cdn_url', 'CDN URL', ''),
  ('social_login_providers', 'Social Login', ''),
  ('google_analytics_id', 'Google Analytics', ''),
  ('gtm_container_id', 'Google Tag Manager', ''),
  ('meta_pixel_id', 'Meta Pixel', ''),
  ('tiktok_pixel_id', 'TikTok Pixel', '');
