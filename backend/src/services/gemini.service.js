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