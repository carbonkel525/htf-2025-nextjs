/**
 * Calculate CP score based on catch attempts
 * Maximum score is 1000
 * Score decreases with more attempts:
 * - 1 attempt: 1000 CP
 * - 2 attempts: 800 CP
 * - 3 attempts: 600 CP
 * - 4 attempts: 400 CP
 * - 5+ attempts: 200 CP (minimum)
 */
export function calculateCPScore(attempts: number): number {
  if (attempts <= 0) {
    return 0;
  }

  if (attempts === 1) {
    return 1000; // Perfect catch!
  }

  if (attempts === 2) {
    return 800; // Great catch
  }

  if (attempts === 3) {
    return 600; // Good catch
  }

  if (attempts === 4) {
    return 400; // Decent catch
  }

  // 5 or more attempts
  return Math.max(200, 1000 - (attempts - 1) * 150); // Minimum 200 CP
}

/**
 * Get CP score tier/rating based on score
 */
export function getCPTier(score: number): {
  tier: string;
  color: string;
  description: string;
} {
  if (score >= 900) {
    return {
      tier: "LEGENDARY",
      color: "text-danger-red",
      description: "Perfect catch!",
    };
  }
  if (score >= 700) {
    return {
      tier: "EXCELLENT",
      color: "text-warning-amber",
      description: "Great catch!",
    };
  }
  if (score >= 500) {
    return {
      tier: "GOOD",
      color: "text-sonar-green",
      description: "Good catch",
    };
  }
  if (score >= 300) {
    return {
      tier: "FAIR",
      color: "text-text-secondary",
      description: "Decent catch",
    };
  }
  return {
    tier: "POOR",
    color: "text-text-secondary",
    description: "Needs improvement",
  };
}

