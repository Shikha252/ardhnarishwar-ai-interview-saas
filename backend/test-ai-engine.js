// Unit Test for Ardhnarishwar Internal AI Engine

const { evaluateQuestionAnswer, evaluateCompleteInterview } = require('./ai-engine/evaluator');
const { retrainModel } = require('./ai-engine/dataset-manager');
const db = require('./db/database');

console.log('=== TESTING INTERNAL AI ENGINE (Zero External APIs) ===');

// 1. Test Retraining Engine
console.log('\n1. Testing AI Model Retraining & Calibration...');
const retrainResult = retrainModel('Test Runner');
console.log('Retrain Status:', retrainResult.success ? 'PASSED' : 'FAILED');
console.log('Vocabulary Size Indexed:', retrainResult.vocabularySize);

// 2. Test Question Evaluation
console.log('\n2. Testing Technical Evaluation on Strong Candidate Answer...');
const q1 = db.getQuestions('GLOBAL')[0]; // Database indexing question

const strongAnswer = `In relational databases, an index is essentially a B-Tree data structure where nodes are ordered keys. This guarantees logarithmic O(log N) lookup time for both single-value equality queries and range scans. In contrast, hash indexes offer O(1) constant time lookups but cannot do range scans because hashes do not preserve sorted ordering. When adding indexes to high-write tables, we face significant write latency trade-offs because every INSERT, UPDATE, or DELETE has to write to both the table and update the B-Tree index, which incurs storage overhead and page split costs.`;

const evalStrong = evaluateQuestionAnswer(q1, strongAnswer, {
  title: 'Senior Full Stack Engineer',
  requiredSkills: ['SQL', 'Indexing', 'B-Tree']
});

console.log('Strong Answer Score:', evalStrong.overallQuestionScore, '/ 100');
console.log('Metrics Breakdown:', evalStrong.metrics);
console.log('Matched Rubric Keywords:', evalStrong.details.matchedKeywords);
console.log('Clarity Level:', evalStrong.details.clarityLevel);
console.log('Confidence Level:', evalStrong.details.confidenceLevel);
console.log('Key Strengths:', evalStrong.details.strengths);

// 3. Test Weak/Hesitant Answer
console.log('\n3. Testing Technical Evaluation on Hesitant/Weak Answer...');
const weakAnswer = `Um, well, like, indexes make queries faster I think. You just add them to the database and select is fast. But maybe it takes like some disk space and um, yeah, sort of slow on writes sometimes.`;

const evalWeak = evaluateQuestionAnswer(q1, weakAnswer, {
  title: 'Senior Full Stack Engineer',
  requiredSkills: ['SQL', 'Indexing']
});

console.log('Weak Answer Score:', evalWeak.overallQuestionScore, '/ 100');
console.log('Weak Answer Metrics:', evalWeak.metrics);
console.log('Fillers Detected:', evalWeak.details.fillerCount);
console.log('Improvements Noted:', evalWeak.details.improvements);

// 4. Test Overall Interview Aggregation
console.log('\n4. Testing Composite Interview Scorecard...');
const finalScorecard = evaluateCompleteInterview([evalStrong], {
  title: 'Senior Full Stack Engineer',
  requiredSkills: ['SQL', 'Indexing']
});

console.log('Overall Score:', finalScorecard.overallScore);
console.log('Recommendation:', finalScorecard.recommendation);
console.log('Radar Profile:', finalScorecard.metricsRadar);

if (evalStrong.overallQuestionScore > 75 && evalWeak.overallQuestionScore < 65) {
  console.log('\n>>> AI ENGINE VALIDATION SUCCESSFUL: Accurately differentiates high vs low quality responses! <<<');
} else {
  console.error('\n>>> AI ENGINE SCORE ANOMALY! <<<');
}
