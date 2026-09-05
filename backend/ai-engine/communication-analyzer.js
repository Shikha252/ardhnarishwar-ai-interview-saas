// Internal Communication & Behavioral Analyzer
// Evaluates Communication, Fluency, Confidence Indicators, STAR framing, and Problem Solving

const FILLER_WORDS = [
  'um', 'uh', 'er', 'ah', 'like', 'you know', 'basically', 'actually',
  'sort of', 'kind of', 'i mean', 'honestly', 'literally', 'so yeah'
];

const PROBLEM_SOLVING_MARKERS = [
  'because', 'due to', 'trade-off', 'tradeoff', 'trade offs', 'optimized',
  'alternative', 'root cause', 'analysis', 'hypothesis', 'bottleneck',
  'edge case', 'time complexity', 'space complexity', 'scalability',
  'break down', 'step 1', 'firstly', 'secondly', 'finally', 'benchmark',
  'measured', 'monitored', 'investigated', 'mitigated'
];

const STAR_MARKERS = {
  situation: [
    'at my previous', 'in my last role', 'the context was', 'the problem was',
    'our team was', 'we had an issue', 'when i worked on', 'the situation was'
  ],
  task: [
    'my goal was', 'my responsibility was', 'i was tasked with', 'the objective was',
    'we needed to', 'i was responsible for', 'the requirement was'
  ],
  action: [
    'i implemented', 'i designed', 'i developed', 'i initiated', 'i coordinated',
    'i refactored', 'i solved', 'i proposed', 'i stepped in', 'i migrated', 'i debugged'
  ],
  result: [
    'as a result', 'the outcome was', 'increased by', 'decreased by', 'improved',
    'reduced', 'delivered on time', 'impact was', 'successfully', 'saved', 'achieved'
  ]
};

