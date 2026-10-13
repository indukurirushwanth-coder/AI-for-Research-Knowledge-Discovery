const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he',
  'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'were', 'will',
  'with', 'what', 'which', 'who', 'where', 'when', 'how', 'why', 'can', 'does',
  'do', 'did', 'this', 'these', 'those', 'about', 'between', 'into', 'through',
  'during', 'before', 'after', 'above', 'below', 'up', 'down', 'in', 'out', 'off',
  'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'all', 'any',
  'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
  'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'just', 'don', 'should'
]);

// Ordinal mappings for questions like "what is the first question", "second problem", etc.
const ORDINAL_MAP = {
  'first': ['1.', '1)', '1 -', 'question 1', 'q1', 'one', '(i)', 'i.'],
  '1st': ['1.', '1)', '1 -', 'question 1', 'q1', 'one', '(i)', 'i.'],
  'second': ['2.', '2)', '2 -', 'question 2', 'q2', 'two', '(ii)', 'ii.'],
  '2nd': ['2.', '2)', '2 -', 'question 2', 'q2', 'two', '(ii)', 'ii.'],
  'third': ['3.', '3)', '3 -', 'question 3', 'q3', 'three', '(iii)', 'iii.'],
  '3rd': ['3.', '3)', '3 -', 'question 3', 'q3', 'three', '(iii)', 'iii.'],
  'fourth': ['4.', '4)', '4 -', 'question 4', 'q4', 'four', '(iv)', 'iv.'],
  '4th': ['4.', '4)', '4 -', 'question 4', 'q4', 'four', '(iv)', 'iv.'],
  'fifth': ['5.', '5)', '5 -', 'question 5', 'q5', 'five', '(v)', 'v.'],
  '5th': ['5.', '5)', '5 -', 'question 5', 'q5', 'five', '(v)', 'v.']
};

/**
 * Normalize and stem token
 */
export function normalizeWord(word) {
  if (!word) return '';
  let clean = word.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (clean.endsWith('ies') && clean.length > 4) return clean.slice(0, -3) + 'y';
  if (clean.endsWith('ing') && clean.length > 5) return clean.slice(0, -3);
  if (clean.endsWith('ed') && clean.length > 4) return clean.slice(0, -2);
  if (clean.endsWith('s') && !clean.endsWith('ss') && clean.length > 3) return clean.slice(0, -1);
  return clean;
}

/**
 * Tokenize text into normalized tokens
 */
export function tokenize(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .map(w => normalizeWord(w))
    .filter(word => word.length > 1 && !STOP_WORDS.has(word));
}

/**
 * Score single chunk with BM25 + phrase boost + ordinal expansion
 */
function scoreChunkBM25(chunk, queryTokens, queryPhrase, avgDocLength, docFrequencies, totalDocs, extraPatterns = []) {
  const chunkText = chunk.chunk_text || '';
  const textLower = chunkText.toLowerCase();
  const chunkTokens = tokenize(chunkText);
  const docLen = chunkTokens.length || 1;

  const k1 = 1.5;
  const b = 0.75;
  let score = 0;

  // Exact phrase match bonus
  if (queryPhrase && queryPhrase.length > 4 && textLower.includes(queryPhrase.toLowerCase())) {
    score += 8.0;
  }

  // Ordinal and pattern boost (e.g. "1.", "1)", "q1" for "first question")
  for (const pat of extraPatterns) {
    if (textLower.includes(pat.toLowerCase())) {
      score += 4.5;
    }
  }

  // Count term frequencies with subword/stem matching
  const tfMap = {};
  for (const t of chunkTokens) {
    tfMap[t] = (tfMap[t] || 0) + 1;
  }

  for (const qToken of queryTokens) {
    let tf = tfMap[qToken] || 0;

    // Substring / lemma match if exact token didn't hit
    if (tf === 0) {
      for (const [cToken, count] of Object.entries(tfMap)) {
        if (cToken.includes(qToken) || qToken.includes(cToken)) {
          tf += count * 0.75;
        }
      }
    }

    if (tf > 0) {
      const df = docFrequencies[qToken] || 1;
      const idf = Math.log(1 + (totalDocs / df));
      const termScore = (idf + 0.5) * ((tf * (k1 + 1)) / (tf + k1 * (1 - b + b * (docLen / avgDocLength))));
      score += termScore;
    }
  }

  // Document title match boost
  const docTitle = (chunk.document_title || '').toLowerCase();
  for (const qToken of queryTokens) {
    if (docTitle.includes(qToken)) {
      score += 2.0;
    }
  }

  return score;
}

