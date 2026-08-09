-- SEO: 3 new blog posts targeting specific, long-tail buyer-intent
-- keywords ("payment plans explained", "DLD fees breakdown", "off-plan
-- vs ready") rather than broad, already-dominated terms like "Dubai
-- property" -- see the master plan snapshot / this session's SEO
-- discussion for why. Content is real, general real-estate education
-- (payment structures, statutory fee rates, buyer trade-offs), not
-- fabricated statistics -- same standard as the 3 existing seed posts
-- from patch_12_blog.sql. Idempotent: only inserts a slug that doesn't
-- already exist.

insert into blog_posts (slug, title, excerpt, body, gradient, published)
select 'off-plan-vs-ready-dubai-property',
  'Off-Plan vs Ready Property in Dubai: Which Should You Buy?',
  'The real trade-offs between buying an off-plan unit from a developer and a ready, handed-over property -- price, risk, and how soon you can move in or rent it out.',
  'Both off-plan and ready property are genuine, common ways to buy in Dubai, and the right choice depends on what you''re optimizing for -- price, timeline, or certainty.

Off-plan means buying directly from the developer before (or during) construction, usually on a payment plan spread across milestones instead of one lump sum. The appeal is a lower entry price versus a comparable finished unit, and the chance of capital appreciation between booking and handover if the project performs well. The trade-off is real: construction timelines can slip, and until handover you own a contract, not a finished asset.

Ready property is already built and, in most cases, already has a track record -- you can walk the unit, see the actual finish quality, and in many cases start renting it out or moving in almost immediately after transfer. You typically pay closer to full price upfront (or via a mortgage), and you lose the "buy below tomorrow''s price" upside off-plan can offer, but you also remove construction and delivery risk entirely.

A few practical questions worth asking yourself before choosing:

Do you need the property to generate rental income or be liveable within months, not years? Ready property removes the wait. Off-plan doesn''t generate a return until handover, sometimes several years out.

How much of your capital do you want tied up at once? Off-plan payment plans (commonly structured as 60/40, 70/30, or with a post-handover component) let you spread cost over time -- see our payment plan calculator to model a specific project''s schedule against your own cash flow.

How much developer-delivery risk are you comfortable with? Check the developer''s track record on past project handovers -- on-time delivery history matters more than the marketing brochure.

Neither option is inherently better -- they serve different goals. Many investors in Dubai hold a mix of both: off-plan for growth exposure, ready for immediate yield.',
  'from-violet-500/40 via-slate-800 to-slate-950',
  true
where not exists (select 1 from blog_posts where slug = 'off-plan-vs-ready-dubai-property');

insert into blog_posts (slug, title, excerpt, body, gradient, published)
select 'dubai-property-payment-plans-explained',
  'Dubai Property Payment Plans Explained: 60/40, 70/30 & Post-Handover',
  'How off-plan payment plans actually work in Dubai -- what the numbers in "60/40" mean, what post-handover plans add, and what to check before signing.',
  'Off-plan payment plans are one of the biggest reasons buyers choose Dubai over other markets -- but the shorthand ("60/40", "70/30", "1% monthly") can be confusing if you haven''t seen one broken down before.

The two numbers describe how the total price is split between during construction and at handover. A "70/30" plan means 70% of the price is paid in instalments during construction, tied to booking and build milestones, with the remaining 30% due on handover when you receive the keys and title. A "60/40" plan shifts more of the cost to handover. Neither number is inherently better -- a plan weighted more toward handover means less cash committed while the project is still being built.

Post-handover payment plans go a step further, letting part of the price (sometimes a significant share) be paid in instalments AFTER you already own and can use or rent the property -- effectively financing directly through the developer rather than a bank, often interest-free over the term. These are common on newer launches and can be attractive if you want to use rental income from the unit itself to help fund the remaining payments.

A few things worth checking on any payment plan before reserving a unit:

Is each instalment tied to a specific, verifiable construction milestone, or just a calendar date? Milestone-tied payments are the more buyer-protective structure.

Is the developer''s escrow account set up correctly per RERA requirements? Payments into a regulated escrow account are a real protection if a project is delayed or, in a worst case, doesn''t complete.

What exactly happens if you want to exit before handover -- can the unit be resold, and are there exit fees or a minimum holding period?

Once you have a specific project''s payment schedule, our payment plan calculator lets you enter the real percentages and dates to see exactly what you''d owe and when, rather than working it out on paper.',
  'from-cyan-500/40 via-slate-800 to-slate-950',
  true
where not exists (select 1 from blog_posts where slug = 'dubai-property-payment-plans-explained');

insert into blog_posts (slug, title, excerpt, body, gradient, published)
select 'dld-fees-closing-costs-dubai-property',
  'DLD Fees & Closing Costs When Buying Property in Dubai',
  'A full breakdown of the Dubai Land Department transfer fee and the other closing costs buyers actually pay on top of the property price.',
  'The price you see listed on a project isn''t the full amount you''ll pay to actually own the property -- there''s a standard set of closing costs on top, and knowing them upfront avoids surprises at transfer.

The largest one is the Dubai Land Department (DLD) transfer fee, set at 4% of the property''s purchase price, payable at the point of registering the transfer. This applies to both off-plan and ready property purchases and is typically split between buyer and seller by agreement, though on new off-plan sales it''s common for the buyer to cover it directly with the developer.

Beyond the DLD fee, buyers should budget for: an admin/registration fee charged by DLD for issuing the title deed (a fixed amount rather than a percentage); a mortgage registration fee of 0.25% of the loan amount if you''re financing the purchase, plus the bank''s own arrangement fee; and, on the secondary (resale) market specifically, a broker commission, conventionally around 2% of the price, paid by whichever side engaged the broker.

For off-plan purchases directly from a developer, some of these secondary-market costs (like broker commission) don''t apply the same way, but the DLD transfer fee still does, and some developers also charge their own admin fee at the time of the sales agreement -- always confirm the exact fee schedule in your specific project''s sales contract rather than assuming it matches a general estimate.

A rough rule of thumb many buyers use: budget an additional 6-8% on top of the purchase price to cover DLD fees, registration, and (where applicable) mortgage and broker costs -- though the exact figure depends on financing and whether it''s an off-plan or resale purchase.

Our DLD fee calculator lets you enter a specific purchase price and get the actual transfer fee and estimated total closing costs, rather than relying on a rule of thumb.',
  'from-rose-500/40 via-slate-800 to-slate-950',
  true
where not exists (select 1 from blog_posts where slug = 'dld-fees-closing-costs-dubai-property');
