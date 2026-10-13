import db from '../src/config/db.js';
import { retrieveRelevantPassages } from '../src/services/retrieval.service.js';
import { answerQuestionWithEvidence } from '../src/services/gemini.service.js';

async function test() {
  await db.initDb();
  const userId = '5550bc4f-aec7-44da-9c05-c0f061dc0d1e';
  const chunksRes = await db.query(
    'SELECT c.id, c.document_id, c.page_number, c.chunk_index, c.chunk_text, c.token_count, d.title as document_title, d.original_name FROM chunks c JOIN documents d ON c.document_id = d.id WHERE d.user_id = $1',
    [userId]
  );

  console.log(`Candidate chunks count: ${chunksRes.rows.length}`);
  
  const testQueries = [
    'what is the first question',
    'explain SR flip flop',
    'what is decoder',
    'java inheritance',
    'unit 1 java notes',
    'what is in this document'
  ];

  for (const q of testQueries) {
    const retrieval = retrieveRelevantPassages(chunksRes.rows, q);
    console.log(`\nQuery: "${q}" -> Retrieved: ${retrieval.passages.length} passages (hasSufficientEvidence: ${retrieval.hasSufficientEvidence})`);
    if (retrieval.passages.length > 0) {
      console.log(`  Top score: ${retrieval.topScore}`);
      console.log(`  Top snippet: ${retrieval.passages[0].chunkText.substring(0, 90)}...`);
    }

    try {
      const answerRes = await answerQuestionWithEvidence(q, retrieval.passages);
      console.log(`  Model used: ${answerRes.modelUsed}`);
      console.log(`  Insufficient evidence flag: ${answerRes.insufficientEvidence}`);
      console.log(`  Answer prefix: ${answerRes.answer.substring(0, 100).replace(/\n/g, ' ')}...`);
    } catch (e) {
      console.error(`  ERROR during answer generation: ${e.message}`);
    }
  }

  process.exit(0);
}

test().catch(err => {
  console.error(err);
  process.exit(1);
});
