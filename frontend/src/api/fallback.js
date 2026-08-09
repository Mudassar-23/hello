export const FALLBACK_CONTENT = {
  home: {
    eyebrow: "LAHORE, PK",
    headline_line1: "Computer",
    headline_line2: "Engineer",
    headline_accent: "",
    subheadline:
      "I build the layer where hardware & Software meets decision-making — embedded C++ on real sensors, AI Software Development and machine learning that ships inside an actual product, not just a notebook.",
    cta_primary: "View projects",
    cta_secondary: "Get in touch",
    meta_repos: "GitHub",
    meta_focus: "Software Development · Edge AI · IoT",
    meta_location: "Pakistan",
    name: "Mudassar Hussain",
    brand: "MUDASSAR.HUSSAIN",
  },
  about: {
    eyebrow: "About",
    
    paragraphs: [
      "I'm a Computer Engineering enthusiast with hands-on experience across software development, machine learning, and IoT systems. Most of my work lives at the intersection of the two worlds I like best: code that runs on real hardware, and models that make that hardware smarter.",
      "My projects range from IoT-based environmental monitoring to machine-learning-powered web apps, usually combining AI with embedded systems to solve a concrete, physical problem rather than a purely digital one.",
      "Right now I'm going deeper into Edge AI, automation, and intelligent systems — and looking for opportunities to put that knowledge into something people actually use.",
    ],
  },
  contact: {
    title: "Let's connect two boards.",
    email: "infonxhussain@gmail.com",
    github: "https://github.com/Mudassar-23",
    linkedin: "https://www.linkedin.com/in/mudassar-hussain-8952102a0/",
    handle: "Mudassar-23",
    linkedin_label: "in/mudassar-hussain-8952102a0",
  },
};

export const FALLBACK_SKILLS = [
  "C++",
  "Python",
  "Arduino",
  "OpenCV",
  "MATLAB",
  "Linux",
  "Proteus",
  "MySQL",
  "Visual Studio",
].map((name, i) => ({ id: i + 1, name, sort_order: i }));

export const FALLBACK_PROJECTS = [
  {
    id: 1,
    ref: "IC1",
    tag: "ML · WEB",
    name: "House Price Prediction App",
    lang: "JavaScript",
    stars: 1,
    description:
      "A web app that estimates property prices from listing features, pairing a trained regression model with a clean, interactive front end.",
    github_url: "https://github.com/Mudassar-23/House-Price-Prediction-App",
    live_url: "",
    image_url: "",
    caption: "",
  },
];

export const FALLBACK_EXPERIENCE = [
  {
    id: 1,
    title: "Computer Engineering Student",
    company: "University",
    start_date: "2022",
    end_date: "Present",
    description:
      "Building projects across embedded systems, computer vision, and machine learning — from breadboard prototypes to shipped web apps.",
    sort_order: 0,
  },
];
