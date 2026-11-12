export const locales = ["en", "bn"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";
export const isLocale = (v: string): v is Locale => (locales as readonly string[]).includes(v);

// Interface labels only. Institutional content (courses, teachers, text) comes from Firestore via the Admin Dashboard.
export const ui = {
  en: {
    name: "IQRA CAMPUS",
    tagline: "Connect with Quran & Sunnah",
    nav: { home: "Home", about: "About Us", courses: "Courses", teachers: "Teachers", pricing: "Pricing", reviews: "Reviews", blog: "Blog", contact: "Contact" },
    login: "Login",
    trial: "Free Trial Class",
    explore: "Explore Courses",
    heroEyebrow: "Online Quran & Arabic Education",
    heroTitle: "Learn the Quran with care, clarity and connection",
    heroText: "IQRA CAMPUS is an international online Quran and Arabic institute.",
    emptyTitle: "This section is being prepared",
    emptyText: "Content will appear here once it has been published by the administrator.",
    contactTitle: "Contact us",
    email: "Email", phone: "Phone", whatsapp: "WhatsApp", instagram: "Instagram", facebook: "Facebook",
    menu: "Menu", rights: "All rights reserved.",
    langName: "বাংলা", langHref: "bn",
  },
  bn: {
    name: "ইকরা ক্যাম্পাস",
    tagline: "কুরআন ও সুন্নাহর সাথে সংযুক্ত হোন",
    nav: { home: "হোম", about: "আমাদের সম্পর্কে", courses: "কোর্সসমূহ", teachers: "শিক্ষকগণ", pricing: "মূল্য", reviews: "রিভিউ", blog: "ব্লগ", contact: "যোগাযোগ" },
    login: "লগইন",
    trial: "ফ্রি ট্রায়াল ক্লাস",
    explore: "কোর্স দেখুন",
    heroEyebrow: "অনলাইন কুরআন ও আরবি শিক্ষা",
    heroTitle: "যত্ন, স্পষ্টতা ও সংযোগের সাথে কুরআন শিখুন",
    heroText: "ইকরা ক্যাম্পাস একটি আন্তর্জাতিক অনলাইন কুরআন ও আরবি শিক্ষা প্রতিষ্ঠান।",
    emptyTitle: "এই অংশটি প্রস্তুত করা হচ্ছে",
    emptyText: "অ্যাডমিন প্রকাশ করার পর এখানে তথ্য দেখা যাবে।",
    contactTitle: "যোগাযোগ করুন",
    email: "ইমেইল", phone: "ফোন", whatsapp: "হোয়াটসঅ্যাপ", instagram: "ইনস্টাগ্রাম", facebook: "ফেসবুক",
    menu: "মেনু", rights: "সর্বস্বত্ব সংরক্ষিত।",
    langName: "English", langHref: "en",
  },
} as const;
