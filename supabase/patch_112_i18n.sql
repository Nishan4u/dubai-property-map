-- Multi-language / Arabic / RTL Support (Module 29): additive Arabic
-- content columns on the three public content tables, plus real Arabic
-- names for every existing community (genuine, well-documented Dubai
-- place names) and the major, widely-recognized developer brands.
--
-- Deliberately NOT translated: the ~200 smaller/boutique developer
-- entries (many generic small-business names, a few visible test/QA
-- rows) -- I have no genuine basis to invent an "official" Arabic
-- transliteration for a company I don't actually know, and this
-- codebase has repeatedly refused to fabricate content it can't stand
-- behind. Those rows keep name_ar null and fall back to the English
-- name on public pages, same as any project without a translation yet.
-- Project name_ar/description_ar are left for admin follow-up entirely
-- (hundreds of free-form rows, not a one-pass deliverable).
--
-- Every statement is safely re-runnable, per the patch_104 lesson.

alter table communities add column if not exists name_ar text;
alter table communities add column if not exists description_ar text;
alter table developers add column if not exists name_ar text;
alter table developers add column if not exists description_ar text;
alter table projects add column if not exists name_ar text;
alter table projects add column if not exists description_ar text;

-- ---------- Communities (all existing rows) ----------
update communities set name_ar = 'أبو هيل' where slug = 'abu-hail';
update communities set name_ar = 'العوير' where slug = 'al-awir';
update communities set name_ar = 'البدع' where slug = 'al-badaa';
update communities set name_ar = 'البراحة' where slug = 'al-baraha';
update communities set name_ar = 'البراري' where slug = 'al-barari';
update communities set name_ar = 'البرشاء' where slug = 'al-barsha';
update communities set name_ar = 'البرشاء 1' where slug = 'al-barsha-1';
update communities set name_ar = 'البرشاء 2' where slug = 'al-barsha-2';
update communities set name_ar = 'البرشاء 3' where slug = 'al-barsha-3';
update communities set name_ar = 'البرشاء الجنوبية' where slug = 'al-barsha-south';
update communities set name_ar = 'البرشاء الجنوبية 1' where slug = 'al-barsha-south-1';
update communities set name_ar = 'البرشاء الجنوبية 2' where slug = 'al-barsha-south-2';
update communities set name_ar = 'البرشاء الجنوبية 3' where slug = 'al-barsha-south-3';
update communities set name_ar = 'البرشاء الجنوبية 4' where slug = 'al-barsha-south-4';
update communities set name_ar = 'البرشاء الجنوبية 5' where slug = 'al-barsha-south-5';
update communities set name_ar = 'الفرجان' where slug = 'al-furjan';
update communities set name_ar = 'القرهود' where slug = 'al-garhoud';
update communities set name_ar = 'الحمرية' where slug = 'al-hamriya';
update communities set name_ar = 'الهضيبة' where slug = 'al-hudaiba';
update communities set name_ar = 'الجداف' where slug = 'al-jaddaf';
update communities set name_ar = 'الجافلية' where slug = 'al-jafiliya';
update communities set name_ar = 'الكرامة' where slug = 'al-karama';
update communities set name_ar = 'الخوانيج' where slug = 'al-khawaneej';
update communities set name_ar = 'الخوانيج 1' where slug = 'al-khawaneej-1';
update communities set name_ar = 'الخوانيج 2' where slug = 'al-khawaneej-2';
update communities set name_ar = 'الممزر' where slug = 'al-mamzar';
update communities set name_ar = 'المنارة' where slug = 'al-manara';
update communities set name_ar = 'المنخول' where slug = 'al-mankhool';
update communities set name_ar = 'المزهر' where slug = 'al-mizhar';
update communities set name_ar = 'المرقبات' where slug = 'al-muraqqabat';
update communities set name_ar = 'المطينة' where slug = 'al-muteena';
update communities set name_ar = 'النهدة' where slug = 'al-nahda-dubai';
update communities set name_ar = 'القصيص' where slug = 'al-qusais';
update communities set name_ar = 'القصيص الصناعية' where slug = 'al-qusais-industrial-area';
update communities set name_ar = 'الرفاعة' where slug = 'al-raffa';
update communities set name_ar = 'الرأس' where slug = 'al-ras';
update communities set name_ar = 'الراشدية' where slug = 'al-rashidiya';
update communities set name_ar = 'الرقة' where slug = 'al-rigga';
update communities set name_ar = 'الصفا' where slug = 'al-safa';
update communities set name_ar = 'الصفا 1' where slug = 'al-safa-1';
update communities set name_ar = 'الصفا 2' where slug = 'al-safa-2';
update communities set name_ar = 'السطوة' where slug = 'al-satwa';
update communities set name_ar = 'السوق الكبير' where slug = 'al-souq-al-kabeer';
update communities set name_ar = 'السفوح' where slug = 'al-sufouh';
update communities set name_ar = 'السفوح 1' where slug = 'al-sufouh-1';
update communities set name_ar = 'السفوح 2' where slug = 'al-sufouh-2';
update communities set name_ar = 'الطوار' where slug = 'al-twar';
update communities set name_ar = 'الورقاء' where slug = 'al-warqa';
update communities set name_ar = 'الورقاء 1' where slug = 'al-warqa-1';
update communities set name_ar = 'الورقاء 2' where slug = 'al-warqa-2';
update communities set name_ar = 'الورقاء 3' where slug = 'al-warqa-3';
update communities set name_ar = 'الورقاء 4' where slug = 'al-warqa-4';
update communities set name_ar = 'الورقاء 5' where slug = 'al-warqa-5';
update communities set name_ar = 'الوصل' where slug = 'al-wasl';
update communities set name_ar = 'ذا رانشيز العربية' where slug = 'arabian-ranches';
update communities set name_ar = 'ذا رانشيز العربية 2' where slug = 'arabian-ranches-ii';
update communities set name_ar = 'ذا رانشيز العربية 3' where slug = 'arabian-ranches-iii';
update communities set name_ar = 'أرجان' where slug = 'arjan';
update communities set name_ar = 'مرتفعات البرشاء' where slug = 'barsha-heights';
update communities set name_ar = 'جزيرة بلوواترز' where slug = 'bluewaters-island';
update communities set name_ar = 'بر دبي' where slug = 'bur-dubai';
update communities set name_ar = 'الخليج التجاري' where slug = 'business-bay';
update communities set name_ar = 'سيتي ووك' where slug = 'city-walk';
update communities set name_ar = 'القرية الثقافية' where slug = 'culture-village';
update communities set name_ar = 'داماك هيلز' where slug = 'damac-hills';
update communities set name_ar = 'داماك هيلز 2' where slug = 'damac-hills-2';
update communities set name_ar = 'داماك لاجونز' where slug = 'damac-lagoons';
update communities set name_ar = 'ديرة' where slug = 'deira';
update communities set name_ar = 'مركز دبي المالي العالمي' where slug = 'difc';
update communities set name_ar = 'ديسكفري غاردنز' where slug = 'discovery-gardens';
update communities set name_ar = 'ديستريكت ون' where slug = 'district-one';
update communities set name_ar = 'وسط مدينة دبي' where slug = 'downtown-dubai';
update communities set name_ar = 'المنطقة الحرة لمطار دبي' where slug = 'dubai-airport-freezone';
update communities set name_ar = 'مرسى خور دبي' where slug = 'dubai-creek-harbour';
update communities set name_ar = 'حي دبي للتصميم' where slug = 'dubai-design-district-d3';
update communities set name_ar = 'مدينة دبي الفستيفال' where slug = 'dubai-festival-city';
update communities set name_ar = 'ميناء دبي' where slug = 'dubai-harbour';
update communities set name_ar = 'مدينة دبي الطبية' where slug = 'dubai-healthcare-city';
update communities set name_ar = 'مرتفعات دبي' where slug = 'dubai-hills-estate';
update communities set name_ar = 'مدينة دبي الصناعية' where slug = 'dubai-industrial-city';
update communities set name_ar = 'مجمع دبي للاستثمار' where slug = 'dubai-investment-park';
update communities set name_ar = 'جزر دبي' where slug = 'dubai-islands';
update communities set name_ar = 'مجمع دبي لاند السكني' where slug = 'dubai-land-residence-complex';
update communities set name_ar = 'مرسى دبي' where slug = 'dubai-marina';
update communities set name_ar = 'مدينة دبي الملاحية' where slug = 'dubai-maritime-city';
update communities set name_ar = 'مدينة دبي للإنتاج' where slug = 'dubai-production-city';
update communities set name_ar = 'مجمع دبي للعلوم' where slug = 'dubai-science-park';
update communities set name_ar = 'واحة دبي للسيليكون' where slug = 'dubai-silicon-oasis';
update communities set name_ar = 'دبي الجنوب' where slug = 'dubai-south';
update communities set name_ar = 'مدينة دبي الرياضية' where slug = 'dubai-sports-city';
update communities set name_ar = 'مدينة دبي للاستوديوهات' where slug = 'dubai-studio-city';
update communities set name_ar = 'واجهة دبي البحرية' where slug = 'dubai-waterfront';
update communities set name_ar = 'مركز دبي التجاري العالمي' where slug = 'dubai-world-trade-centre';
update communities set name_ar = 'دبي لاند' where slug = 'dubailand';
update communities set name_ar = 'إعمار بيتش فرونت' where slug = 'emaar-beachfront';
update communities set name_ar = 'تلال الإمارات' where slug = 'emirates-hills';
update communities set name_ar = 'إكسبو سيتي دبي' where slug = 'expo-city-dubai';
update communities set name_ar = 'حتا' where slug = 'hatta';
update communities set name_ar = 'هور العنز' where slug = 'hor-al-anz';
update communities set name_ar = 'المدينة العالمية' where slug = 'international-city';
update communities set name_ar = 'جبل علي' where slug = 'jebel-ali';
update communities set name_ar = 'المنطقة الحرة جبل علي' where slug = 'jebel-ali-free-zone';
update communities set name_ar = 'جبل علي الصناعية' where slug = 'jebel-ali-industrial-area';
update communities set name_ar = 'قرية جبل علي' where slug = 'jebel-ali-village';
update communities set name_ar = 'جميرا' where slug = 'jumeirah';
update communities set name_ar = 'جميرا 1' where slug = 'jumeirah-1';
update communities set name_ar = 'جميرا 2' where slug = 'jumeirah-2';
update communities set name_ar = 'جميرا 3' where slug = 'jumeirah-3';
update communities set name_ar = 'إقامة شاطئ جميرا (جي بي آر)' where slug = 'jumeirah-beach-residence-jbr';
update communities set name_ar = 'أبراج بحيرات جميرا' where slug = 'jumeirah-lakes-towers';
update communities set name_ar = 'قرية جميرا الدائرية' where slug = 'jumeirah-village-circle';
update communities set name_ar = 'قرية جميرا المثلثة' where slug = 'jumeirah-village-triangle-jvt';
update communities set name_ar = 'ليوان' where slug = 'liwan';
update communities set name_ar = 'مدينة جميرا ليفينغ' where slug = 'madinat-jumeirah-living';
update communities set name_ar = 'ماجان' where slug = 'majan';
update communities set name_ar = 'ميدان' where slug = 'meydan';
update communities set name_ar = 'ميناء راشد / يخوت ومرسى راشد' where slug = 'mina-rashid-rashid-yachts-and-marina';
update communities set name_ar = 'مردف' where slug = 'mirdif';
update communities set name_ar = 'مدينة محمد بن راشد' where slug = 'mohammed-bin-rashid-city';
update communities set name_ar = 'موتور سيتي' where slug = 'motor-city';
update communities set name_ar = 'مدن' where slug = 'mudon';
update communities set name_ar = 'محيصنة' where slug = 'muhaisnah';
update communities set name_ar = 'ند الحمر' where slug = 'nad-al-hamar';
update communities set name_ar = 'ند الشبا' where slug = 'nad-al-sheba';
update communities set name_ar = 'ند الشبا 1' where slug = 'nad-al-sheba-1';
update communities set name_ar = 'ند الشبا 2' where slug = 'nad-al-sheba-2';
update communities set name_ar = 'ند الشبا 3' where slug = 'nad-al-sheba-3';
update communities set name_ar = 'ند الشبا 4' where slug = 'nad-al-sheba-4';
update communities set name_ar = 'ند الشما' where slug = 'nad-shamma';
update communities set name_ar = 'نايف' where slug = 'naif';
update communities set name_ar = 'عود ميثاء' where slug = 'oud-metha';
update communities set name_ar = 'نخلة جبل علي' where slug = 'palm-jebel-ali';
update communities set name_ar = 'نخلة جميرا' where slug = 'palm-jumeirah';
update communities set name_ar = 'بورسعيد' where slug = 'port-saeed';
update communities set name_ar = 'رأس الخور' where slug = 'ras-al-khor';
update communities set name_ar = 'رأس الخور الصناعية' where slug = 'ras-al-khor-industrial-area';
update communities set name_ar = 'رمرام' where slug = 'remraam';
update communities set name_ar = 'صبحا هارتلاند' where slug = 'sobha-hartland';
update communities set name_ar = 'ذا غاردنز' where slug = 'the-gardens';
update communities set name_ar = 'ذا غرينز' where slug = 'the-greens';
update communities set name_ar = 'ذا ليكس' where slug = 'the-lakes';
update communities set name_ar = 'ذا ميدوز' where slug = 'the-meadows';
update communities set name_ar = 'ذا سبرينغز' where slug = 'the-springs';
update communities set name_ar = 'المدينة المستدامة' where slug = 'the-sustainable-city';
update communities set name_ar = 'ذا فيوز' where slug = 'the-views';
update communities set name_ar = 'ذا فيلا' where slug = 'the-villa';
update communities set name_ar = 'تلال الغاف' where slug = 'tilal-al-ghaf';
update communities set name_ar = 'تاون سكوير دبي' where slug = 'town-square-dubai';
update communities set name_ar = 'أم الشيف' where slug = 'umm-al-sheif';
update communities set name_ar = 'أم رمول' where slug = 'umm-ramool';
update communities set name_ar = 'أم سقيم' where slug = 'umm-suqeim';
update communities set name_ar = 'أم سقيم 1' where slug = 'umm-suqeim-1';
update communities set name_ar = 'أم سقيم 2' where slug = 'umm-suqeim-2';
update communities set name_ar = 'أم سقيم 3' where slug = 'umm-suqeim-3';
update communities set name_ar = 'وادي الصفا' where slug = 'wadi-al-safa';
update communities set name_ar = 'ورسان' where slug = 'warsan';
update communities set name_ar = 'زعبيل' where slug = 'zabeel';
update communities set name_ar = 'زعبيل 1' where slug = 'zabeel-1';
update communities set name_ar = 'زعبيل 2' where slug = 'zabeel-2';

