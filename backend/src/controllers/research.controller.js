import db from '../config/db.js';
import { processPdf } from '../services/pdf.service.js';
import { retrieveRelevantPassages } from '../services/retrieval.service.js';
import { answerQuestionWithEvidence, compareDocuments, synthesizeKnowledgeGraph } from '../services/gemini.service.js';
import { askQuestionSchema, comparePapersSchema, synthesizeSchema } from '../validators/research.validator.js';

/**
 * GET /api/research/documents
 * List all documents uploaded by current user
 */
export async function getDocuments(req, res, next) {
  try {
    const result = await db.query(
      'SELECT id, title, original_name, file_size, page_count, chunk_count, status, status_message, created_at FROM documents WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );

    res.json({
      documents: result.rows || [],
      count: result.rowCount || 0
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/research/upload
 * Process and persist uploaded PDFs
 */
export async function uploadDocuments(req, res, next) {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: 'No files provided',
        message: 'Please select at least one PDF file to upload.'
      });
    }

    const processedDocs = [];
    const errors = [];

    for (const file of req.files) {
      try {
        const originalName = file.originalname || 'document.pdf';
        const title = originalName.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ');

        const processed = await processPdf(file.buffer, originalName);

        const docResult = await db.query(
          'INSERT INTO documents (user_id, title, original_name, file_size, page_count, chunk_count, status, status_message) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
          [
            req.user.id,
            title,
            originalName,
            file.size,
            processed.pageCount,
            processed.chunks.length,
            processed.status,
            processed.statusMessage
          ]
        );

        const newDoc = docResult.rows[0];

        // Insert chunks
        for (const chunk of processed.chunks) {
          await db.query(
            'INSERT INTO chunks (document_id, page_number, chunk_index, chunk_text, token_count) VALUES ($1, $2, $3, $4, $5)',
            [
              newDoc.id,
              chunk.page_number,
              chunk.chunk_index,
              chunk.chunk_text,
              chunk.token_count
            ]
          );
        }

        processedDocs.push({
          ...newDoc,
          chunkCount: processed.chunks.length,
          statusMessage: processed.statusMessage
        });
      } catch (fileErr) {
        console.error(`Error processing file ${file.originalname}:`, fileErr.message);
        errors.push({
          filename: file.originalname,
          error: fileErr.message
        });
      }
    }

    res.status(201).json({
      message: `Successfully processed ${processedDocs.length} file(s).`,
      documents: processedDocs,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/research/documents/:id
 * Delete document and associated chunks (user authorization enforced)
 */
export async function deleteDocument(req, res, next) {
  try {
    const docId = req.params.id;

    const checkResult = await db.query(
      'SELECT id, original_name FROM documents WHERE id = $1 AND user_id = $2',
      [docId, req.user.id]
    );

    if (!checkResult.rows || checkResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Document not found',
        message: 'The requested document does not exist or does not belong to your account.'
      });
    }

    await db.query(
      'DELETE FROM documents WHERE id = $1 AND user_id = $2',
      [docId, req.user.id]
    );

    res.json({
      message: 'Document and associated evidence chunks successfully deleted.',
      deletedId: docId
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/research/ask
 * Evidence-based Q&A with grounded retrieval and verified citations
 */
export async function askQuestion(req, res, next) {
  try {
    const validated = askQuestionSchema.parse(req.body);
    const { query: userQuery, documentIds } = validated;

    // Fetch candidate chunks for user's documents
    const allChunksResult = await db.query(
      'SELECT c.id, c.document_id, c.page_number, c.chunk_index, c.chunk_text, c.token_count, d.title as document_title, d.original_name FROM chunks c JOIN documents d ON c.document_id = d.id WHERE d.user_id = $1',
      [req.user.id]
    );

    let candidateChunks = allChunksResult.rows || [];

    if (documentIds && Array.isArray(documentIds) && documentIds.length > 0) {
      const allowedSet = new Set(documentIds);
      candidateChunks = candidateChunks.filter(c => allowedSet.has(c.document_id));
    }

    if (candidateChunks.length === 0) {
      if (documentIds && documentIds.length > 0) {
        const docCheck = await db.query(
          'SELECT title, original_name, status, status_message FROM documents WHERE id = ANY($1) AND user_id = $2',
          [documentIds, req.user.id]
        );
        const scannedDoc = docCheck.rows?.find(d => d.status === 'scanned_ocr_required');
        if (scannedDoc) {
          return res.json({
            query: userQuery,
            answer: `The selected document "${scannedDoc.title}" consists of camera-scanned images/photos without selectable digital text (e.g. CamScanner). ResearchLens AI cannot search inside flattened photo pixels without OCR preprocessing. Please deselect it and choose a digital PDF with selectable text (such as "I MID EXAMINATION DLCO" or sample papers).`,
            sources: [],
            citations: [],
            insufficientEvidence: true,
            modelUsed: null,
            warning: 'Scanned image PDF selected. OCR required.'
          });
        }
      }

      return res.json({
        query: userQuery,
        answer: 'You have not uploaded any readable research documents yet, or none were selected. Please upload PDF papers to begin evidence-based Q&A.',
        sources: [],
        citations: [],
        insufficientEvidence: true,
        modelUsed: null
      });
    }

    // Retrieve relevant passages via BM25 ranking with adaptive threshold
    const retrieval = retrieveRelevantPassages(candidateChunks, userQuery, 8, 0.1);

    // Call Gemini with grounded passages
    const aiResult = await answerQuestionWithEvidence(userQuery, retrieval.passages);

    // Persist research query
    try {
      await db.query(
        'INSERT INTO research_history (user_id, question, answer, sources, document_ids) VALUES ($1, $2, $3, $4, $5)',
        [
          req.user.id,
          userQuery,
          aiResult.answer,
          JSON.stringify(aiResult.sources || []),
          JSON.stringify(documentIds || [])
        ]
      );
    } catch (historyErr) {
      console.warn('Could not record research history:', historyErr.message);
    }

    res.json({
      query: userQuery,
      answer: aiResult.answer,
      synthesisSummary: aiResult.synthesisSummary,
      sources: aiResult.sources || [],
      citations: aiResult.citations || [],
      insufficientEvidence: aiResult.insufficientEvidence,
      modelUsed: aiResult.modelUsed,
      warning: aiResult.error ? aiResult.message : undefined
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/research/compare
 * Multi-document comparison matrix
 */
export async function comparePapers(req, res, next) {
  try {
    const validated = comparePapersSchema.parse(req.body);
    const { documentIds } = validated;

    const docsWithChunks = [];
    for (const docId of documentIds) {
      const docResult = await db.query(
        'SELECT id, title, original_name, page_count FROM documents WHERE id = $1 AND user_id = $2',
        [docId, req.user.id]
      );

      if (docResult.rows && docResult.rows.length > 0) {
        const doc = docResult.rows[0];
        const chunksResult = await db.query(
          'SELECT page_number, chunk_text FROM chunks WHERE document_id = $1 ORDER BY chunk_index ASC LIMIT 10',
          [docId]
        );
        docsWithChunks.push({
          ...doc,
          chunks: chunksResult.rows || []
        });
      }
    }

    if (docsWithChunks.length < 2) {
      return res.status(400).json({
        error: 'Insufficient valid documents',
        message: 'Please select at least two of your uploaded documents to compare.'
      });
    }

    const comparisonResult = await compareDocuments(docsWithChunks);
    res.json(comparisonResult);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/research/synthesize
 * Knowledge discovery and concept graph extraction
 */
export async function synthesizeResearch(req, res, next) {
  try {
    const validated = synthesizeSchema.parse(req.body);
    const { documentIds } = validated;

    let docsResult = await db.query(
      'SELECT id, title, original_name, page_count FROM documents WHERE user_id = $1',
      [req.user.id]
    );

    let docs = docsResult.rows || [];
    if (documentIds && Array.isArray(documentIds) && documentIds.length > 0) {
      const allowedSet = new Set(documentIds);
      docs = docs.filter(d => allowedSet.has(d.id));
    }

    if (docs.length === 0) {
      return res.status(400).json({
        error: 'No documents available',
        message: 'Upload at least one research paper to generate a knowledge discovery synthesis.'
      });
    }

    const docsWithChunks = [];
    for (const doc of docs.slice(0, 5)) {
      const chunksResult = await db.query(
        'SELECT page_number, chunk_text FROM chunks WHERE document_id = $1 ORDER BY chunk_index ASC LIMIT 8',
        [doc.id]
      );
      docsWithChunks.push({
        ...doc,
        chunks: chunksResult.rows || []
      });
    }

    const synthesis = await synthesizeKnowledgeGraph(docsWithChunks);
    res.json(synthesis);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/research/history
 * Fetch research inquiry history
 */
export async function getHistory(req, res, next) {
  try {
    const result = await db.query(
      'SELECT id, question, answer, sources, created_at FROM research_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT 30',
      [req.user.id]
    );

    res.json({
      history: result.rows || []
    });
  } catch (err) {
    next(err);
  }
}

export default {
  getDocuments,
  uploadDocuments,
  deleteDocument,
  askQuestion,
  comparePapers,
  synthesizeResearch,
  getHistory
};
