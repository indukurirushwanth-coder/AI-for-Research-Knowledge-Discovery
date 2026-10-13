import { GoogleGenAI } from '@google/genai';

// Google Gemini SDK client initializer
export function getGenAIClient(provider) {
  try {
    return new GoogleGenAI();
  } catch (err) {
    console.warn('Failed to initialize GoogleGenAI client:', err.message);
    return null;
  }
}

export function getModelName() {
  return process.env.GEMINI_MODEL || 'gemini-2.5-flash';
}

/**
 * Helper to detect if response is from OpenAI API
 */
function isOpenAIResponse(response) {
  return response && response?.choices && Array.isArray(response.choices);
}

/* eslint-enable no-unused-vars */

export async function answerQuestionWithEvidence(userQuery, passages) {
  if (!passages || passages.length === 0) {
    return {
      answer: 'The uploaded papers do not contain sufficient verified passages to substantiate this specific claim. In accordance with academic rigor, no speculative answers have been fabricated.',
      sources: [],
      citations: [],
      insufficientEvidence: true,
      modelUsed: null,
      synthesisSummary: null,
      error: null,
      message: null
    };
  }

  const ai = getGenAIClient();
  if (!ai) {
    // Extractive fallback: answer using only the passage texts
    const passageTexts = passages.map(p => p.chunkText).join('. ');
    const answer = `Based on the retrieved evidence: ${passageTexts.substring(0, 500)}${passageTexts.length > 500 ? '...' : ''}`;

    const sources = passages.map((p, idx) => ({
      sourceId: `Source ${idx + 1}`,
      citationTag: `[Source ${idx + 1}]`,
      documentId: p.document_id,
      documentTitle: p.documentTitle || 'Untitled Document',
      pageNumber: p.pageNumber,
      chunkText: p.chunkText,
      relevanceScore: p.relevanceScore || 1.0
    }));

    return {
      answer,
      sources,
      citations: sources.map(s => s.citationTag),
      insufficientEvidence: false,
      modelUsed: 'Extractive Fallback (No API Key)',
      synthesisSummary: 'Synthesis from retrieved passages using extractive method.',
      error: null,
      message: null
    };
  }

  const model = getModelName();

  // Build context from passages
  const context = passages.map((p, idx) => {
    const docInfo = p.documentTitle ? `Document: ${p.documentTitle}` : '';
    const pageInfo = p.pageNumber ? `Page ${p.pageNumber}` : '';
    const quote = p.chunkText.substring(0, 200);
    return `[Source ${idx + 1}] ${docInfo} ${pageInfo}: "${quote}"`;
  }).join('\n');

  const prompt = `You are ResearchLens AI, providing an evidence-grounded answer to a research question.

Strict Rules:
- Answer using ONLY the provided retrieved passages below.
- If the passages do not contain sufficient information to answer the question, explicitly state that evidence is insufficient.
- Cite each factual claim with the corresponding [Source N] tag.
- Do not hallucinate or add information not found in the passages.

USER QUESTION:
${userQuery}

RETRIEVED EVIDENCE PASSEAGES:
${context}

ANSWER:`.trim();

  let response;
  try {
    response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        temperature: 0.1
      }
    });
  } catch (err) {
    console.warn(' Gemini API error in answerQuestionWithEvidence:', err.message);
    // Fallback to extractive answer
    const passageTexts = passages.map(p => p.chunkText).join('. ');
    const answer = `Based on the retrieved evidence: ${passageTexts.substring(0, 500)}${passageTexts.length > 500 ? '...' : ''}`;

    const sources = passages.map((p, idx) => ({
      sourceId: `Source ${idx + 1}`,
      citationTag: `[Source ${idx + 1}]`,
      documentId: p.document_id,
      documentTitle: p.documentTitle || 'Untitled Document',
      pageNumber: p.pageNumber,
      chunkText: p.chunkText,
      relevanceScore: p.relevanceScore || 1.0
    }));

    return {
      answer,
      sources,
      citations: sources.map(s => s.citationTag),
      insufficientEvidence: false,
      modelUsed: 'Extractive Fallback (API Error)',
      synthesisSummary: 'Synthesis from retrieved passages using extractive method due to API error.',
      error: err.message,
      message: err.message
    };
  }

  const rawText = response.text || '';
  const parsed = cleanJsonOutput(rawText || '');

  if (!parsed) {
    // Fallback: use raw text as answer if JSON parsing fails
    const answer = rawText.substring(0, 500) + (rawText.length > 500 ? '...' : '');

    const sources = passages.map((p, idx) => ({
      sourceId: `Source ${idx + 1}`,
      citationTag: `[Source ${idx + 1}]`,
      documentId: p.document_id,
      documentTitle: p.documentTitle || 'Untitled Document',
      pageNumber: p.pageNumber,
      chunkText: p.chunkText,
      relevanceScore: p.relevanceScore || 1.0
    }));

    return {
      answer,
      sources,
      citations: sources.map(s => s.citationTag),
      insufficientEvidence: false,
      modelUsed: model,
      synthesisSummary: null,
      error: 'Model did not return valid JSON',
      message: 'Model did not return valid JSON'
    };
  }

  // Build sources from parsed result
  const sources = passages.map((p, idx) => ({
    sourceId: `Source ${idx + 1}`,
    citationTag: `[Source ${idx + 1}]`,
    documentId: p.document_id,
    documentTitle: p.documentTitle || 'Untitled Document',
    pageNumber: p.pageNumber,
    chunkText: p.chunkText,
    relevanceScore: p.relevanceScore || 1.0
  }));

  return {
    answer: parsed.answer || rawText,
    sources,
    citations: parsed.citations || [],
    insufficientEvidence: parsed.insufficientEvidence || false,
    modelUsed: model,
    synthesisSummary: parsed.synthesisSummary || null,
    error: parsed.error || null,
    message: parsed.message || null
  };
}

