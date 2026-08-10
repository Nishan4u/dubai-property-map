-- Follow-on from patch_137: the other half of the AdSense-rejection content
-- audit. Every community with at least one real published listing, and
-- every real (non-test, non-empty) published project, previously had either
-- no description at all or a single one-line tagline (60-100 characters) --
-- both a likely factor in AdSense's "insufficient content" rejection and,
-- separately, just genuinely thin for real visitors.
--
-- Every description below is grounded in real, verifiable facts: for
-- projects, the developer/community/property-type/bedroom-range/amenities/
-- tags/handover/payment-plan already stored on that exact row (pulled via a
-- service-role read before writing this, not guessed); for communities,
-- well-documented, non-controversial public facts about these specific,
-- well-known Dubai districts (location, what they're known for, how they're
-- connected). No fabricated pricing, ratings, awards, or amenities beyond
-- what's already in the database.
--
-- Deliberately excludes the 8 "Beyond" projects and 4 test rows handled by
-- patch_137 -- no point writing marketing copy for listings being taken
-- back to draft until they have real price/bedroom/photo data of their own.
--
-- Idempotent: plain UPDATE ... WHERE slug = '...', safe to re-run.

-- ---------- Communities (14, all with >=1 real published listing) ----------

update communities set description = 'An older, established residential neighbourhood in Deira, on Dubai''s eastern bank of the Creek. It''s a dense, mixed low- and mid-rise area popular with long-term residents for its affordability and its proximity to Dubai''s original commercial core, with the Abu Hail and Al Qiyadah Metro stations both nearby on the Green Line. Development here tends to be smaller-scale renovation and infill rather than large master-planned launches, so new listings are less common than in Dubai''s newer growth corridors.' where slug = 'abu-hail';

update communities set description = 'A fast-growing residential pocket in Dubailand, best known for sitting directly next to Dubai Miracle Garden and Dubai Butterfly Garden. It has become one of the city''s go-to areas for affordably priced apartments, drawing a mix of end-users and investors chasing rental yield rather than the ultra-luxury waterfront segment. Sheikh Mohammed Bin Zayed Road gives quick access to both Downtown Dubai and Dubai Marina, and the area has filled in quickly over the past few years with mid-rise apartment towers from a range of developers.' where slug = 'arjan';

update communities set description = 'Dubai''s dedicated business and lifestyle district, built around the Dubai Water Canal directly south of Downtown Dubai. It mixes commercial towers with high-density residential apartment buildings, and its canal-front promenade, restaurants, and marina berths have made it one of the more walkable central districts. Its location -- minutes from Downtown, Sheikh Zayed Road, and DIFC -- makes it a consistently strong rental market for professionals working in the city centre.' where slug = 'business-bay';

update communities set description = 'A golf-course master community built around the Trump International Golf Club Dubai, developed by DAMAC Properties along Umm Suqeim Road. It''s a lower-density, villa-and-townhouse-led community aimed at families wanting more space and greenery than Dubai''s high-rise districts, with its own retail, schools, and parks built in as the community matured. Ready inventory here, rather than off-plan, is relatively common, since much of the community was delivered in earlier phases.' where slug = 'damac-hills';

update communities set description = 'DAMAC''s larger, more affordable follow-on community further out along Al Qudra Road, built around a lagoon-style water feature at its centre with additional themed clusters, including a Venice-inspired villa collection. It targets buyers who want a villa or townhouse lifestyle at a lower entry price than DAMAC Hills or Dubai Hills Estate, trading a longer commute for larger plots and lower per-square-foot pricing.' where slug = 'damac-hills-2';

update communities set description = 'A well-established, mid-rise apartment community in Dubai Production City, one of the more affordable options close to Dubai Marina and Ibn Battuta Mall via Sheikh Zayed Road. Built around six themed clusters of landscaped gardens, it''s popular with long-term tenants and first-time investors rather than the luxury end of the market, and most of its buildings were delivered years ago, so ready -- not off-plan -- stock dominates.' where slug = 'discovery-gardens';

update communities set description = 'Emaar''s large-scale waterfront master plan on the banks of Dubai Creek, facing the Ras Al Khor Wildlife Sanctuary and positioned as the future site of Dubai Creek Tower. It''s being built out in phases with a mix of apartment towers and lower-rise residential clusters, an island district, and retail promenades along the water, and has become one of the more closely watched off-plan launch locations in the city given its Downtown-adjacent location and long-term master-plan backing.' where slug = 'dubai-creek-harbour';

