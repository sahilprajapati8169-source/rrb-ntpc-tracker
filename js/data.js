/* ============================
   DATA.JS — RRB NTPC Complete Syllabus
   ============================ */

const SYLLABUS_DATA = {
  "Mathematics": [
    {
      id: "basic-arithmetic",
      name: "Basic Arithmetic & Number Systems",
      topics: [
        { id: "number-system", name: "Number System & Types of Numbers" },
        { id: "decimals-fractions", name: "Decimals & Fractions" },
        { id: "simplification", name: "Simplification & BODMAS Rule" },
        { id: "hcf-lcm", name: "HCF & LCM" },
        { id: "integers-divisibility", name: "Integers & Divisibility Rules" }
      ]
    },
    {
      id: "commercial-maths",
      name: "Commercial Mathematics",
      topics: [
        { id: "percentage", name: "Percentage Calculations" },
        { id: "ratio-proportion", name: "Ratio & Proportion" },
        { id: "profit-loss", name: "Profit, Loss & Discount" },
        { id: "si", name: "Simple Interest (SI)" },
        { id: "ci", name: "Compound Interest (CI)" },
        { id: "partnership", name: "Partnership & Profit Sharing" },
        { id: "mixture-alligation", name: "Mixture & Alligation" },
        { id: "average", name: "Averages" }
      ]
    },
    {
      id: "time-motion",
      name: "Time & Motion",
      topics: [
        { id: "time-work", name: "Time & Work" },
        { id: "pipes-cisterns", name: "Pipes & Cisterns" },
        { id: "speed-time-distance", name: "Speed, Time & Distance" },
        { id: "trains", name: "Problems on Trains" },
        { id: "boats-streams", name: "Boats & Streams" }
      ]
    },
    {
      id: "geometry-mensuration-algebra",
      name: "Geometry, Mensuration & Algebra",
      topics: [
        { id: "mensuration-2d", name: "2D Mensuration (Area & Perimeter)" },
        { id: "mensuration-3d", name: "3D Mensuration (Volume & Surface Area)" },
        { id: "lines-angles-triangles", name: "Lines, Angles & Triangles" },
        { id: "circles-polygons", name: "Circles & Polygons" },
        { id: "algebra-basics", name: "Basic Algebraic Expressions & Formulas" },
        { id: "linear-equations", name: "Linear Equations & Polynomials" }
      ]
    },
    {
      id: "trigonometry-statistics",
      name: "Trigonometry & Statistics",
      topics: [
        { id: "trig-ratios", name: "Trigonometric Ratios & Standard Angles" },
        { id: "trig-identities", name: "Trigonometric Identities" },
        { id: "heights-distances", name: "Heights & Distances" },
        { id: "statistics", name: "Elementary Statistics (Mean, Median, Mode, SD)" },
        { id: "data-interpretation", name: "Data Interpretation (Graphs, Charts, Tables)" }
      ]
    }
  ],

  "Reasoning": [
    {
      id: "verbal-reasoning",
      name: "Verbal Reasoning",
      topics: [
        { id: "number-series", name: "Number Series" },
        { id: "alphabetical-series", name: "Alphabetical & Mixed Series" },
        { id: "coding-decoding", name: "Coding & Decoding" },
        { id: "analogy", name: "Analogies (Word, Number, Symbol)" },
        { id: "blood-relation", name: "Blood Relations & Family Tree" },
        { id: "direction-sense", name: "Direction Sense Test & Distance" }
      ]
    },
    {
      id: "analytical-reasoning",
      name: "Analytical & Logical Reasoning",
      topics: [
        { id: "syllogism", name: "Syllogisms" },
        { id: "venn-diagram", name: "Venn Diagrams" },
        { id: "statement-assumptions", name: "Statement & Assumptions" },
        { id: "statement-conclusions", name: "Statement & Conclusions" },
        { id: "courses-of-action", name: "Statement & Courses of Action" },
        { id: "cause-effect", name: "Cause & Effect" }
      ]
    },
    {
      id: "puzzles-arrangements",
      name: "Puzzles & Arrangements",
      topics: [
        { id: "linear-seating", name: "Linear Seating Arrangement" },
        { id: "circular-seating", name: "Circular Seating Arrangement" },
        { id: "floor-box-puzzle", name: "Floor & Box Puzzles" },
        { id: "ranking-order", name: "Ranking & Order Test" },
        { id: "data-sufficiency", name: "Data Sufficiency" }
      ]
    },
    {
      id: "non-verbal-operations",
      name: "Non-Verbal & Operations",
      topics: [
        { id: "math-operations", name: "Mathematical Operations & Symbol Substitution" },
        { id: "inequalities", name: "Inequalities" },
        { id: "jumbling", name: "Jumbling (Word & Sentence)" },
        { id: "classification", name: "Similarities & Differences (Odd One Out)" },
        { id: "map-reading", name: "Map Reading & Chart Interpretation" }
      ]
    }
  ],

  "General Awareness": [
    {
      id: "general-science",
      name: "General Science (CBSE 9th-10th Level)",
      topics: [
        { id: "physics", name: "Physics (Mechanics, Light, Electricity, Heat, Sound, Work & Energy)" },
        { id: "chemistry", name: "Chemistry (Periodic Table, Acids, Bases, Metals, Chemical Reactions)" },
        { id: "biology", name: "Biology (Human Anatomy, Diseases, Nutrition, Genetics, Plant Physiology)" }
      ]
    },
    {
      id: "gk-social-studies",
      name: "General Knowledge & Social Studies",
      topics: [
        { id: "ancient-history", name: "Ancient Indian History" },
        { id: "medieval-history", name: "Medieval Indian History" },
        { id: "modern-history", name: "Modern Indian History & Freedom Struggle" },
        { id: "indian-geography", name: "Indian Geography (Physical, Social, Economic)" },
        { id: "world-geography", name: "World Geography" },
        { id: "polity", name: "Indian Polity & Constitution" },
        { id: "economy", name: "Indian Economy (Budget, Inflation, Banking, GDP)" }
      ]
    },
    {
      id: "science-tech-environment",
      name: "Science, Technology & Environment",
      topics: [
        { id: "isro", name: "Indian Space Programs (ISRO Missions)" },
        { id: "nuclear-defense", name: "Nuclear & Defense Technology (DRDO, BARC)" },
        { id: "environment", name: "Environmental Issues & Climate Change" },
        { id: "computer-basics", name: "Computer Fundamentals & Internet Basics" },
        { id: "computer-abbreviations", name: "Common Computer Abbreviations" }
      ]
    },
    {
      id: "current-affairs-static-gk",
      name: "Current Affairs & Static GK",
      topics: [
        { id: "current-events", name: "National & International Current Events" },
        { id: "sports", name: "Sports & Games (Tournaments, Awards, Trophies)" },
        { id: "art-culture", name: "Indian Art, Culture & Literature" },
        { id: "monuments", name: "Monuments & Historic Places in India" },
        { id: "international-orgs", name: "Important International Organizations" },
        { id: "indian-railways", name: "Indian Railways & Transport System" }
      ]
    }
  ]
};

// ---------- HELPER: Flatten all topics ----------
function getAllTopicsFromData() {
  const all = [];
  Object.keys(SYLLABUS_DATA).forEach(subject => {
    SYLLABUS_DATA[subject].forEach(section => {
      section.topics.forEach(topic => {
        all.push({
          id: topic.id,
          subject: subject,
          section: section.name,
          sectionId: section.id,
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
  });
  return all;
}

// ---------- HELPER: Get total topic count ----------
function getTotalTopicCount() {
  return getAllTopicsFromData().length;
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

// Auto-seed on load
document.addEventListener('DOMContentLoaded', () => {
  if (typeof getTopics === 'function') {
    seedSyllabus();
  }
});