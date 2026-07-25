create table blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  excerpt text,
  body text not null default '',
  gradient text not null default 'from-amber-500/40 via-slate-800 to-slate-950',
  published boolean not null default false,
  author text default 'Dubai Property Map Team',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table blog_posts enable row level security;

create policy "blog_posts: public read published" on blog_posts for select using (
  published = true or is_admin()
);
create policy "blog_posts: admin manages" on blog_posts for all
  using (is_admin()) with check (is_admin());

insert into blog_posts (slug, title, excerpt, body, gradient, published) values
  (
    'dubai-off-plan-guide-2026',
    'A Buyer''s Guide to Off-Plan Property in Dubai',
    'What off-plan actually means, how payment plans work, and the risks worth knowing before you reserve a unit.',
    'Off-plan property means buying a unit before construction is complete, directly from the developer. Payment plans (like 70/30 or 60/40) let you spread the cost across construction milestones instead of paying up front.\n\nKey things to check before you commit: the developer''s track record on past handovers, whether the project has RERA/escrow account protection, and realistic handover timelines rather than marketing dates.\n\nOff-plan can offer strong capital appreciation if you buy early in a well-located, well-executed project — but it carries construction and delivery-delay risk that ready properties don''t.',
    'from-amber-500/40 via-slate-800 to-slate-950',
    true
  ),
  (
    'golden-visa-real-estate',
    'How Property Investment Can Qualify You for a UAE Golden Visa',
    'A property investment of AED 2 million or more can make you eligible for a 10-year UAE Golden Visa.',
    'The UAE Golden Visa program grants long-term residency (typically 10 years) to real estate investors who purchase property worth AED 2 million or more, either in cash or via an eligible mortgage.\n\nThe visa covers the investor and can be extended to spouse and children, and does not require a local sponsor. Multiple properties can be combined to reach the threshold in some cases.\n\nAs with any visa program, requirements can change — always confirm current criteria with UAE federal authorities or a licensed immigration advisor before making a purchase decision based on visa eligibility.',
    'from-sky-500/40 via-slate-800 to-slate-950',
    true
  ),
  (
    'dubai-market-outlook-2026',
    'Dubai Real Estate Market Outlook',
    'Where demand is concentrated right now across off-plan, ready, and rental segments.',
    'Dubai''s property market has continued to see strong transaction volumes across both off-plan and secondary (ready) segments, with particular demand concentrated in waterfront communities and areas near major infrastructure like metro extensions.\n\nRental yields remain a key draw for investors compared to many global cities, though yields vary significantly by community and property type.\n\nAs always, treat market commentary as general information, not investment advice — do your own due diligence or speak with a licensed real estate advisor before making investment decisions.',
    'from-emerald-500/40 via-slate-800 to-slate-950',
    true
  );