update communities set description = 'A large, green master community jointly developed by Emaar and Meraas, centred on an 18-hole championship golf course and anchored by Dubai Hills Mall. It mixes villas, townhouses, and mid-rise apartments across dozens of sub-clusters, with its own schools, parks, and retail built in, and sits centrally between Downtown Dubai and Dubai Marina via Al Khail Road -- making it one of the more consistently in-demand family-oriented communities for both end-users and investors.' where slug = 'dubai-hills-estate';

update communities set description = 'A cluster of five reclaimed islands off Dubai''s northern coast, formerly known as Deira Islands, being redeveloped as a waterfront residential and hospitality district with beachfront apartment towers, marinas, and resort-branded hotels. It''s a newer, still-developing area compared with Dubai''s established waterfront districts, with several master developers delivering phased launches along its beachfront.' where slug = 'dubai-islands';

update communities set description = 'One of Dubai''s original large-scale waterfront developments: a dense cluster of high-rise towers built around an artificial marina, connected by the Dubai Marina Walk promenade and directly adjacent to JBR beach. It remains one of the most liquid rental and resale markets in the city thanks to its beach access, the Dubai Tram and Marina Metro stations, and its concentration of restaurants and retail at street level.' where slug = 'dubai-marina';

update communities set description = 'A dedicated maritime-industry and waterfront-residential district on a peninsula near Port Rashid, positioned as a hub for shipping, yachting, and marine services alongside newer residential towers. As a still-developing waterfront area, rather than an established one like Dubai Marina or Palm Jumeirah, pricing and delivered inventory here vary significantly by building and phase.' where slug = 'dubai-maritime-city';

update communities set description = 'A cluster of high-rise towers built around a series of artificial lakes in Dubai Production City, directly across Sheikh Zayed Road from Dubai Marina. Its mix of freehold apartment and office towers, DMCC free-zone status, and lakeside walking paths have made it a popular, comparatively affordable alternative to Marina living with similar connectivity via the Dubai Metro''s JLT stations.' where slug = 'jumeirah-lakes-towers';

update communities set description = 'A large, circular master community in the heart of "new Dubai," built primarily around a central park and ring of low- and mid-rise apartment and townhouse clusters. It has grown rapidly over the past decade into one of the city''s most active mid-market investment areas, valued for its central location between Sheikh Zayed Road and Al Khail Road and its relatively affordable entry price compared with the coastal districts.' where slug = 'jumeirah-village-circle';

update communities set description = 'Dubai''s original man-made palm-shaped island, home to some of the city''s most recognisable beachfront villas, branded residences, and resort hotels along its fronds and crescent. As one of the most established luxury addresses in Dubai, it commands a consistent premium over almost every other waterfront community in the city, with direct private beach access being its defining feature.' where slug = 'palm-jumeirah';

-- ---------- Projects (14 real, complete, published/featured listings) ----------

update projects set description = 'Arjan Green Residence is a Binghatti-developed apartment building in Arjan, offering studio to two-bedroom units aimed squarely at the sub-AED-1-million investor segment. Its position just off Sheikh Mohammed Bin Zayed Road puts Dubai Miracle Garden and Dubai Autodrome within a few minutes'' drive, and its building amenities are kept simple -- a pool and gym -- in line with its budget-conscious positioning. Handover is scheduled for Q3 2026.' where slug = 'arjan-green-residence';

update projects set description = 'Bay by Cavalli is DAMAC Properties'' Roberto Cavalli-branded waterfront tower in Dubai Creek Harbour, offering two- to five-bedroom apartments with views over the Creek toward the Ras Al Khor Wildlife Sanctuary and Downtown Dubai skyline. In-building amenities lean into the branded-residence positioning, with a private beach, cinema, smart-home fit-out, pool, and gym. Handover is scheduled for Q4 2028 on a 70/30 payment plan.' where slug = 'bay-by-cavalli';

update projects set description = 'Binghatti Skyrise is a new-launch apartment tower in Business Bay from Binghatti, known locally for its distinctive angular facade design language. Units range from studios to three bedrooms, positioned toward Business Bay''s canal-front rental market, with a sky lounge, pool, and gym among the building amenities. Handover is Q1 2027 on a 50/50 payment plan.' where slug = 'binghatti-skyrise';

