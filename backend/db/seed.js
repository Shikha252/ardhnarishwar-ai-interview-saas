// Seed Data for Ardhnarishwar Multi-Tenant Platform
// Populates Super Admin, Companies, Question Banks, Jobs, Candidates, and Evaluated Interviews

const bcrypt = require('bcryptjs');
const db = require('./database');
const { evaluateCompleteInterview } = require('../ai-engine/evaluator');

async function seedDatabase() {
  console.log('[Seed] Starting database seeding...');

  // Reset collections
  db.data.companies = [];
  db.data.users = [];
  db.data.jobs = [];
  db.data.interviewConfigs = [];
  db.data.questionBank = [];
  db.data.candidates = [];
  db.data.interviews = [];
  db.data.interviewAnswers = [];
  db.data.recordings = [];
  db.data.auditLogs = [];

  const defaultHash = bcrypt.hashSync('Password123!', 10);

  // 1. Super Admin — Ardhnarishwar
  const superAdmin = db.createUser({
    name: 'Ardhnarishwar SuperAdmin',
    email: 'admin@ardhnarishwar.ai',
    passwordHash: defaultHash,
    role: 'SUPER_ADMIN',
    tenantId: 'GLOBAL',
    companyName: 'Ardhnarishwar Corporation'
  });

  // 2. Client Companies
  const apexCompany = db.createCompany({
    name: 'Apex Global FinTech',
    domain: 'apexfintech.com',
    plan: 'Enterprise',
    status: 'active',
    candidateQuota: 150,
    maxJobs: 25
  });

  const novaCompany = db.createCompany({
    name: 'NovaTech Cloud Systems',
    domain: 'novatech.io',
    plan: 'Growth',
    status: 'active',
    candidateQuota: 60,
    maxJobs: 10
  });

  // 3. Company Admins
  const apexAdmin = db.createUser({
    name: 'Vikramaditya Rao',
    email: 'admin@apexfintech.com',
    passwordHash: defaultHash,
    role: 'COMPANY_ADMIN',
    tenantId: apexCompany.id,
    companyName: apexCompany.name
  });

  const novaAdmin = db.createUser({
    name: 'Meera Nambiar',
    email: 'admin@novatech.io',
    passwordHash: defaultHash,
    role: 'COMPANY_ADMIN',
    tenantId: novaCompany.id,
    companyName: novaCompany.name
  });

  // 4. Global Question Bank
  const q1 = db.createQuestion({
    isGlobal: true,
    category: 'Technical',
    difficulty: 'Senior',
    questionText: 'Explain how database indexing works internally (B-Trees vs Hash Indexes) and what trade-offs you consider when adding indexes to a high-write production table.',
    goldAnswer: 'Database indexes like B-Trees maintain sorted keys allowing logarithmic lookups, range scans, and order-by operations in O(log N). Hash indexes offer O(1) equality searches but fail on range queries. On high-write tables, indexes impose write latency because every INSERT, UPDATE, and DELETE requires updating the index tree and WAL, alongside consuming additional memory and disk I/O.',
    requiredKeywords: ['b-tree', 'logarithmic', 'range', 'write', 'trade-off', 'latency', 'storage'],
    bonusKeywords: ['b+ tree', 'wal', 'composite index', 'lock contention', 'page split'],
    coreCompetencies: ['database optimization', 'system performance', 'storage engines'],
    timeLimitSeconds: 120
  });

  const q2 = db.createQuestion({
    isGlobal: true,
    category: 'Technical',
    difficulty: 'Senior',
    questionText: 'When designing a distributed system, how do you handle microservice communication, fault isolation, and data consistency across distributed transactions?',
    goldAnswer: 'We isolate communication using synchronous gRPC or REST for low latency reads, and asynchronous message brokers like Kafka or RabbitMQ for decoupled event-driven workflows. To prevent cascading failures, we implement circuit breakers and retries with exponential backoff. For distributed data consistency, rather than two-phase commits which harm availability, we use the Saga pattern with compensating transactions and eventual consistency.',
    requiredKeywords: ['microservices', 'grpc', 'kafka', 'circuit breaker', 'saga', 'eventual consistency'],
    bonusKeywords: ['two-phase commit', 'idempotency', 'dead letter queue', 'distributed tracing'],
    coreCompetencies: ['system architecture', 'distributed systems', 'resilience'],
    timeLimitSeconds: 120
  });

  const q3 = db.createQuestion({
    isGlobal: true,
    category: 'Behavioral',
    difficulty: 'Mid-Senior',
    questionText: 'Describe a situation where you had a strong technical disagreement with a team member or architect. How did you handle it and what was the outcome?',
    goldAnswer: 'In my previous project, we disagreed on whether to migrate our monolith immediately to microservices or refactor modularly. My responsibility was to keep development velocity high without creating operational bottlenecks. I set up a technical spike where we measured build times, latency overhead, and deployment complexity. As a result, we agreed on a phased modular monolith first, delivering features 30% faster.',
    requiredKeywords: ['situation', 'responsibility', 'objective', 'spike', 'outcome', 'result', 'collaborative'],
    bonusKeywords: ['consensus', 'data-driven', 'trade-off', 'retrospective'],
    coreCompetencies: ['conflict resolution', 'communication', 'leadership'],
    timeLimitSeconds: 90
  });

  const q4 = db.createQuestion({
    isGlobal: true,
    category: 'HR',
    difficulty: 'General',
    questionText: 'What motivates you as an engineer, and how do you prioritize competing deadlines when facing tight product release timelines?',
    goldAnswer: 'I am motivated by solving complex business challenges and delivering performant, reliable software. When managing competing deadlines, I analyze the impact and urgency using an Eisenhower matrix, communicate transparently with stakeholders about trade-offs, and break tasks down into iterative deliverables.',
    requiredKeywords: ['prioritize', 'stakeholders', 'trade-off', 'communication', 'deliverables', 'impact'],
    bonusKeywords: ['mvp', 'iterative', 'transparent', 'urgent'],
    coreCompetencies: ['time management', 'work ethic', 'stakeholder communication'],
    timeLimitSeconds: 90
  });

  // 5. Jobs for Apex
  const apexJob1 = db.createJob({
    tenantId: apexCompany.id,
    title: 'Senior Full Stack Engineer',
    department: 'Core Banking Engineering',
    experienceLevel: '5+ Years',
    skillsRequired: ['React', 'Node.js', 'SQL', 'B-Tree Indexing', 'Microservices', 'System Design'],
    description: 'Lead architecture of high-throughput payment transaction pipelines and customer dashboard interfaces.',
    passThreshold: 75,
    questionIds: [q1.id, q2.id, q3.id, q4.id]
  });

  const apexJob2 = db.createJob({
    tenantId: apexCompany.id,
    title: 'Staff Backend Architect',
    department: 'Distributed Systems Group',
    experienceLevel: '8+ Years',
    skillsRequired: ['Distributed Systems', 'Kafka', 'PostgreSQL', 'Golang / Node', 'Saga Pattern'],
    description: 'Design distributed transaction engines handling over 50,000 TPS.',
    passThreshold: 80,
    questionIds: [q1.id, q2.id, q3.id]
  });

  // Jobs for NovaTech
  const novaJob1 = db.createJob({
    tenantId: novaCompany.id,
    title: 'Cloud DevOps Architect',
    department: 'Infrastructure & SRE',
    experienceLevel: '6+ Years',
    skillsRequired: ['Kubernetes', 'AWS', 'Terraform', 'CI/CD', 'Prometheus', 'Chaos Engineering'],
    description: 'Manage multi-region Kubernetes clusters, automated zero-downtime deployments, and infrastructure resilience.',
    passThreshold: 72,
    questionIds: [q2.id, q3.id, q4.id]
  });

  // 6. Candidates with completed evaluations
  // Candidate 1: Siddharth Sharma (Strong Hire at Apex)
  const cand1 = db.createCandidate({
    tenantId: apexCompany.id,
    jobId: apexJob1.id,
    name: 'Siddharth Sharma',
    email: 'siddharth.sharma@example.com',
    phone: '+91 98765 43210',
    status: 'SHORTLISTED'
  });
  cand1.recruiterNotes = 'Outstanding technical articulation. Strong understanding of B-Tree indexing and Saga distributed architecture.';

  const intv1 = db.createInterview({
    tenantId: apexCompany.id,
    candidateId: cand1.id,
    jobId: apexJob1.id
  });

  const eval1Questions = [
    {
      questionId: q1.id,
      questionText: q1.questionText,
      category: 'Technical',
      overallQuestionScore: 89,
      metrics: {
        relevance: 92,
        knowledge: 90,
        technicalCompetency: 88,
        communication: 85,
        problemSolving: 90,
        confidence: 88,
        completeness: 94,
        roleSpecific: 90
      },
      details: {
        wordCount: 142,
        fillerCount: 1,
        fillerRatio: 0.007,
        clarityLevel: 'Exceptional',
        confidenceLevel: 'Very High',
        matchedKeywords: ['b-tree', 'logarithmic', 'range', 'write', 'trade-off', 'latency', 'storage'],
        missingKeywords: [],
        detectedSkills: ['sql', 'indexing', 'b-tree', 'transactions'],
        strengths: ['Demonstrated deep grasp of B-Tree balanced structures and O(log N) lookup time.', 'Accurately highlighted index write penalty on high-frequency tables.'],
        improvements: ['Could briefly mention composite index ordering (leftmost prefix rule).']
      }
    },
    {
      questionId: q2.id,
      questionText: q2.questionText,
      category: 'Technical',
      overallQuestionScore: 91,
      metrics: {
        relevance: 94,
        knowledge: 92,
        technicalCompetency: 92,
        communication: 87,
        problemSolving: 93,
        confidence: 90,
        completeness: 92,
        roleSpecific: 91
      },
      details: {
        wordCount: 156,
        fillerCount: 2,
        fillerRatio: 0.012,
        clarityLevel: 'Exceptional',
        confidenceLevel: 'Very High',
        matchedKeywords: ['microservices', 'grpc', 'kafka', 'circuit breaker', 'saga', 'eventual consistency'],
        missingKeywords: [],
        detectedSkills: ['microservices', 'rest', 'kafka', 'circuit breaker'],
        strengths: ['Seamlessly explained Saga orchestrator pattern vs choreography.', 'Clear mention of resilience circuit breaker patterns.'],
        improvements: []
      }
    },
    {
      questionId: q3.id,
      questionText: q3.questionText,
      category: 'Behavioral',
      overallQuestionScore: 85,
      metrics: {
        relevance: 88,
        knowledge: 82,
        technicalCompetency: 84,
        communication: 89,
        problemSolving: 88,
        confidence: 86,
        completeness: 88,
        roleSpecific: 82
      },
      details: {
        wordCount: 128,
        fillerCount: 2,
        fillerRatio: 0.015,
        clarityLevel: 'Exceptional',
        confidenceLevel: 'Very High',
        matchedKeywords: ['situation', 'responsibility', 'objective', 'outcome', 'collaborative'],
        missingKeywords: [],
        detectedSkills: [],
        starAnalysis: { isSTARFramed: true, score: 100 },
        strengths: ['Strong STAR framework adherence.', 'Showcased data-driven consensus building rather than ego-driven conflict.'],
        improvements: ['Could quantify developer efficiency improvement with more specific KPI numbers.']
      }
    }
  ];

  const eval1Complete = evaluateCompleteInterview(eval1Questions, {
    title: apexJob1.title,
    requiredSkills: apexJob1.skillsRequired
  });

  db.completeInterview(intv1.id, eval1Complete);
  db.saveRecording({
    tenantId: apexCompany.id,
    candidateId: cand1.id,
    interviewId: intv1.id,
    filePath: '/recordings/cand1_apex_recording.mp4',
    duration: 360,
    fileSize: 18450000,
    mimeType: 'video/mp4',
    questionTimestamps: [
      { questionIndex: 1, questionId: q1.id, title: 'Database Indexing & B-Trees', startSeconds: 0, endSeconds: 118 },
      { questionIndex: 2, questionId: q2.id, title: 'Distributed Systems & Saga Pattern', startSeconds: 119, endSeconds: 245 },
      { questionIndex: 3, questionId: q3.id, title: 'Handling Technical Disagreements (STAR)', startSeconds: 246, endSeconds: 360 }
    ]
  });

  // Candidate 2: Ananya Iyer (NovaTech DevOps)
  const cand2 = db.createCandidate({
    tenantId: novaCompany.id,
    jobId: novaJob1.id,
    name: 'Ananya Iyer',
    email: 'ananya.iyer@cloudengine.net',
    phone: '+91 99887 76655',
    status: 'COMPLETED'
  });

  const intv2 = db.createInterview({
    tenantId: novaCompany.id,
    candidateId: cand2.id,
    jobId: novaJob1.id
  });

  const eval2Questions = [
    {
      questionId: q2.id,
      questionText: q2.questionText,
      category: 'Technical',
      overallQuestionScore: 84,
      metrics: {
        relevance: 86,
        knowledge: 85,
        technicalCompetency: 84,
        communication: 82,
        problemSolving: 85,
        confidence: 84,
        completeness: 88,
        roleSpecific: 86
      },
      details: {
        wordCount: 130,
        fillerCount: 3,
        fillerRatio: 0.023,
        clarityLevel: 'Strong',
        confidenceLevel: 'High',
        matchedKeywords: ['microservices', 'kafka', 'circuit breaker', 'eventual consistency'],
        missingKeywords: ['saga'],
        detectedSkills: ['microservices', 'kubernetes', 'kafka', 'circuit breaker'],
        strengths: ['Sound explanation of message queuing and backpressure handling.'],
        improvements: ['Deepen explanation of distributed Saga compensating transactions.']
      }
    }
  ];

  const eval2Complete = evaluateCompleteInterview(eval2Questions, {
    title: novaJob1.title,
    requiredSkills: novaJob1.skillsRequired
  });

  db.completeInterview(intv2.id, eval2Complete);
  db.saveRecording({
    tenantId: novaCompany.id,
    candidateId: cand2.id,
    interviewId: intv2.id,
    filePath: '/recordings/cand2_nova_recording.mp4',
    duration: 210,
    fileSize: 11200000,
    mimeType: 'video/mp4',
    questionTimestamps: [
      { questionIndex: 1, questionId: q2.id, title: 'Distributed Systems Communication', startSeconds: 0, endSeconds: 210 }
    ]
  });

  // Candidate 3: Rohan Patel (Borderline candidate at Apex)
  const cand3 = db.createCandidate({
    tenantId: apexCompany.id,
    jobId: apexJob1.id,
    name: 'Rohan Patel',
    email: 'rohan.patel@devmail.org',
    phone: '+91 91234 56789',
    status: 'COMPLETED'
  });

  const intv3 = db.createInterview({
    tenantId: apexCompany.id,
    candidateId: cand3.id,
    jobId: apexJob1.id
  });

  const eval3Questions = [
    {
      questionId: q1.id,
      questionText: q1.questionText,
      category: 'Technical',
      overallQuestionScore: 61,
      metrics: {
        relevance: 65,
        knowledge: 60,
        technicalCompetency: 58,
        communication: 64,
        problemSolving: 59,
        confidence: 55,
        completeness: 65,
        roleSpecific: 62
      },
      details: {
        wordCount: 78,
        fillerCount: 6,
        fillerRatio: 0.076,
        clarityLevel: 'Moderate',
        confidenceLevel: 'Low / Hesitant',
        matchedKeywords: ['b-tree', 'write', 'latency'],
        missingKeywords: ['logarithmic', 'range', 'trade-off', 'storage'],
        detectedSkills: ['sql', 'indexing'],
        strengths: ['Identified that indexes speed up select queries.'],
        improvements: ['Noticeable hesitation with 6 verbal fillers.', 'Lacked explanation of B-Tree logarithmic search mechanics and disk page splits.']
      }
    }
  ];

  const eval3Complete = evaluateCompleteInterview(eval3Questions, {
    title: apexJob1.title,
    requiredSkills: apexJob1.skillsRequired
  });

  db.completeInterview(intv3.id, eval3Complete);

  // Candidate 4: Ready for Live Demo / Testing
  const cand4 = db.createCandidate({
    tenantId: apexCompany.id,
    jobId: apexJob1.id,
    name: 'Pooja Verma',
    email: 'pooja.verma@demo.io',
    phone: '+91 97766 55443',
    status: 'INVITED'
  });

  // 7. Populate Audit Logs
  db.logAudit('GLOBAL', 'Ardhnarishwar SuperAdmin', 'SUPER_ADMIN', 'PLATFORM_INIT', 'Platform initialized with Super Admin and AI Engine 1.4.0');
  db.logAudit(apexCompany.id, 'Vikramaditya Rao', 'COMPANY_ADMIN', 'JOB_CREATED', `Created Job: ${apexJob1.title}`);
  db.logAudit(apexCompany.id, 'Vikramaditya Rao', 'COMPANY_ADMIN', 'CANDIDATE_INVITED', `Generated interview invitation for candidate: ${cand1.name}`);
  db.logAudit(apexCompany.id, 'AI_ENGINE', 'SYSTEM', 'EVALUATION_COMPLETED', `Generated 9-metric evaluation for candidate: ${cand1.name} (Score: 88, Strong Hire)`);
  db.logAudit(apexCompany.id, 'Vikramaditya Rao', 'COMPANY_ADMIN', 'CANDIDATE_SHORTLISTED', `Shortlisted candidate ${cand1.name} with hiring recommendation`);
  db.logAudit(novaCompany.id, 'Meera Nambiar', 'COMPANY_ADMIN', 'JOB_CREATED', `Created Job: ${novaJob1.title}`);
  db.logAudit(novaCompany.id, 'AI_ENGINE', 'SYSTEM', 'EVALUATION_COMPLETED', `Generated 9-metric evaluation for candidate: ${cand2.name} (Score: 84, Hire)`);

  console.log('[Seed] Database successfully seeded with full multi-tenant dataset!');
  return {
    superAdmin,
    apexCompany,
    novaCompany,
    candidates: [cand1, cand2, cand3, cand4]
  };
}

// Run seed if directly called
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
