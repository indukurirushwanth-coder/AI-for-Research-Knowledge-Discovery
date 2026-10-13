import pg from 'pg';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let pool = null;
let dbMode = 'uninitialized';
let localData = {
  users: [],
  documents: [],
  chunks: [],
  research_history: []
};

const localDbDir = path.resolve(__dirname, '../../data');
const localDbPath = path.join(localDbDir, 'local_db.json');

// Helper to persist local JSON store
function saveLocalDb() {
  try {
    if (!fs.existsSync(localDbDir)) {
      fs.mkdirSync(localDbDir, { recursive: true });
    }
    fs.writeFileSync(localDbPath, JSON.stringify(localData, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save local database:', err.message);
  }
}

// Helper to load local JSON store
function loadLocalDb() {
  try {
    if (fs.existsSync(localDbPath)) {
      const raw = fs.readFileSync(localDbPath, 'utf8');
      localData = JSON.parse(raw);
    } else {
      saveLocalDb();
    }
  } catch (err) {
    console.warn('Initializing empty local database:', err.message);
    saveLocalDb();
  }
}

// Initial load on module evaluation
loadLocalDb();

/**
 * Initialize database connection and schemas
 */
export async function initDb() {
  const connectionString = process.env.DATABASE_URL;

  if (connectionString && connectionString.startsWith('postgres')) {
    try {
      console.log('Connecting to Supabase PostgreSQL database...');
      pool = new Pool({
        connectionString,
        ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false }
      });

      const client = await pool.connect();
      console.log('PostgreSQL / Supabase connection established successfully');

      // Execute schema migrations
      const schemaPath = path.resolve(__dirname, '../../database/schema.sql');
      if (fs.existsSync(schemaPath)) {
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        await client.query(schemaSql);
        console.log('PostgreSQL database schema verified & migrated');
      }

      client.release();
      dbMode = 'postgres';
      return { status: 'connected', mode: 'postgres' };
    } catch (err) {
      console.warn('PostgreSQL connection failed:', err.message);
      console.warn('Falling back to local persistent database for development mode.');
      pool = null;
    }
  }

  // Fallback to local persistence
  dbMode = 'local_persistence';
  loadLocalDb();
  console.log('Running with local persistence database (Supabase DATABASE_URL not set or fallback)');
  return { status: 'connected', mode: 'local_persistence' };
}

/**
 * Parameterized Query Executor supporting both PostgreSQL and Local Persistence
 */
export async function query(text, params = []) {
  if (dbMode === 'postgres' && pool) {
    return pool.query(text, params);
  }

  return simulateLocalQuery(text, params);
}

function simulateLocalQuery(text, params) {
  const lower = text.trim().toLowerCase();

  // 1. SELECT user by email
  if (lower.startsWith('select') && lower.includes('from users') && lower.includes('email =')) {
    const email = params[0]?.toLowerCase();
    const user = localData.users.find(u => u.email.toLowerCase() === email);
    return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
  }

  // 2. SELECT user by id
  if (lower.startsWith('select') && lower.includes('from users') && lower.includes('id =')) {
    const id = params[0];
    const user = localData.users.find(u => u.id === id);
    return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
  }

  // 3. INSERT user
  if (lower.startsWith('insert into users')) {
    const id = crypto.randomUUID();
    const [email, password_hash, full_name] = params;
    const user = {
      id,
      email: email.toLowerCase(),
      password_hash,
      full_name: full_name || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    localData.users.push(user);
    saveLocalDb();
    return { rows: [user], rowCount: 1 };
  }

  // 4. SELECT documents by user_id
  if (lower.startsWith('select') && lower.includes('from documents') && lower.includes('user_id =') && !lower.includes('where id =')) {
    const userId = params[0];
    const docs = localData.documents
      .filter(d => d.user_id === userId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return { rows: docs, rowCount: docs.length };
  }

  // 5. SELECT single document by id & user_id
  if (lower.startsWith('select') && lower.includes('from documents') && lower.includes('where id =') && lower.includes('user_id =')) {
    const [docId, userId] = params;
    const doc = localData.documents.find(d => d.id === docId && d.user_id === userId);
    return { rows: doc ? [doc] : [], rowCount: doc ? 1 : 0 };
  }

  // 5b. SELECT documents WHERE id = ANY($1)
  if (lower.startsWith('select') && lower.includes('from documents') && lower.includes('id = any(')) {
    const ids = Array.isArray(params[0]) ? params[0] : [params[0]];
    const userId = params[1];
    let docs = localData.documents.filter(d => ids.includes(d.id));
    if (userId) {
      docs = docs.filter(d => d.user_id === userId);
    }
    return { rows: docs, rowCount: docs.length };
  }

  // 6. SELECT single document by id
  if (lower.startsWith('select') && lower.includes('from documents') && lower.includes('where id =')) {
    const [docId] = params;
    const doc = localData.documents.find(d => d.id === docId);
    return { rows: doc ? [doc] : [], rowCount: doc ? 1 : 0 };
  }

  // 7. INSERT document
  if (lower.startsWith('insert into documents')) {
    const id = crypto.randomUUID();
    const [user_id, title, original_name, file_size, page_count, chunk_count, status, status_message] = params;
    const doc = {
      id,
      user_id,
      title,
      original_name,
      file_size,
      page_count: page_count || 0,
      chunk_count: chunk_count || 0,
      status: status || 'processed',
      status_message: status_message || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    localData.documents.push(doc);
    saveLocalDb();
    return { rows: [doc], rowCount: 1 };
  }

  // 8. DELETE document
  if (lower.startsWith('delete from documents')) {
    const [docId, userId] = params;
    const initialLen = localData.documents.length;
    localData.documents = localData.documents.filter(d => !(d.id === docId && d.user_id === userId));
    // Cascade delete chunks
    localData.chunks = localData.chunks.filter(c => c.document_id !== docId);
    saveLocalDb();
    const deletedCount = initialLen - localData.documents.length;
    return { rows: [], rowCount: deletedCount };
  }

  // 9. INSERT chunk
  if (lower.startsWith('insert into chunks')) {
    const id = crypto.randomUUID();
    const [document_id, page_number, chunk_index, chunk_text, token_count] = params;
    const chunk = {
      id,
      document_id,
      page_number,
      chunk_index,
      chunk_text,
      token_count: token_count || 0,
      created_at: new Date().toISOString()
    };
    localData.chunks.push(chunk);
    saveLocalDb();
    return { rows: [chunk], rowCount: 1 };
  }

  // 10. SELECT chunks for document_id
  if (lower.startsWith('select') && lower.includes('from chunks') && lower.includes('where document_id =')) {
    const docId = params[0];
    const chunks = localData.chunks
      .filter(c => c.document_id === docId)
      .sort((a, b) => a.chunk_index - b.chunk_index);
    return { rows: chunks, rowCount: chunks.length };
  }

  // 11. SELECT chunks by user's documents
  if (lower.startsWith('select') && lower.includes('from chunks') && lower.includes('join documents')) {
    const userId = params[0];
    const userDocIds = localData.documents.filter(d => d.user_id === userId).map(d => d.id);
    const chunksWithDoc = localData.chunks
      .filter(c => userDocIds.includes(c.document_id))
      .map(c => {
        const doc = localData.documents.find(d => d.id === c.document_id);
        return {
          ...c,
          document_title: doc ? doc.title : 'Untitled',
          original_name: doc ? doc.original_name : ''
        };
      });
    return { rows: chunksWithDoc, rowCount: chunksWithDoc.length };
  }

  // 12. INSERT research_history
  if (lower.startsWith('insert into research_history')) {
    const id = crypto.randomUUID();
    const [user_id, question, answer, sources, document_ids] = params;
    const historyItem = {
      id,
      user_id,
      question,
      answer,
      sources: typeof sources === 'string' ? JSON.parse(sources) : sources,
      document_ids: typeof document_ids === 'string' ? JSON.parse(document_ids) : document_ids,
      created_at: new Date().toISOString()
    };
    localData.research_history.push(historyItem);
    saveLocalDb();
    return { rows: [historyItem], rowCount: 1 };
  }

  // 13. SELECT research_history by user_id
  if (lower.startsWith('select') && lower.includes('from research_history') && lower.includes('user_id =')) {
    const userId = params[0];
    const history = localData.research_history
      .filter(h => h.user_id === userId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return { rows: history, rowCount: history.length };
  }

  return { rows: [], rowCount: 0 };
}

export function getDbStatus() {
  return {
    mode: dbMode,
    isPostgres: dbMode === 'postgres',
    isLocal: dbMode === 'local_persistence'
  };
}

export default {
  initDb,
  query,
  getDbStatus
};