export async function synthesizeKnowledgeGraph(docsWithChunks) {
  if (!docsWithChunks || docsWithChunks.length === 0) {
    return {
      synthesisOverview: 'No documents provided for knowledge graph synthesis.',
      themes: [],
      researchGaps: ['Please upload at least one research paper.'],
      futureResearchDirections: [],
      modelUsed: null,
      error: null,
      message: null
    };
  }

  const ai = getGenAIClient();
  if (!ai) {
    // Extractive fallback
    const synthesisOverview = `Knowledge synthesis across ${docsWithChunks.length} papers using extractive method.`;

    const themes = docsWithChunks.map(doc => ({
      documentId: doc.id,
      documentTitle: doc.title,
      mainTheme: (doc.chunks[0]?.chunk_text || '').substring(0, 100) + '...',
      chunkCount: doc.chunks.length
    }));

    const allChunks = docsWithChunks.flatMap(d => d.chunks || []);
    const commonTerms = tokenize(allChunks.map(c => c.chunk_text).join(' '))
      .filter((word, idx, self) => self.indexOf(word) === idx)
      .slice(0, 10);

    const researchGaps = ['Identify specific limitations in provided text'];
    const futureResearchDirections = ['Empirical evaluation across heterogeneous platforms'];

    return {
      synthesisOverview,
      themes,
      researchGaps,
      futureResearchDirections,
      modelUsed: 'Extractive Fallback (No API Key)',
      error: null,
      message: null
    };
  }

  const model = getModelName();

  // Build document content summaries
  const docSummaries = docsWithChunks.map((doc, idx) => {
    const sampleChunks = (doc.chunks || []).slice(0, 8);
    const textSample = sampleChunks.map(c => `[Page ${c.page_number}]: ${c.chunk_text}`).join('\n\n');
    return `=== DOCUMENT ${idx + 1}: "${doc.title}" (ID: ${doc.id}) ===\nFilename: ${doc.original_name}\nPages: ${doc.page_count}\nContent Excerpts:\n${textSample}\n=== END DOCUMENT ${idx + 1} ===`;
  }).join('\n\n');

  const prompt = `You are ResearchLens AI, performing knowledge discovery and theme synthesis across academic research papers.

Strict Rules:
- Only cite information found in the provided paper excerpts.
- If an attribute is not mentioned in a paper's excerpt, write "Not found in provided text".
- Identify recurring themes across the document collection.
- Identify research gaps (unanswered questions or unaddressed limitations).
- Suggest future research directions (label these as AI-generated suggestions).

PAPERS TO SYNTHESIZE:
${docSummaries}

Respond in valid JSON with this schema:
{
  "synthesisOverview": "A high-level synthesis of how these papers relate to each other.",
  "themes": [
    {
      "documentId": "id",
      "documentTitle": "Title",
      "mainTheme": "Primary theme or finding from this paper"
    }
  ],
  "researchGaps": "Unanswered question or unaddressed limitation across these studies",
  "futureResearchDirections": "AI-suggested hypothesis or direction for follow-up empirical research"
}`;

  let response;
  try {
    if (provider === 'openai' || (provider !== 'gemini' && ai instanceof OpenAI)) {
      response = await ai.chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: 'You are ResearchLens AI, performing knowledge synthesis.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.15
      });
    } else {
      response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          temperature: 0.15
        }
      });
    }
  } catch (err) {
    console.warn(' Gemini API error in synthesizeKnowledgeGraph:', err.message);
    // Extractive fallback
    const synthesisOverview = `Knowledge synthesis across ${docsWithChunks.length} papers using extractive method.`;
    const themes = docsWithChunks.map(doc => ({
      documentId: doc.id,
      documentTitle: doc.title,
      mainTheme: (doc.chunks[0]?.chunk_text || '').substring(0, 100) + '...',
      chunkCount: doc.chunks.length
    }));
    const researchGaps = ['AI synthesis unavailable, showing individual paper excerpts.'];
    const futureResearchDirections = ['Empirical evaluation across heterogeneous platforms.'];

    return {
      synthesisOverview,
      themes,
      researchGaps,
      futureResearchDirections,
      modelUsed: 'Extractive Fallback (API Error)',
      error: err.message,
      message: err.message
    };
  }

  const rawText = isOpenAIResponse(response instanceof OpenAI ? (response?.choices?.[0]?.message?.content || response?.choices?.[0]?.text || '') : (response?.text || ''));
  const parsed = cleanJsonOutput(rawText || '');

  if (!parsed) {
    // Extractive fallback when JSON parsing fails
    const synthesisOverview = `Knowledge synthesis across ${docsWithChunks.length} papers using extractive method.`;
    const themes = docsWithChunks.map(doc => ({
      documentId: doc.id,
      documentTitle: doc.title,
      mainTheme: (doc.chunks[0]?.chunk_text || '').substring(0, 100) + '...',
      chunkCount: doc.chunks.length
    }));
    const researchGaps = ['Model did not return valid JSON.'];
    const futureResearchDirections = ['Evaluate papers individually.'];

    return {
      synthesisOverview,
      themes,
      researchGaps,
      futureResearchDirections,
      modelUsed: 'Extractive Fallback (JSON Parse Error)',
      error: 'Model did not return valid JSON',
      message: 'Model did not return valid JSON'
    };
  }

  return {
    synthesisOverview: parsed.synthesisOverview || 'Knowledge synthesis completed.',
    themes: parsed.themes || [],
    researchGaps: parsed.researchGaps || 'No specific gaps identified.',
    futureResearchDirections: parsed.futureResearchDirections || ['Further research needed.'],
    modelUsed: model,
    error: parsed.error || null,
    message: parsed.message || null
  };
}

