// Internal AI Master Evaluator
// Evaluates candidate responses across all 9 required dimensions without external AI APIs

const { calculateCosineSimilarity, calculateJaccardSimilarity, stemWord, tokenize } = require('./semantic-vector');
const { evaluateRubricCoverage, extractDomainSkills } = require('./rubric-matcher');
const { analyzeCommunication, analyzeConfidence, analyzeProblemSolving, analyzeSTARMethod } = require('./communication-analyzer');
const { loadDatasets } = require('./dataset-manager');

// Evaluate a single question-answer pair
function evaluateQuestionAnswer(question, answerTranscript, jobContext = {}) {
  const text = (answerTranscript || '').trim();
  const datasets = loadDatasets();
  const weights = datasets.weights || {
    relevance: 0.20,
    technicalCompetency: 0.25,
    knowledge: 0.15,
    problemSolving: 0.15,
    communication: 0.10,
    confidence: 0.05,
    completeness: 0.05,
    roleSpecific: 0.05
  };

  // 1 & 2. Rubric and Keyword Analysis First
  const rubricResult = evaluateRubricCoverage(text, {
    requiredKeywords: question.requiredKeywords || [],
    bonusKeywords: question.bonusKeywords || [],
    coreCompetencies: question.coreCompetencies || []
  });

  // 3. Relevance Score: Semantic similarity + Rubric concept alignment
  const goldAnswer = question.goldAnswer || '';
  const questionCosine = calculateCosineSimilarity(text, question.questionText || '');
  const goldCosine = goldAnswer ? calculateCosineSimilarity(text, goldAnswer) : questionCosine;
  const jaccardSim = calculateJaccardSimilarity(text, (question.questionText + ' ' + goldAnswer));
  
  // Blended relevance metric: vector similarity scaled + rubric coverage boost
  const rawVectorSim = (goldCosine * 0.55) + (questionCosine * 0.25) + (jaccardSim * 0.20);
  let relevanceScore = Math.round(rawVectorSim * 140);
  
  // High rubric coverage validates semantic understanding
  if (rubricResult.coverageRatio >= 0.7) {
    relevanceScore += Math.round(rubricResult.coverageRatio * 25);
  } else if (rubricResult.coverageRatio < 0.25) {
    relevanceScore = Math.min(relevanceScore, 35);
  }
  relevanceScore = Math.round(Math.min(100, Math.max(10, relevanceScore)));

  // Technical Competency & Knowledge Score
  let technicalScore = rubricResult.score;
  if (rubricResult.coverageRatio >= 0.8) technicalScore = Math.max(technicalScore, 88);
  else if (rubricResult.coverageRatio >= 0.5) technicalScore = Math.max(technicalScore, 70);

  const knowledgeScore = Math.round((relevanceScore * 0.45) + (technicalScore * 0.55));

  // 4. Communication Score
  const commResult = analyzeCommunication(text);
  const communicationScore = commResult.score;

  // 5. Problem-Solving Score
  const problemResult = analyzeProblemSolving(text);
  let problemSolvingScore = problemResult.score;
  if (rubricResult.coverageRatio >= 0.7) {
    problemSolvingScore = Math.min(100, problemSolvingScore + 15);
  }

  // 6. Confidence Indicators Score
  const confResult = analyzeConfidence(text);
  const confidenceScore = confResult.score;

  // 7. Completeness & Elaboration Score
  const words = text.split(/\s+/).filter(Boolean).length;
  let completenessScore = 30;
  if (words >= 70 && words <= 350) completenessScore = 95;
  else if (words >= 40 && words < 70) completenessScore = 75;
  else if (words > 350) completenessScore = 82;
  else if (words >= 20) completenessScore = 50;

  // 8. Role-Specific Competency Score with Stem Matching
  const jobSkills = jobContext.requiredSkills || [];
  const detectedSkills = extractDomainSkills(text);
  let roleSpecificScore = 65;
  if (jobSkills.length > 0) {
    const candidateStems = new Set(tokenize(text, false));
    let matchedSkillsCount = 0;
    jobSkills.forEach(s => {
      const skillTokens = tokenize(s, false);
      const isMatched = skillTokens.some(st => candidateStems.has(st)) || text.toLowerCase().includes(s.toLowerCase());
      if (isMatched) matchedSkillsCount++;
    });
    roleSpecificScore = Math.round(Math.min(100, (matchedSkillsCount / jobSkills.length) * 85 + 15));
  } else {
    roleSpecificScore = Math.round(Math.min(100, 50 + detectedSkills.length * 12));
  }

  // 9. Behavioral STAR Framing (if Behavioral question)
  const isBehavioral = (question.category || '').toLowerCase() === 'behavioral';
  const starResult = isBehavioral ? analyzeSTARMethod(text) : null;

  // Composite Weighted Score for this Question (0 - 100)
  const compositeScore = Math.round(
    (relevanceScore * weights.relevance) +
    (technicalScore * weights.technicalCompetency) +
    (knowledgeScore * weights.knowledge) +
    (problemSolvingScore * weights.problemSolving) +
    (communicationScore * weights.communication) +
    (confidenceScore * weights.confidence) +
    (completenessScore * weights.completeness) +
    (roleSpecificScore * weights.roleSpecific)
  );

  // Generate automated constructive insights
  const strengths = [];
  const improvements = [];

  if (rubricResult.matchedKeywords.length >= 2) {
    strengths.push(`Demonstrated solid grasp of key terminology: ${rubricResult.matchedKeywords.slice(0, 3).join(', ')}.`);
  }
  if (problemResult.demonstratedTradeoffAnalysis) {
    strengths.push('Articulated architectural trade-offs and engineering rationale clearly.');
  }
  if (commResult.clarityLevel === 'Exceptional' || commResult.clarityLevel === 'Strong') {
    strengths.push(`High communication clarity (${commResult.wordCount} words, diverse vocabulary).`);
  }
  if (starResult && starResult.isSTARFramed) {
    strengths.push('Effectively structured behavioral response using the STAR method (Situation, Task, Action, Result).');
  }

  if (rubricResult.missingKeywords.length > 0) {
    improvements.push(`Could elaborate further on: ${rubricResult.missingKeywords.slice(0, 3).join(', ')}.`);
  }
  if (commResult.fillerCount > 2) {
    improvements.push(`Reduce verbal filler words (detected ${commResult.fillerCount} fillers like "${Object.keys(commResult.detectedFillers).join('", "')}").`);
  }
  if (words < 45) {
    improvements.push('Response is somewhat brief; providing more detailed practical examples would strengthen the answer.');
  }

  return {
    questionId: question.id,
    questionText: question.questionText,
    category: question.category,
    overallQuestionScore: compositeScore,
    metrics: {
      relevance: relevanceScore,
      knowledge: knowledgeScore,
      technicalCompetency: technicalScore,
      communication: communicationScore,
      problemSolving: problemSolvingScore,
      confidence: confidenceScore,
      completeness: completenessScore,
      roleSpecific: roleSpecificScore
    },
    details: {
      wordCount: commResult.wordCount,
      fillerCount: commResult.fillerCount,
      fillerRatio: commResult.fillerRatio,
      clarityLevel: commResult.clarityLevel,
      confidenceLevel: confResult.level,
      matchedKeywords: rubricResult.matchedKeywords,
      missingKeywords: rubricResult.missingKeywords,
      detectedSkills,
      starAnalysis: starResult,
      strengths,
      improvements
    }
  };
}