/**
 * Retrieve top relevant passages across candidate chunks
 */
export function retrieveRelevantPassages(allChunks, query, topK = 6, minScoreThreshold = 0.2) {
  if (!allChunks || allChunks.length === 0 || !query || !query.trim()) {
    return {
      passages: [],
      hasSufficientEvidence: false,
      totalCandidateChunks: allChunks ? allChunks.length : 0,
      retrievedCount: 0
    };
  }

  const queryLower = query.toLowerCase();
  const queryTokens = tokenize(query);
  const cleanQuery = query.trim();

  // Collect ordinal/pattern expansions
  const extraPatterns = [];
  for (const [key, pats] of Object.entries(ORDINAL_MAP)) {
    if (queryLower.includes(key)) {
      extraPatterns.push(...pats);
    }
  }

  const effectiveTokens = queryTokens.length > 0
    ? queryTokens
    : cleanQuery.toLowerCase().split(/\s+/).filter(w => w.length > 1);

  const docFrequencies = {};
  let totalWords = 0;

  for (const chunk of allChunks) {
    const tokens = new Set(tokenize(chunk.chunk_text));
    totalWords += tokens.size;
    for (const token of tokens) {
      docFrequencies[token] = (docFrequencies[token] || 0) + 1;
    }
  }

  const totalDocs = allChunks.length;
  const avgDocLength = Math.max(1, totalWords / totalDocs);

  // Score chunks
  const scoredChunks = allChunks.map(chunk => {
    const score = scoreChunkBM25(
      chunk,
      effectiveTokens,
      cleanQuery,
      avgDocLength,
      docFrequencies,
      totalDocs,
      extraPatterns
    );
    return {
      ...chunk,
      relevanceScore: Math.round(score * 100) / 100
    };
  });

  scoredChunks.sort((a, b) => b.relevanceScore - a.relevanceScore);

  let matched = scoredChunks.filter(c => c.relevanceScore > 0);

  // Overview / General inquiry fallback:
  // If user asks a general question like "what is in this document", "overview", "summary", or if query matches document title,
  // ensure starting chunks of the document are provided rather than failing completely!
  const isGeneralOrMetaQuery =
    queryLower.includes('first') ||
    queryLower.includes('question') ||
    queryLower.includes('summar') ||
    queryLower.includes('overview') ||
    queryLower.includes('about') ||
    queryLower.includes('explain') ||
    queryLower.includes('what is') ||
    queryLower.includes('all');

  if (matched.length === 0 && isGeneralOrMetaQuery && scoredChunks.length > 0) {
    // Take the first chunks (Page 1 chunks) of candidate documents
    matched = scoredChunks.slice(0, Math.min(topK, 3)).map(c => ({
      ...c,
      relevanceScore: 1.0 // baseline contextual relevance
    }));
  }

  const topPassages = matched.slice(0, topK).map((item, index) => ({
    sourceId: `Source ${index + 1}`,
    citationTag: `[Source ${index + 1}]`,
    documentId: item.document_id,
    documentTitle: item.document_title || 'Untitled Document',
    originalName: item.original_name || '',
    pageNumber: item.page_number,
    chunkIndex: item.chunk_index,
    chunkText: item.chunk_text,
    relevanceScore: item.relevanceScore,
    tokenCount: item.token_count || Math.ceil(item.chunk_text.length / 4)
  }));

  return {
    passages: topPassages,
    hasSufficientEvidence: topPassages.length > 0,
    totalCandidateChunks: allChunks.length,
    retrievedCount: topPassages.length,
    topScore: topPassages.length > 0 ? topPassages[0].relevanceScore : 0
  };
}

export default {
  tokenize,
  normalizeWord,
  retrieveRelevantPassages
};