-- ---------- Developers (major, widely-recognized brands only) ----------
update developers set name_ar = 'داماك العقارية' where slug = 'damac-properties';
update developers set name_ar = 'إعمار العقارية' where slug = 'emaar-properties';
update developers set name_ar = 'نخيل' where slug = 'nakheel';
update developers set name_ar = 'سوبا ريالتي' where slug = 'sobha-realty';
update developers set name_ar = 'عزيزي للتطوير العقاري' where slug = 'azizi-developments';
update developers set name_ar = 'دانوب العقارية' where slug = 'danube-properties';
update developers set name_ar = 'بن غاتي' where slug = 'binghatti';
update developers set name_ar = 'مراس القابضة' where slug = 'meraas-holding';
update developers set name_ar = 'دبي للعقارات' where slug = 'dubai-properties';
update developers set name_ar = 'الدار العقارية' where slug = 'aldar-properties-pjsc';
update developers set name_ar = 'نشاما' where slug = 'nshama';
update developers set name_ar = 'ديار للتطوير العقاري' where slug = 'deyaar-development';
update developers set name_ar = 'مجموعة سيليكت' where slug = 'select-group';
update developers set name_ar = 'مجموعة أمنيات' where slug = 'omniyat-group';
update developers set name_ar = 'إلينجتون العقارية' where slug = 'ellington-properties';
update developers set name_ar = 'مجموعة ميدان' where slug = 'meydan-group';
update developers set name_ar = 'مجموعة الحبتور' where slug = 'al-habtoor-group';
update developers set name_ar = 'ماجد الفطيم' where slug = 'majid-al-futtaim';
update developers set name_ar = 'دبي القابضة' where slug = 'dubai-holding';
update developers set name_ar = 'شركة الاتحاد العقارية' where slug = 'union-properties-p-j-s-c';
update developers set name_ar = 'شركة رأس الخيمة العقارية' where slug = 'rak-properties';
update developers set name_ar = 'إيغل هيلز' where slug = 'eagle-hills';
update developers set name_ar = 'مجموعة تايجر' where slug = 'tiger-group';
update developers set name_ar = 'تايجر العقارية' where slug = 'tiger-properties';
update developers set name_ar = 'وصل العقارية' where slug = 'wasl-properties';
update developers set name_ar = 'أرادة' where slug = 'arada';
update developers set name_ar = 'إكسبو سيتي دبي' where slug = 'expo-city-dubai';
update developers set name_ar = 'دبي الجنوب' where slug = 'dubai-south';
update developers set name_ar = 'ديستريكت ون' where slug = 'district-one';
update developers set name_ar = 'مركز دبي للسلع المتعددة' where slug = 'dubai-multi-commodities-centre-dmcc';
update developers set name_ar = 'هيئة مركز دبي المالي العالمي' where slug = 'difc-authority';
update developers set name_ar = 'ريبورتاج العقارية' where slug = 'reportage-real-estate';
update developers set name_ar = 'مجموعة ريفييرا' where slug = 'riviera-group';
update developers set name_ar = 'مجموعة تيكوم' where slug = 'tecom-group';
update developers set name_ar = 'الفطيم العقارية' where slug = 'al-futtaim-group-real-estate';
update developers set name_ar = 'الزوراء للتطوير' where slug = 'al-zorah-development-company';

notify pgrst, 'reload schema';