// Aggregate overall interview scorecard from all questions
function evaluateCompleteInterview(questionEvaluations = [], jobContext = {}) {
  const datasets = loadDatasets();
  const thresholds = datasets.thresholds || { strongHire: 85, hire: 72, borderline: 58 };

  if (!questionEvaluations.length) {
    return {
      overallScore: 0,
      recommendation: 'Incomplete',
      badgeColor: '#6b7280',
      metricsRadar: {},
      summary: 'No answers recorded'
    };
  }

  const count = questionEvaluations.length;
  const metricsSum = {
    relevance: 0,
    knowledge: 0,
    technicalCompetency: 0,
    communication: 0,
    problemSolving: 0,
    confidence: 0,
    completeness: 0,
    roleSpecific: 0
  };

  let totalScoreSum = 0;
  questionEvaluations.forEach(q => {
    totalScoreSum += q.overallQuestionScore;
    for (const key of Object.keys(metricsSum)) {
      metricsSum[key] += (q.metrics[key] || 0);
    }
  });

  const overallScore = Math.round(totalScoreSum / count);
  const metricsRadar = {};
  for (const key of Object.keys(metricsSum)) {
    metricsRadar[key] = Math.round(metricsSum[key] / count);
  }

  let recommendation = 'Reject';
  let badgeColor = '#ef4444';

  if (overallScore >= thresholds.strongHire) {
    recommendation = 'Strong Hire';
    badgeColor = '#10b981';
  } else if (overallScore >= thresholds.hire) {
    recommendation = 'Hire';
    badgeColor = '#3b82f6';
  } else if (overallScore >= thresholds.borderline) {
    recommendation = 'Borderline / Needs Human Review';
    badgeColor = '#f59e0b';
  }

  return {
    overallScore,
    recommendation,
    badgeColor,
    evaluatedAt: new Date().toISOString(),
    metricsRadar,
    questionCount: count,
    questions: questionEvaluations
  };
}

module.exports = {
  evaluateQuestionAnswer,
  evaluateCompleteInterview
};
