// Portion of each subscription that goes into the prize pool
// Adjust this based on your business model
const PRIZE_POOL_PERCENTAGE = 0.50; // 50% of each subscription fee

// Plan prices in rupees
const PLAN_PRICES = {
  monthly: 499,
  yearly:  4999 / 12, // monthly equivalent
};

// Prize split percentages from PRD
const SPLITS = {
  jackpot:    0.40, // 5-match
  fourMatch:  0.35, // 4-match
  threeMatch: 0.25, // 3-match
};

/**
 * Calculate the prize pool for a draw
 * @param {Array} subscribers - array of user objects with subscription.plan
 * @param {Number} rollover   - jackpot carried from last month (0 if none)
 */
function calculatePrizePool(subscribers, rollover = 0) {
  // Add up contributions from each active subscriber
  const total = subscribers.reduce((sum, user) => {
    const planPrice = PLAN_PRICES[user.subscription.plan] || PLAN_PRICES.monthly;
    return sum + planPrice * PRIZE_POOL_PERCENTAGE;
  }, 0);

  const jackpotBase = Math.floor(total * SPLITS.jackpot);

  return {
    total:      Math.floor(total),
    jackpot:    jackpotBase + rollover, // jackpot includes any previous rollover
    fourMatch:  Math.floor(total * SPLITS.fourMatch),
    threeMatch: Math.floor(total * SPLITS.threeMatch),
    rollover,
  };
}

/**
 * Split a prize tier equally among multiple winners
 * @param {Number} poolAmount - total prize for this tier
 * @param {Number} winnerCount - how many users matched
 */
function splitPrize(poolAmount, winnerCount) {
  if (winnerCount === 0) return 0;
  return Math.floor(poolAmount / winnerCount);
}

module.exports = { calculatePrizePool, splitPrize };