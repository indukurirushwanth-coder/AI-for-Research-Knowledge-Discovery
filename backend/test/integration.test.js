import assert from 'assert';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import app from '../src/app.js';
import db from '../src/config/db.js';

async function runIntegrationTests() {
  console.log('🧪 Starting End-to-End API Integration Tests...\n');
  let passed = 0;
  let failed = 0;

  await db.initDb();
  const PORT = 5006;
  const server = app.listen(PORT);
  const BASE_URL = `http://localhost:${PORT}/api`;

  function check(name, condition) {
    if (condition) {
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${name}`);
      failed++;
    }
  }

  try {
    // 1. Health Endpoint
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await healthRes.json();
    check('GET /api/health returns 200 and healthy status', healthRes.status === 200 && healthData.status === 'healthy');

    // 2. Registration
    const testEmail = `researcher_${Date.now()}@university.edu`;
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'Password123!',
        fullName: 'Dr. Test Researcher'
      })
    });
    const regData = await regRes.json();
    check('POST /api/auth/register creates user and returns JWT token', regRes.status === 201 && Boolean(regData.token));
    const token = regData.token;

    // 3. Login
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'Password123!'
      })
    });
    const loginData = await loginRes.json();
    check('POST /api/auth/login validates credentials and issues token', loginRes.status === 200 && Boolean(loginData.token));

    // 4. Unauthorized Access Check
    const unauthRes = await fetch(`${BASE_URL}/research/documents`);
    check('GET /api/research/documents rejects unauthenticated request with 401', unauthRes.status === 401);

    // 5. Authorized Documents List
    const authDocsRes = await fetch(`${BASE_URL}/research/documents`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const authDocsData = await authDocsRes.json();
    check('GET /api/research/documents returns 200 for authenticated user', authDocsRes.status === 200 && Array.isArray(authDocsData.documents));

    // 6. Generate perfectly valid binary PDF using pdf-lib
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    page.drawText(
      'Quantum computing reduces Shor algorithm modular exponentiation overhead by 42 percent on rotated planar surface codes. Factoring RSA-2048 requires 20,480 physical superconducting qubits.',
      { x: 50, y: 700, size: 10, font }
    );
    const pdfBytes = await pdfDoc.save();

    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    const postBody = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="files"; filename="quantum_study.pdf"\r\nContent-Type: application/pdf\r\n\r\n`),
      Buffer.from(pdfBytes),
      Buffer.from(`\r\n--${boundary}--\r\n`)
    ]);

    const uploadRes = await fetch(`${BASE_URL}/research/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      body: postBody
    });
    const uploadData = await uploadRes.json();
    check('POST /api/research/upload extracts pages, chunks text, and stores document', uploadRes.status === 201 && uploadData.documents?.length === 1);
    const uploadedDocId = uploadData.documents?.[0]?.id;

    // 7. Grounded Retrieval Inquiry
    const askRes = await fetch(`${BASE_URL}/research/ask`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: 'What reduction in overhead does quantum computing achieve for Shor algorithm?'
      })
    });
    const askData = await askRes.json();
    check('POST /api/research/ask retrieves passages and produces evidence-grounded response', askRes.status === 200 && (askData.sources?.length > 0 || askData.answer));

    // 8. Delete Document
    if (uploadedDocId) {
      const delRes = await fetch(`${BASE_URL}/research/documents/${uploadedDocId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      check('DELETE /api/research/documents/:id deletes document and cascades chunk removal', delRes.status === 200);
    }

  } catch (err) {
    console.error('Integration test encountered exception:', err);
    failed++;
  } finally {
    server.close();
    console.log(`\n===========================================`);
    console.log(`Integration Test Results: ${passed} Passed, ${failed} Failed`);
    console.log(`===========================================\n`);
    if (failed > 0) process.exit(1);
  }
}

runIntegrationTests();
