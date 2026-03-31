const Score = require('../models/score.model');
const User  = require('../models/user.model');

/**
 * Generate 5 unique winning numbers using RANDOM mode
 * Pure lottery — every number 1–45 has equal chance
 */
function generateRandom() {
  const numbers = new Set();
  while (numbers.size < 5) {
    numbers.add(Math.floor(Math.random() * 45) + 1); // 1 to 45
  }
  return Array.from(numbers).sort((a, b) => a - b);
}

/**
 * Generate 5 unique winning numbers using WEIGHTED mode
 * Numbers that appear MORE in user scores have HIGHER chance of being drawn
 * This rewards players who score consistently in popular ranges
 * @param {Array} allScoreDocs - all Score documents from DB
 */
function generateWeighted(allScoreDocs) {
  // Build a frequency map: { 32: 15, 28: 9, 35: 7, ... }
  const frequency = {};
  for (let i = 1; i <= 45; i++) frequency[i] = 0; // initialise all to 0

  allScoreDocs.forEach(doc => {
    doc.scores.forEach(s => {
      if (frequency[s.points] !== undefined) {
        frequency[s.points]++;
      }
    });
  });

  // Build a weighted pool — numbers that appear more get more "tickets"
  // e.g. if 32 appeared 10 times, it gets 10 entries in the pool
  // Add 1 to every number so even zero-frequency numbers have a small chance
  const pool = [];
  for (let num = 1; num <= 45; num++) {
    const weight = frequency[num] + 1;
    for (let i = 0; i < weight; i++) {
      pool.push(num);
    }
  }

  // Pick 5 unique numbers from the weighted pool
  const picked = new Set();
  const poolCopy = [...pool];

  while (picked.size < 5 && poolCopy.length > 0) {
    const idx = Math.floor(Math.random() * poolCopy.length);
    picked.add(poolCopy[idx]);
    // Remove all entries of this number so we don't pick it twice
    poolCopy.splice(0, poolCopy.length, ...poolCopy.filter(n => n !== poolCopy[idx]));
  }

  return Array.from(picked).sort((a, b) => a - b);
}

/**
 * Match all subscribers' scores against the winning numbers
 * Returns arrays of userIds grouped by match count
 * @param {Array} winningNumbers - the 5 drawn numbers
 * @param {Array} allScoreDocs   - Score documents for all subscribers
 */
function matchSubscribers(winningNumbers, allScoreDocs) {
  const winningSet = new Set(winningNumbers);

  const fiveMatch  = [];
  const fourMatch  = [];
  const threeMatch = [];

  allScoreDocs.forEach(doc => {
    // Get unique score values for this user (set removes duplicates)
    const userScores = new Set(doc.scores.map(s => s.points));

    // Count how many of their scores appear in the winning numbers
    const matched = [...userScores].filter(p => winningSet.has(p));
    const matchedNumbers = matched;

    if (matched.length >= 5) {
      fiveMatch.push({ userId: doc.userId, matchedNumbers });
    } else if (matched.length === 4) {
      fourMatch.push({ userId: doc.userId, matchedNumbers });
    } else if (matched.length === 3) {
      threeMatch.push({ userId: doc.userId, matchedNumbers });
    }
  });

  return { fiveMatch, fourMatch, threeMatch };
}

/**
 * Main draw runner — called by the route
 * @param {String} mode       - 'random' or 'weighted'
 * @param {Array}  scoreDocs  - all Score documents
 */
async function runDraw(mode, scoreDocs) {
  const winningNumbers = mode === 'weighted'
    ? generateWeighted(scoreDocs)
    : generateRandom();

  const matches = matchSubscribers(winningNumbers, scoreDocs);

  return { winningNumbers, matches };
}

module.exports = { runDraw };