// Analyze Communication & Fluency
function analyzeCommunication(text) {
  if (!text || typeof text !== 'string') {
    return {
      score: 0,
      wordCount: 0,
      lexicalDiversity: 0,
      fillerCount: 0,
      fillerRatio: 0,
      clarityLevel: 'Poor'
    };
  }

  const words = text.toLowerCase().match(/\b[a-z0-9'-]+\b/g) || [];
  const wordCount = words.length;

  if (wordCount === 0) {
    return { score: 0, wordCount: 0, lexicalDiversity: 0, fillerCount: 0, fillerRatio: 0, clarityLevel: 'Empty' };
  }

  // Calculate Lexical Diversity (Type-Token Ratio)
  const uniqueWords = new Set(words);
  const lexicalDiversity = uniqueWords.size / wordCount;

  // Filler word detection
  const lowerText = text.toLowerCase();
  let fillerCount = 0;
  const detectedFillers = {};

  for (const filler of FILLER_WORDS) {
    const regex = new RegExp(`\\b${filler}\\b`, 'g');
    const matches = lowerText.match(regex);
    if (matches) {
      fillerCount += matches.length;
      detectedFillers[filler] = matches.length;
    }
  }

  const fillerRatio = fillerCount / wordCount;

  // Base Communication Score Calculation (0 - 100)
  // Penalize excessive fillers, reward good length & vocabulary variety
  let score = 75; // baseline

  // Length modifier (ideal length: 60 - 300 words)
  if (wordCount >= 60 && wordCount <= 350) {
    score += 15;
  } else if (wordCount < 30) {
    score -= 30;
  } else if (wordCount < 60) {
    score -= 10;
  }

  // Lexical variety modifier
  if (lexicalDiversity > 0.55) {
    score += 10;
  } else if (lexicalDiversity < 0.35) {
    score -= 15;
  }

  // Filler penalty: > 5% filler words drops score
  if (fillerRatio > 0.08) {
    score -= 25;
  } else if (fillerRatio > 0.04) {
    score -= 12;
  } else {
    score += 5; // clean speech
  }

  score = Math.round(Math.min(100, Math.max(10, score)));

  let clarityLevel = 'Satisfactory';
  if (score >= 85) clarityLevel = 'Exceptional';
  else if (score >= 70) clarityLevel = 'Strong';
  else if (score >= 50) clarityLevel = 'Moderate';
  else clarityLevel = 'Needs Improvement';

  return {
    score,
    wordCount,
    lexicalDiversity: Number(lexicalDiversity.toFixed(2)),
    fillerCount,
    fillerRatio: Number(fillerRatio.toFixed(3)),
    detectedFillers,
    clarityLevel
  };
}

// Analyze Confidence Indicators
function analyzeConfidence(text, speechPaceWpm = 135) {
  if (!text) return { score: 0, level: 'Low' };

  const comm = analyzeCommunication(text);
  let confidenceScore = 80;

  // Filler impact on confidence
  if (comm.fillerRatio > 0.07) confidenceScore -= 30;
  else if (comm.fillerRatio > 0.035) confidenceScore -= 15;
  else confidenceScore += 10;

  // Assertiveness phrasing
  const assertivePhrases = ['i led', 'i decided', 'i resolved', 'confidently', 'clearly', 'specifically', 'definitely', 'in my experience'];
  const hesitantPhrases = ['maybe', 'i guess', 'not sure', 'i think probably', 'sort of like', 'i dont really know', 'hopefully'];

  const lowerText = text.toLowerCase();
  let assertiveMatches = 0;
  let hesitantMatches = 0;

  assertivePhrases.forEach(p => { if (lowerText.includes(p)) assertiveMatches++; });
  hesitantPhrases.forEach(p => { if (lowerText.includes(p)) hesitantMatches++; });

  confidenceScore += (assertiveMatches * 4);
  confidenceScore -= (hesitantMatches * 8);

  confidenceScore = Math.round(Math.min(100, Math.max(15, confidenceScore)));

  let level = 'High';
  if (confidenceScore >= 80) level = 'Very High';
  else if (confidenceScore >= 65) level = 'Moderate-High';
  else if (confidenceScore >= 50) level = 'Average';
  else level = 'Low / Hesitant';

  return {
    score: confidenceScore,
    level,
    assertiveMarkers: assertiveMatches,
    hesitantMarkers: hesitantMatches
  };
}

// Analyze Problem-Solving structure
function analyzeProblemSolving(text) {
  if (!text) return { score: 0, markersDetected: [] };

  const lowerText = text.toLowerCase();
  const detected = [];

  for (const marker of PROBLEM_SOLVING_MARKERS) {
    if (lowerText.includes(marker)) {
      detected.push(marker);
    }
  }

  // Base score on density of structured reasoning markers
  let score = 40;
  score += Math.min(50, detected.length * 8);

  // Bonus if mentions trade-offs and complexity
  if (lowerText.includes('trade-off') || lowerText.includes('tradeoff')) score += 8;
  if (lowerText.includes('complexity') || lowerText.includes('bottleneck')) score += 8;

  score = Math.round(Math.min(100, Math.max(20, score)));

  return {
    score,
    markersDetected: detected,
    demonstratedTradeoffAnalysis: lowerText.includes('trade-off') || lowerText.includes('tradeoff'),
    demonstratedRootCauseReasoning: lowerText.includes('root cause') || lowerText.includes('because')
  };
}

// Detect STAR behavioral method framing
function analyzeSTARMethod(text) {
  if (!text) return { isSTARFramed: false, score: 0, componentsFound: {} };

  const lowerText = text.toLowerCase();
  const components = {
    situation: false,
    task: false,
    action: false,
    result: false
  };

  for (const key of Object.keys(STAR_MARKERS)) {
    for (const phrase of STAR_MARKERS[key]) {
      if (lowerText.includes(phrase)) {
        components[key] = true;
        break;
      }
    }
  }

  const foundCount = Object.values(components).filter(Boolean).length;
  const score = Math.round((foundCount / 4) * 100);

  return {
    isSTARFramed: foundCount >= 3,
    score,
    componentsFound: components,
    structureRatio: foundCount / 4
  };
}

module.exports = {
  analyzeCommunication,
  analyzeConfidence,
  analyzeProblemSolving,
  analyzeSTARMethod
};
