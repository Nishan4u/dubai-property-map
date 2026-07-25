create table site_content (
  slug text primary key,
  title text not null,
  body text not null default '',
  updated_at timestamptz not null default now()
);

alter table site_content enable row level security;

create policy "site_content: public read" on site_content for select using (true);
create policy "site_content: admin manages" on site_content for all
  using (is_admin()) with check (is_admin());

insert into site_content (slug, title, body) values
  ('about', 'About Dubai Property Map', 'Dubai Property Map helps buyers and investors discover off-plan and ready properties across Dubai, and gives developers a platform to reach serious buyers.'),
  ('contact', 'Contact Us', 'Email: hello@dubaipropertymap.com\nPhone: +971 4 000 0000\nOffice: Downtown Dubai, UAE'),
  ('faq', 'Frequently Asked Questions', 'Q: Is listing free?\nA: We offer a free tier plus paid plans for featured placement.\n\nQ: How do I book a viewing?\nA: Use the "Book Appointment" button on any project page.');
