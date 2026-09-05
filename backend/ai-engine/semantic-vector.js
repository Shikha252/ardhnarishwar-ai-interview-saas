// Internal Semantic Vector & Lexical NLP Engine
// Operates 100% locally without external AI APIs (No OpenAI/Gemini/Claude)

const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t', 'as', 'at',
  'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'can', 'can\'t', 'cannot',
  'could', 'couldn\'t', 'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 'don\'t', 'down', 'during', 'each',
  'few', 'for', 'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t', 'have', 'haven\'t', 'having', 'he', 'he\'d',
  'he\'ll', 'he\'s', 'her', 'here', 'here\'s', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'how\'s', 'i',
  'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if', 'in', 'into', 'is', 'isn\'t', 'it', 'it\'s', 'its', 'itself', 'let\'s',
  'me', 'more', 'most', 'mustn\'t', 'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or',
  'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'shan\'t', 'she', 'she\'d', 'she\'ll',
  'she\'s', 'should', 'shouldn\'t', 'so', 'some', 'such', 'than', 'that', 'that\'s', 'the', 'their', 'theirs',
  'them', 'themselves', 'then', 'there', 'there\'s', 'these', 'they', 'they\'d', 'they\'ll', 'they\'re', 'they\'ve',
  'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'wasn\'t', 'we', 'we\'d', 'we\'ll',
  'we\'re', 'we\'ve', 'were', 'weren\'t', 'what', 'what\'s', 'when', 'when\'s', 'where', 'where\'s', 'which', 'while',
  'who', 'who\'s', 'whom', 'why', 'why\'s', 'with', 'won\'t', 'would', 'wouldn\'t', 'you', 'you\'d', 'you\'ll',
  'you\'re', 'you\'ve', 'your', 'yours', 'yourself', 'yourselves'
]);

// Rule-based Stemming for root extraction
function stemWord(word) {
  let w = word.toLowerCase();
  if (w.length <= 3) return w;
  if (w.endsWith('ing')) w = w.slice(0, -3);
  else if (w.endsWith('ies')) w = w.slice(0, -3) + 'y';
  else if (w.endsWith('es')) w = w.slice(0, -2);
  else if (w.endsWith('ed')) w = w.slice(0, -2);
  else if (w.endsWith('ly')) w = w.slice(0, -2);
  else if (w.endsWith('tion')) w = w.slice(0, -4) + 't';
  else if (w.endsWith('ment')) w = w.slice(0, -4);
  else if (w.endsWith('s') && !w.endsWith('ss')) w = w.slice(0, -1);
  return w;
}

// Tokenize and clean text into unigrams & bigrams
function tokenize(text, includeBigrams = true) {
  if (!text || typeof text !== 'string') return [];
  
  // Normalize and split words
  const rawWords = text
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1);

  const cleanTokens = [];
  const stemmedTokens = [];

  for (const w of rawWords) {
    if (!STOP_WORDS.has(w)) {
      cleanTokens.push(w);
      stemmedTokens.push(stemWord(w));
    }
  }

  const result = [...cleanTokens, ...stemmedTokens];

  // Add bigrams for compound technical terms (e.g., 'load balancer', 'system design')
  if (includeBigrams && cleanTokens.length >= 2) {
    for (let i = 0; i < cleanTokens.length - 1; i++) {
      result.push(`${cleanTokens[i]}_${cleanTokens[i + 1]}`);
    }
  }

  return result;
}

// Calculate Term Frequency (TF)
function computeTF(tokens) {
  const tf = {};
  if (!tokens.length) return tf;
  
  for (const t of tokens) {
    tf[t] = (tf[t] || 0) + 1;
  }
  
  // Normalization
  for (const t in tf) {
    tf[t] = tf[t] / tokens.length;
  }
  return tf;
}

// Calculate Cosine Similarity between two token lists / texts
function calculateCosineSimilarity(textA, textB) {
  const tokensA = tokenize(textA);
  const tokensB = tokenize(textB);

  if (!tokensA.length || !tokensB.length) return 0;

  const tfA = computeTF(tokensA);
  const tfB = computeTF(tokensB);

  const allTerms = new Set([...Object.keys(tfA), ...Object.keys(tfB)]);

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (const term of allTerms) {
    const vA = tfA[term] || 0;
    const vB = tfB[term] || 0;

    dotProduct += vA * vB;
    normA += vA * vA;
    normB += vB * vB;
  }

  if (normA === 0 || normB === 0) return 0;
  const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  return Math.min(1, Math.max(0, similarity));
}

// Calculate Jaccard Similarity on stems
function calculateJaccardSimilarity(textA, textB) {
  const setA = new Set(tokenize(textA, false));
  const setB = new Set(tokenize(textB, false));

  if (!setA.size && !setB.size) return 0;

  let intersectionCount = 0;
  for (const item of setA) {
    if (setB.has(item)) intersectionCount++;
  }

  const unionCount = new Set([...setA, ...setB]).size;
  return unionCount === 0 ? 0 : intersectionCount / unionCount;
}

module.exports = {
  tokenize,
  stemWord,
  computeTF,
  calculateCosineSimilarity,
  calculateJaccardSimilarity
};