update projects set description = 'Chelsea Residences is a DAMAC Properties waterfront development on Dubai Islands, offering one- to four-bedroom apartments with resort-style amenities including a pool, gym, kids'' area, cinema, and sky lounge, plus smart-home technology throughout. It''s positioned as a new-launch off-plan opportunity on a 70/30 payment plan, with handover scheduled for Q2 2028.' where slug = 'chelsea-residences';

update projects set description = 'Circle Mansions is Ellington Properties'' low-rise residential collection built around JVC''s central park, offering one- to three-bedroom homes aimed at the sub-AED-1-million bracket. It carries Ellington''s contemporary architectural style, with a pool, gym, and kids'' area among the shared amenities, and an 80/20 payment plan running to a Q3 2026 handover.' where slug = 'circle-mansions';

update projects set description = 'Creek Rise Towers is an Emaar Properties launch within the Dubai Creek Harbour master plan, offering one- to three-bedroom apartments overlooking the Ras Al Khor Wildlife Sanctuary and the Downtown Dubai skyline beyond. Building amenities include a pool, gym, and cinema, with an 80/20 payment plan and handover scheduled for Q1 2029.' where slug = 'creek-rise-towers';

update projects set description = 'DAMAC Lagoons – Venice is one of the Venice-themed villa clusters within DAMAC''s wider DAMAC Lagoons collection in DAMAC Hills 2, offering three- to six-bedroom villas around the community''s signature crystal-lagoon water features and man-made beaches. It''s a pet-friendly, family-oriented villa product with golf, pool, and parking amenities, on a 70/30 payment plan with Q2 2027 handover.' where slug = 'damac-lagoons-venice';

update projects set description = 'Ellington House IV is the fourth instalment of Ellington Properties'' art-inspired apartment collection in Dubai Hills Estate, offering one- to four-bedroom homes with views toward the community''s championship golf course. It carries Ellington''s signature design-forward interiors, with a pool, gym, kids'' area, and parking among the amenities, on a 60/40 payment plan through to Q2 2027 handover.' where slug = 'ellington-house-iv';

update projects set description = 'Hills Park Villas is an Emaar Properties villa collection in Dubai Hills Estate, offering four- to six-bedroom family homes facing the community''s golf course. It''s positioned at the upper end of Dubai Hills Estate''s villa product line, with golf, pool, and gym access among its amenities, on a 60/40 payment plan running to Q4 2027.' where slug = 'hills-park-villas';

update projects set description = 'JLT City Towers is a ready, delivered apartment building in Jumeirah Lakes Towers from Binghatti, offering studio to two-bedroom units aimed at the affordable end of the JLT market. Being already handed over, rather than off-plan, means buyers get immediate access to the building''s pool, gym, and parking, with the JLT Metro stations, Dubai Marina, and JBR all within a short drive.' where slug = 'jlt-city-towers';

update projects set description = 'Marina Vista is an Emaar Properties apartment tower in Dubai Marina, offering one- to three-bedroom units with marina views, a short walk from JBR beach and the Dubai Tram. Amenities include a pool, gym, kids'' area, and parking, with handover on a 100%-on-handover payment structure scheduled for Q3 2025.' where slug = 'marina-vista';

update projects set description = 'Palm Beach Towers is Nakheel''s beachfront apartment development on Palm Jumeirah''s crescent, offering one- to three-bedroom units with private beach access -- the defining feature of Palm Jumeirah living. Smart-home technology, a pool, and gym round out the amenities, with handover on a 100%-on-handover basis scheduled for Q1 2026.' where slug = 'palm-beach-towers';

update projects set description = 'Sobha Hartland II is Sobha Realty''s waterfront extension of its established Hartland masterplan, offering one- to four-bedroom apartments around a lagoon with a man-made beach. Sobha''s in-house construction, rather than third-party contracting, is a distinguishing point for the developer generally, and the building includes pet-friendly policies alongside its pool, gym, and beach amenities, on a 60/40 payment plan to Q4 2027 handover.' where slug = 'sobha-hartland-ii';

update projects set description = 'Trump Estates is DAMAC Properties'' luxury villa collection bordering the Trump International Golf Club Dubai within DAMAC Hills, offering four- to seven-bedroom homes already delivered and ready for handover. Smart-home technology, golf-course frontage, and private pools are among its defining features, positioned at the top end of DAMAC Hills'' villa product line.' where slug = 'trump-estates';

notify pgrst, 'reload schema';
