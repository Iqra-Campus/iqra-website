// Starter courses. They show on the site until the owner publishes courses in the Admin Dashboard,
// and the "Add the starter courses" button in Admin > Courses copies them into the database for editing.
type Bi = { en: string; bn: string };
export type CourseData = {
  title: Bi; tag: Bi; description: Bi; audience: Bi; topics: Bi; outcomes: Bi;
  format?: Bi; groupType?: Bi; schedule?: Bi; price?: Bi; faqText?: Bi;
  teacherIds: string[]; order: number; slug: string; status: "published";
};

export const starterCourses: { id: string; data: CourseData }[] = [
  {
    id: "kids-quran-foundation",
    data: {
      slug: "kids-quran-foundation", order: 1, status: "published", teacherIds: [],
      title: { en: "Kids Quran Foundation", bn: "কিডস কুরআন ফাউন্ডেশন" },
      tag: { en: "Ages 4–12", bn: "বয়স ৪–১২" },
      description: {
        en: "For children aged 4 to 12: Noorani Qaida, Arabic letters, makharij, basic Tajweed, short surahs and essential duas.",
        bn: "৪ থেকে ১২ বছর বয়সী শিশুদের জন্য: নূরানি কায়দা, আরবি হরফ, মাখরাজ, প্রাথমিক তাজবিদ, ছোট সূরা ও প্রয়োজনীয় দোয়া।",
      },
      audience: { en: "Children aged 4 to 12 who are starting to read the Quran.", bn: "৪ থেকে ১২ বছর বয়সী শিশু, যারা কুরআন পড়া শুরু করছে।" },
      topics: {
        en: "Noorani Qaida\nArabic letters (huroof)\nMakharij (points of articulation)\nBasic Tajweed\nShort surahs\nEssential duas",
        bn: "নূরানি কায়দা\nআরবি হরফ\nমাখরাজ\nপ্রাথমিক তাজবিদ\nছোট সূরা\nপ্রয়োজনীয় দোয়া",
      },
      outcomes: {
        en: "A strong foundation for reading the Quran\nCorrect pronunciation of Arabic letters\nShort surahs and essential duas learned",
        bn: "কুরআন পড়ার মজবুত ভিত্তি\nআরবি হরফের শুদ্ধ উচ্চারণ\nছোট সূরা ও প্রয়োজনীয় দোয়া শেখা",
      },
    },
  },
  {
    id: "adult-tajweed-correction",
    data: {
      slug: "adult-tajweed-correction", order: 2, status: "published", teacherIds: [],
      title: { en: "Adult Tajweed & Correction", bn: "অ্যাডাল্ট তাজবিদ ও সংশোধন" },
      tag: { en: "For adults", bn: "বড়দের জন্য" },
      description: {
        en: "For adults: reading the Quran correctly, makharij, Tajweed and correction of recitation mistakes.",
        bn: "বড়দের জন্য: কুরআন শুদ্ধ করে পড়া, মাখরাজ, তাজবিদ এবং তিলাওয়াতের ভুল সংশোধন।",
      },
      audience: { en: "Adults who want to read the Quran correctly and fix mistakes in their recitation.", bn: "বড়রা, যাঁরা কুরআন শুদ্ধ করে পড়তে এবং তিলাওয়াতের ভুল সংশোধন করতে চান।" },
      topics: {
        en: "Reading the Quran correctly\nMakharij (points of articulation)\nTajweed rules\nCorrecting recitation mistakes",
        bn: "কুরআন শুদ্ধ করে পড়া\nমাখরাজ\nতাজবিদের নিয়ম\nতিলাওয়াতের ভুল সংশোধন",
      },
      outcomes: {
        en: "More accurate and confident recitation\nRecitation mistakes identified and corrected",
        bn: "আরও শুদ্ধ ও আত্মবিশ্বাসী তিলাওয়াত\nতিলাওয়াতের ভুল চিহ্নিত ও সংশোধন",
      },
    },
  },
  {
    id: "hifz-program",
    data: {
      slug: "hifz-program", order: 3, status: "published", teacherIds: [],
      title: { en: "Hifz Program", bn: "হিফজ প্রোগ্রাম" },
      tag: { en: "Hifz", bn: "হিফজ" },
      description: {
        en: "For those who want to memorise the Quran: Hifz, regular revision, reciting the lesson to the teacher, and progress monitoring.",
        bn: "যাঁরা কুরআন মুখস্থ করতে চান: হিফজ, নিয়মিত পুনরাবৃত্তি, সবক শোনানো এবং অগ্রগতি পর্যবেক্ষণ।",
      },
      audience: { en: "Anyone who wants to memorise the Quran.", bn: "যে কেউ কুরআন মুখস্থ করতে চান।" },
      topics: {
        en: "Hifz (memorisation)\nRegular revision (muraja'ah)\nReciting the lesson to the teacher (sabaq)\nProgress monitoring",
        bn: "হিফজ (মুখস্থ)\nনিয়মিত পুনরাবৃত্তি\nসবক শোনানো\nঅগ্রগতি পর্যবেক্ষণ",
      },
      outcomes: {
        en: "Steady memorisation with regular revision\nA clear view of progress",
        bn: "নিয়মিত পুনরাবৃত্তিসহ ধারাবাহিক মুখস্থ\nঅগ্রগতির স্পষ্ট চিত্র",
      },
    },
  },
  {
    id: "arabic-language-quran-understanding",
    data: {
      slug: "arabic-language-quran-understanding", order: 4, status: "published", teacherIds: [],
      title: { en: "Arabic Language & Quran Understanding", bn: "আরবি ভাষা ও কুরআন বোঝা" },
      tag: { en: "Arabic", bn: "আরবি" },
      description: {
        en: "Basic Arabic, vocabulary, grammar and the language skills needed to understand the meaning of the Quran.",
        bn: "আরবি ভাষার প্রাথমিক শিক্ষা, শব্দভান্ডার, ব্যাকরণ এবং কুরআনের অর্থ বোঝার জন্য প্রয়োজনীয় ভাষাগত দক্ষতা।",
      },
      audience: { en: "Learners who want to learn Arabic and understand the meaning of the Quran.", bn: "যাঁরা আরবি শিখতে এবং কুরআনের অর্থ বুঝতে চান।" },
      topics: {
        en: "Basic Arabic\nVocabulary\nGrammar\nLanguage skills for understanding the Quran's meaning",
        bn: "আরবি ভাষার প্রাথমিক শিক্ষা\nশব্দভান্ডার\nব্যাকরণ\nকুরআনের অর্থ বোঝার ভাষাগত দক্ষতা",
      },
      outcomes: {
        en: "Arabic basics built step by step\nA better understanding of the Quran's words and meaning",
        bn: "ধাপে ধাপে আরবির ভিত্তি তৈরি\nকুরআনের শব্দ ও অর্থ আরও ভালো বোঝা",
      },
    },
  },
];

export const courseDocs = () => starterCourses.map((c) => ({ id: c.id, ...c.data })) as unknown as (CourseData & { id: string })[];
