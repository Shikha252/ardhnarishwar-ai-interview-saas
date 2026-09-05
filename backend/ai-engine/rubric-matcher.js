// Internal Rubric & Skill Ontology Matcher
// Evaluates Knowledge, Technical Competency, and Concept Depth

const TECHNICAL_SKILL_ONTOLOGY = {
  'backend': [
    'rest', 'api', 'graphql', 'grpc', 'microservices', 'monolith', 'database', 'sql', 'nosql',
    'postgres', 'mysql', 'mongodb', 'redis', 'caching', 'indexing', 'acid', 'transactions',
    'concurrency', 'multithreading', 'async', 'event loop', 'node', 'express', 'django',
    'flask', 'spring boot', 'kafka', 'rabbitmq', 'pubsub', 'docker', 'kubernetes', 'jwt',
    'oauth', 'rate limiting', 'load balancer', 'horizontal scaling', 'sharding', 'replication'
  ],
  'frontend': [
    'react', 'vue', 'angular', 'javascript', 'typescript', 'html5', 'css3', 'dom', 'virtual dom',
    'state management', 'redux', 'context api', 'hooks', 'lifecycle', 'responsive design',
    'flexbox', 'grid', 'web vitals', 'seo', 'accessibility', 'a11y', 'bundle size', 'vite',
    'webpack', 'ssr', 'nextjs', 'hydration', 'debounce', 'throttle', 'cors', 'security', 'xss', 'csrf'
  ],
  'devops_cloud': [
    'aws', 'azure', 'gcp', 'ci/cd', 'github actions', 'jenkins', 'terraform', 'ansible',
    'infrastructure as code', 'iac', 'docker', 'containers', 'kubernetes', 'k8s', 'helm',
    'monitoring', 'prometheus', 'grafana', 'logging', 'elk', 'splunk', 'cloudwatch',
    'autoscaling', 's3', 'ec2', 'lambda', 'serverless', 'iam', 'vpc', 'zero trust'
  ],
  'system_design': [
    'scalability', 'high availability', 'fault tolerance', 'latency', 'throughput', 'cap theorem',
    'consistency', 'eventual consistency', 'cdn', 'cache invalidation', 'message queue',
    'read replica', 'write ahead log', 'bloom filter', 'data partition', 'circuit breaker'
  ],
  'behavioral_star': [
    'situation', 'task', 'action', 'result', 'impact', 'stakeholders', 'collaboration',
    'leadership', 'conflict resolution', 'deadline', 'priority', 'trade-off', 'learning',
    'mentorship', 'feedback', 'retrospective', 'ownership', 'initiative'
  ]
};

// Match terms against text
function matchConcepts(text, expectedKeywords = []) {
  if (!text || typeof text !== 'string') {
    return { matches: [], missed: expectedKeywords, coverageRatio: 0 };
  }

  const normalizedText = text.toLowerCase();
  const matched = [];
  const missed = [];

  for (const kw of expectedKeywords) {
    const cleanKw = kw.toLowerCase().trim();
    // Check direct inclusion or regex boundary
    const regex = new RegExp(`\\b${cleanKw.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
    if (regex.test(normalizedText) || normalizedText.includes(cleanKw)) {
      matched.push(cleanKw);
    } else {
      missed.push(cleanKw);
    }
  }

  const total = expectedKeywords.length;
  const coverageRatio = total > 0 ? matched.length / total : 1.0;

  return {
    matches: matched,
    missed: missed,
    coverageRatio: Math.min(1.0, coverageRatio)
  };
}

// Detect breadth of relevant technical skills from ontology
function extractDomainSkills(text, category = 'backend') {
  const normalizedText = (text || '').toLowerCase();
  const ontology = TECHNICAL_SKILL_ONTOLOGY[category] || [
    ...TECHNICAL_SKILL_ONTOLOGY.backend,
    ...TECHNICAL_SKILL_ONTOLOGY.frontend,
    ...TECHNICAL_SKILL_ONTOLOGY.system_design
  ];

  const detected = [];
  for (const skill of ontology) {
    if (normalizedText.includes(skill)) {
      detected.push(skill);
    }
  }

  return detected;
}

// Evaluate rubric score based on gold answer keywords and required concepts
function evaluateRubricCoverage(candidateText, questionRubric) {
  const requiredKeywords = questionRubric.requiredKeywords || [];
  const bonusKeywords = questionRubric.bonusKeywords || [];
  const coreCompetencies = questionRubric.coreCompetencies || [];

  const requiredResult = matchConcepts(candidateText, requiredKeywords);
  const bonusResult = matchConcepts(candidateText, bonusKeywords);
  const competencyResult = matchConcepts(candidateText, coreCompetencies);

  // Weighted scoring for technical rubric
  // Base coverage: 70% required keywords, 15% bonus keywords, 15% core competencies
  let rawScore = (requiredResult.coverageRatio * 70) +
                 (bonusResult.coverageRatio * 15) +
                 (competencyResult.coverageRatio * 15);

  // Cap between 0 and 100
  const score = Math.round(Math.min(100, Math.max(0, rawScore)));

  return {
    score,
    matchedKeywords: requiredResult.matches,
    missingKeywords: requiredResult.missed,
    bonusMatches: bonusResult.matches,
    competenciesDemonstrated: competencyResult.matches,
    coverageRatio: requiredResult.coverageRatio
  };
}

module.exports = {
  TECHNICAL_SKILL_ONTOLOGY,
  matchConcepts,
  extractDomainSkills,
  evaluateRubricCoverage
};
