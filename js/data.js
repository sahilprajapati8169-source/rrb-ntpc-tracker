/* ============================
   DATA.JS — RRB NTPC Syllabus
   ============================ */

const SYLLABUS_DATA = {
  "Maths": [
    { id: "number-system",   name: "Number System" },
    { id: "lcm-hcf",         name: "LCM & HCF" },
    { id: "percentage",      name: "Percentage" },
    { id: "ratio-proportion", name: "Ratio & Proportion" },
    { id: "profit-loss",     name: "Profit & Loss" },
    { id: "si-ci",           name: "SI & CI" },
    { id: "time-work",       name: "Time & Work" },
    { id: "time-speed",      name: "Time, Speed & Distance" },
    { id: "average",         name: "Average" },
    { id: "algebra",         name: "Algebra" },
    { id: "geometry",        name: "Geometry" },
    { id: "mensuration",     name: "Mensuration" },
    { id: "trigonometry",    name: "Trigonometry" },
    { id: "statistics",      name: "Statistics" }
  ],

  "Reasoning": [
    { id: "analogy",         name: "Analogy" },
    { id: "classification",  name: "Classification" },
    { id: "coding-decoding", name: "Coding-Decoding" },
    { id: "series",          name: "Series" },
    { id: "syllogism",       name: "Syllogism" },
    { id: "blood-relation",  name: "Blood Relation" },
    { id: "direction",       name: "Direction" },
    { id: "venn-diagram",    name: "Venn Diagram" },
    { id: "puzzle",          name: "Puzzle" },
    { id: "statement",       name: "Statement & Conclusion" },
    { id: "math-operations", name: "Mathematical Operations" }
  ],

  "General Awareness": [
    { id: "history",         name: "History" },
    { id: "geography",       name: "Geography" },
    { id: "polity",          name: "Polity" },
    { id: "economics",       name: "Economics" },
    { id: "general-science", name: "General Science" },
    { id: "current-affairs", name: "Current Affairs" },
    { id: "static-gk",       name: "Static GK" }
  ]
};

// ---------- HELPER ----------
function getAllTopicsFromData() {
  const all = [];
  Object.keys(SYLLABUS_DATA).forEach(subject => {
    SYLLABUS_DATA[subject].forEach(topic => {
      all.push({
        id: topic.id,
        subject: subject,
        name: topic.name,
        status: 'not_started',
        confidence: 0,
        studyTime: 0,
        lastStudied: null,
        revisions: [],
        questions: { attempted: 0, correct: 0 },
        notes: []
      });
    });
  });
  return all;
}

// ---------- INIT SYLLABUS (first time only) ----------
function seedSyllabus() {
  const existing = getTopics();
  if (existing.length === 0) {
    const allTopics = getAllTopicsFromData();
    saveAllTopics(allTopics);
    console.log('✅ Syllabus seeded:', allTopics.length, 'topics');
  }
}

// Auto-seed on load (agar topics khaali hain)
document.addEventListener('DOMContentLoaded', () => {
  if (typeof getTopics === 'function') {
    seedSyllabus();
  }
});