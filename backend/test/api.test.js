import assert from 'assert';
import { validatePdfBuffer, extractPdfPages, chunkPageText, processPdf } from '../src/services/pdf.service.js';
import { retrieveRelevantPassages, tokenize } from '../src/services/retrieval.service.js';
import db from '../src/config/db.js';

async function runTests() {
  console.log('🧪 Starting ResearchLens AI Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name} ->`, err.message);
      failed++;
    }
  }

  async function asyncTest(name, fn) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name} ->`, err.message);
      failed++;
    }
  }

  // 1. PDF Validation
  test('PDF validation rejects empty buffer', () => {
    assert.throws(() => validatePdfBuffer(Buffer.alloc(0), 'empty.pdf'), /empty/);
  });

  test('PDF validation rejects non-PDF magic bytes', () => {
    assert.throws(() => validatePdfBuffer(Buffer.from('NOT_A_PDF_FILE'), 'test.txt'), /not a valid PDF/);
  });

  // 2. Tokenizer & Stopword removal
  test('Tokenizer removes stop words and normalizes terms', () => {
    const tokens = tokenize('What are the quantum algorithms and fault tolerance methods?');
    assert.ok(tokens.includes('quantum'));
    assert.ok(tokens.includes('algorithm'));
    assert.ok(tokens.includes('fault'));
    assert.ok(tokens.includes('tolerance'));
    assert.ok(!tokens.includes('the'));
    assert.ok(!tokens.includes('what'));
    assert.ok(!tokens.includes('and'));
  });

  // 3. BM25 Retrieval Engine
  test('BM25 retrieval ranks relevant chunks highest', () => {
    const mockChunks = [
      {
        id: '1',
        document_id: 'doc1',
        document_title: 'Quantum Shor Accelerations',
        original_name: 'quantum.pdf',
        page_number: 1,
        chunk_index: 0,
        chunk_text: 'Shor algorithm modular exponentiation achieves a 42% reduction in T-gate overhead on rotated planar surface codes.'
      },
      {
        id: '2',
        document_id: 'doc1',
        document_title: 'Quantum Shor Accelerations',
        original_name: 'quantum.pdf',
        page_number: 2,
        chunk_index: 1,
        chunk_text: 'Cryogenic dilution refrigerators operating at 15 millikelvin house planar superconducting circuits.'
      },
      {
        id: '3',
        document_id: 'doc2',
        document_title: 'Lattice Cryptography Standards',
        original_name: 'lattice.pdf',
        page_number: 1,
        chunk_index: 0,
        chunk_text: 'CRYSTALS-Kyber key encapsulation benchmark on Intel Xeon and ARM Cortex-M4 architectures.'
      }
    ];

    const result = retrieveRelevantPassages(mockChunks, 'Shor algorithm T-gate overhead', 3);
    assert.strictEqual(result.hasSufficientEvidence, true);
    assert.ok(result.passages.length > 0);
    assert.strictEqual(result.passages[0].pageNumber, 1);
    assert.ok(result.passages[0].citationTag.includes('Source 1'));
  });

  test('BM25 retrieval reports insufficient evidence for irrelevant query', () => {
    const mockChunks = [
      {
        id: '1',
        document_id: 'doc1',
        document_title: 'Quantum Shor Accelerations',
        original_name: 'quantum.pdf',
        page_number: 1,
        chunk_index: 0,
        chunk_text: 'Superconducting transmon qubits and planar surface code error correction.'
      }
    ];

    const result = retrieveRelevantPassages(mockChunks, 'photosynthesis chlorophyll cellular respiration', 3);
    assert.strictEqual(result.hasSufficientEvidence, false);
    assert.strictEqual(result.passages.length, 0);
  });

  // 4. Chunking Engine
  test('Chunker splits text into overlapping segments with page metadata', () => {
    const longText = 'Sentence one describes quantum mechanics. Sentence two describes surface codes. Sentence three details error correction. Sentence four elaborates on logical qubits. Sentence five discusses cryogenic refrigerators. Sentence six explains physical qubits.';
    const chunks = chunkPageText(longText, 4, 0);
    assert.ok(chunks.length >= 1);
    assert.strictEqual(chunks[0].page_number, 4);
    assert.ok(chunks[0].chunk_text.length > 0);
  });

  // 5. Database Layer
  await asyncTest('Database initializes and executes parameterized query', async () => {
    await db.initDb();
    const res = await db.query('SELECT * FROM users WHERE email = $1', ['nonexistent@example.com']);
    assert.ok(Array.isArray(res.rows));
    assert.strictEqual(res.rowCount, 0);
  });

  console.log(`\n===========================================`);
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`===========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
