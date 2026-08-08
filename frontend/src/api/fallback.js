export const FALLBACK_CONTENT = {
  home: {
    eyebrow: "LAHORE, PK",
    headline_line1: "Computer",
    headline_line2: "Engineer",
    headline_accent: "",
    subheadline: "",
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