export async function compareDocuments(documentsWithChunks, provider) {
  if (!documentsWithChunks || documentsWithChunks.length < 2) {
    throw new Error('At least two documents are required for comparative analysis.');
  }

  const ai = getGenAIClient(provider);
  if (!ai) {
    // Extractive comparison fallback (works for both providers)
    const matrix = documentsWithChunks.map(doc => ({
      documentId: doc.id,
      documentTitle: doc.title,
      objective: (doc.chunks[0]?.chunk_text || '').substring(0, 180) + '...',
      methodology: (doc.chunks.length > 1 ? doc.chunks[1]?.chunk_text : 'See document text').substring(0, 180),
      keyFindings: (doc.chunks.length > 2 ? doc.chunks[2]?.chunk_text : doc.chunks[0]?.chunk_text || '').substring(0, 180),
      limitations: 'Not found in provided text',
      conclusions: (doc.chunks[doc.chunks.length - 1]?.chunk_text || '').substring(0, 180)
    }));

    return {
      comparisonMatrix: matrix,
      agreements: [
        {
          topic: 'Document Comparison',
          description: `Extracted direct excerpts across ${documentsWithChunks.length} documents. Set GEMINI_API_KEY or OPENAI_API_KEY to enable full generative comparison.`,
          papersInvolved: documentsWithChunks.map(d => d.title)
        }
      ],
      disagreements: [],
      researchGaps: ['Full automated semantic gap analysis requires AI API key configuration.'],
      futureResearchDirections: ['Empirical evaluation across heterogeneous platforms.'],
      synthesisOverview: `Extractive overview across ${documentsWithChunks.length} papers.`,
      modelUsed: 'Extractive Comparison Engine',
      warning: 'No AI API key configured. Displaying structured document excerpts.'
    };
  }

  const model = getModelName();

  // Build document summaries for the prompt
  const docSummaries = documentsWithChunks.map((doc, idx) => {
    const sampleChunks = (doc.chunks || []).slice(0, 8);
    const textSample = sampleChunks.map(c => `[Page ${c.page_number}]: ${c.chunk_text}`).join('\n\n');
    return `=== DOCUMENT ${idx + 1}: "${doc.title}" (ID: ${doc.id}) ===\nFilename: ${doc.original_name}\nPages: ${doc.page_count}\nContent Excerpts:\n${textSample}\n=== END DOCUMENT ${idx + 1} ===`;
  }).join('\n\n');

  const comparisonPrompt = `You are ResearchLens AI, performing a comparative analysis of academic research papers.
Strict Rules:
- Only cite information found in the provided excerpts.
- If an attribute (objective, methodology, findings, limitations, or conclusions) is not mentioned in a paper's excerpt, write "Not found in provided text".
- Identify clear agreements (convergences) and disagreements (conflicts/divergences).
- Identify missing evidence and suggest future research questions (label these as AI-generated suggestions).

PAPERS TO COMPARE:
${docSummaries}

Respond strictly in valid JSON matching this schema:
{
  "comparisonMatrix": [
    {
      "documentId": "id",
      "documentTitle": "Title",
      "objective": "Main objective or 'Not found in provided text'",
      "methodology": "Methodology or 'Not found in provided text'",
      "keyFindings": "Key empirical findings or 'Not found in provided text'",
      "limitations": "Self-reported or observed limitations or 'Not found in provided text'",
      "conclusions": "Conclusions or 'Not found in provided text'
    }
  ],
  "agreements": [
    {
      "topic": "Topic of agreement",
      "description": "How the papers agree or converge, with specific citations to paper titles",
      "papersInvolved": ["Title 1", "Title 2"]
    }
  ],
  "disagreements": [
    {
      "topic": "Topic of disagreement or contrast",
      "description": "How the findings, methodologies, or conclusions diverge",
      "papersInvolved": ["Title 1", "Title 2"]
    }
  ],
  "researchGaps": "Unanswered question or unaddressed limitation across these studies",
  "futureResearchDirections": "AI-suggested hypothesis or direction for follow-up empirical research",
  "synthesisOverview": "A high-level synthesis of how these papers relate to each other."
}`;

  let response;

  try {
    if (provider === 'openai' || (provider !== 'gemini' && ai instanceof OpenAI)) {
      // OpenAI API call
      response = await ai.chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: comparisonPrompt },
          { role: 'user', content: 'Analyze these papers and respond in valid JSON.' }
        ],
        temperature: 0.15
      });
    } else {
      // Google Gemini API call
      response = await ai.models.generateContent({
        model,
        contents: comparisonPrompt,
        config: {
          temperature: 0.15
        }
      });
    }

    // Parse response - works for both providers
    const rawText = isOpenAIResponse(response instanceof OpenAI ? (response?.choices?.[0]?.message?.content || response?.choices?.[0]?.text || '') : (response?.text || ''));
    const parsed = cleanJsonOutput(rawText || '');

    if (!parsed) {
      // Fallback to extractive comparison if AI doesn't return valid JSON
      throw new Error('Model failed to output structured comparative JSON.');
    }

    return {
      ...parsed,
      modelUsed: model
    };
  } catch (err) {
    console.warn('compareDocuments AI error, falling back to extractive comparison:', err.message);

    // Extractive fallback
    const matrix = documentsWithChunks.map(doc => ({
      documentId: doc.id,
      documentTitle: doc.title,
      objective: (doc.chunks[0]?.chunk_text || '').substring(0, 180) + '...',
      methodology: (doc.chunks.length > 1 ? doc.chunks[1]?.chunk_text : 'See document text').substring(0, 180),
      keyFindings: (doc.chunks.length > 2 ? doc.chunks[2]?.chunk_text : doc.chunks[0]?.chunk_text || '').substring(0, 180),
      limitations: 'Not found in provided text',
      conclusions: (doc.chunks[doc.chunks.length - 1]?.chunk_text || '').substring(0, 180)
    }));

    return {
      comparisonMatrix: matrix,
      agreements: [
        {
          topic: 'Document Comparison',
          description: `Extracted direct excerpts across ${documentsWithChunks.length} documents. AI comparison unavailable, showing structured excerpts.`,
          papersInvolved: documentsWithChunks.map(d => d.title)
        }
      ],
      disagreements: [],
      researchGaps: ['AI comparison unavailable, showing individual paper excerpts.'],
      futureResearchDirections: ['Evaluate papers individually.'],
      synthesisOverview: `Extractive overview across ${documentsWithChunks.length} papers. AI comparison unavailable.`,
      modelUsed: 'Extractive Comparison Engine (Fallback)',
      warning: `Comparison AI error: ${err.message}. Displaying structured document excerpts.`
    };
  }
}