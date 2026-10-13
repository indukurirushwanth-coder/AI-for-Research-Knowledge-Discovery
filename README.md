# 🔬 ResearchLens AI
> **AI for Research & Knowledge Discovery** | Hackathon MVP  
> Grounded Multi-PDF Academic Synthesis, Citation-Backed Evidence Retrieval & Cross-Paper Comparative Analysis

[![Node Version](https://img.shields.io/badge/Node.js-v18%2B%20%7C%20v20%2B%20%7C%20v26-green)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev/)
[![Gemini SDK](https://img.shields.io/badge/%40google%2Fgenai-v2.28-purple)](https://www.npmjs.com/package/@google/genai)
[![License](https://img.shields.io/badge/License-MIT-slate)](LICENSE)

---

## 🌟 Executive Summary

Researchers, students, and professionals waste hours manually searching multiple research papers, cross-referencing conflicting findings, identifying research gaps, and verifying whether AI-generated answers are truly supported by evidence.

**ResearchLens AI** solves this problem by enabling users to upload multiple research PDFs, ask natural-language inquiries across their document vault, inspect supporting evidence with exact document and page references, compare papers across structured dimensions, and identify agreements and disagreements without LLM hallucinations.

---

## 🏗️ Architecture & Project Structure

The project is strictly separated into two standalone applications inside one root repository:

```
HACKATHON/
├── backend/                             # Express REST API (ES Modules)
│   ├── database/
│   │   └── schema.sql                   # Supabase PostgreSQL schema with indexes & cascades
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                    # Dual-engine DB (Supabase PostgreSQL + Local Dev fallback)
│   │   ├── controllers/
│   │   │   ├── auth.controller.js       # Zod validation, bcrypt hashing, JWT issuance
│   │   │   └── research.controller.js   # PDF upload, chunking, BM25 retrieval, Q&A, compare
│   │   ├── middleware/
│   │   │   ├── auth.js                  # JWT Bearer verification & user-specific authorization
│   │   │   └── errorHandler.js          # Centralized error handler (safe client responses)
│   │   ├── routes/
│   │   │   ├── auth.routes.js           # /api/auth routes
│   │   │   └── research.routes.js       # /api/research routes
│   │   ├── services/
│   │   │   ├── gemini.service.js        # Official @google/genai SDK integration
│   │   │   ├── pdf.service.js           # pdfjs-dist page extraction & chunking with overlap
│   │   │   └── retrieval.service.js     # BM25 relevance ranking & evidence filtering
│   │   ├── validators/
│   │   │   ├── auth.validator.js        # Zod registration & login schemas
│   │   │   └── research.validator.js    # Zod query & compare schemas
│   │   ├── app.js                       # Express app with Helmet, CORS, and health checks
│   │   └── server.js                    # Server startup and graceful shutdown
│   ├── test/
│   │   ├── api.test.js                  # Unit tests (PDF validation, tokenization, BM25, chunking)
│   │   └── integration.test.js          # E2E tests (auth, upload, retrieval, deletion)
│   ├── .env.example                     # Backend env template
│   └── package.json
│
├── frontend/                            # React + Vite Single Page Application
│   ├── src/
│   │   ├── components/
│   │   │   ├── AnswerPanel.jsx          # Grounded synthesis with clickable [Source N] tags
│   │   │   ├── ComparisonPanel.jsx      # Dimensional matrix (objectives, methods, gaps)
│   │   │   ├── DocumentList.jsx         # Indexed paper vault with deletion & scope filters
│   │   │   ├── DocumentUpload.jsx       # Multi-PDF drag & drop with 1-click sample loader
│   │   │   ├── Navbar.jsx               # System health status & user profile navigation
│   │   │   ├── QuestionForm.jsx         # Research query form with suggestion chips
│   │   │   ├── Sidebar.jsx              # Responsive navigation & vault metrics
│   │   │   └── SourceCitation.jsx       # Evidence card with page number & quote excerpt
│   │   ├── context/
│   │   │   └── AuthContext.jsx          # React Auth Context (session persistence & logout)
│   │   ├── pages/
│   │   │   ├── ComparePapers.jsx        # Cross-paper comparative analysis workspace
│   │   │   ├── Dashboard.jsx            # Research workspace, metrics, and document library
│   │   │   ├── Login.jsx                # Login screen with 1-click sample credentials
│   │   │   ├── Register.jsx             # User registration with password validation
│   │   │   └── Research.jsx             # Evidence-grounded research inquiry chat
│   │   ├── services/
│   │   │   └── api.js                   # Central Axios client with JWT interceptor
│   │   ├── App.jsx                      # Protected routes & layout wrapper
│   │   ├── index.css                    # Tailwind CSS v4 styling & dark theme
│   │   └── main.jsx
│   ├── .env.example                     # Frontend env template
│   └── package.json
│
├── samples/                             # Authentic sample research PDFs for immediate testing
│   ├── Quantum_Computing_Cryptographic_Breakthroughs.pdf
│   └── Post_Quantum_Lattice_Cryptography_Standards.pdf
│
├── .gitignore
├── HACKATHON_SUBMISSION.md
└── README.md
```

---

## ⚡ Core Features

1. **User Authentication & Authorization**:
   - Secure registration and login with bcrypt password hashing (10 salt rounds).
   - Signed JSON Web Tokens (JWT) with session expiration.
   - Strict per-user document isolation: users can only inspect, query, or delete their own papers.

2. **Multi-PDF Ingestion & Page-Aware Chunking**:
   - Accepts multiple PDFs simultaneously (up to 10 MB per file).
   - PDF magic bytes validation (`%PDF-`) rejects corrupt or disguised files.
   - Page-by-page text extraction via `pdfjs-dist` preserves exact physical page numbers.
   - Semantic sentence/paragraph chunking with overlapping boundaries preserves cross-sentence context.
   - Detects scanned PDFs without selectable text and alerts that OCR is required.

3. **Evidence-Grounded Research Q&A**:
   - Natural-language queries across all papers or a selected subset.
   - Multi-factor BM25 passage retrieval ranks chunks by term frequency, inverse document frequency, and exact phrase match.
   - Controlled bounded context packaging sends only top relevant passages to Gemini.
   - Strict system instructions instruct Gemini to answer **only** from retrieved evidence.
   - Output citations map directly to verified page numbers and document titles.
   - Handles insufficient evidence gracefully: admits when evidence does not substantiate an answer.

4. **Multi-Paper Comparative Analysis**:
   - Compares 2 or more uploaded papers side-by-side.
   - Extracts: Objective, Methodology, Key Findings, Limitations, and Conclusions.
   - Identifies verified Convergences (Agreements) and empirical Divergences (Disagreements).
   - Uncovers research gaps and future research questions (labeled as AI-generated suggestions).

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, React Router 7, Tailwind CSS v4, Axios, Lucide React |
| **Backend** | Node.js, Express 4, `@google/genai` (Official Google Gemini SDK), `pdfjs-dist`, `pdf-lib` |
| **Security** | bcryptjs, jsonwebtoken, Zod, Helmet, CORS, Multer memory storage |
| **Database** | Supabase PostgreSQL (`pg` pooler) with zero-friction Local Dev fallback |

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- Node.js v18+ (tested on Node v20 and v26)
- npm v9+

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Configure environment variables
# Copy template and add your credentials (optional)
cp .env.example .env

# Run tests to verify setup
npm test

# Start the backend server
npm run dev
```
The backend will run on `http://localhost:5000` with the health check at `http://localhost:5000/api/health`.

### 3. Frontend Setup
```bash
# In a new terminal, navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the Vite development server
npm run dev
```
The frontend will open on `http://localhost:5173`.

---

## 🔑 Environment Variables

### Backend (`backend/.env`):
```env
PORT=5000
CLIENT_URL=http://localhost:5173
DATABASE_URL=postgresql://postgres:password@db.supabase.co:5432/postgres
JWT_SECRET=your_jwt_secret_key_change_in_production
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
```
> **Note on Database**: If `DATABASE_URL` is omitted, ResearchLens AI automatically operates in local persistent development mode, allowing instant zero-friction local testing without provisioning Supabase first.
> **Note on Gemini Key**: If `GEMINI_API_KEY` is not provided, the API safely handles requests by returning informative notifications without crashing.

### Frontend (`frontend/.env`):
```env
# Optional: defaults to /api proxy in development
VITE_API_URL=http://localhost:5000/api
```

---

## 📡 API Endpoint Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/health` | No | System health check (DB mode, Gemini status, uptime) |
| `POST` | `/api/auth/register` | No | Register new user (email, password, fullName) |
| `POST` | `/api/auth/login` | No | Authenticate user and receive JWT |
| `GET` | `/api/auth/me` | Yes | Get authenticated user profile |
| `GET` | `/api/research/documents` | Yes | List user's uploaded documents |
| `POST` | `/api/research/upload` | Yes | Upload up to 5 PDFs (extracts pages & chunks) |
| `DELETE` | `/api/research/documents/:id` | Yes | Delete document and cascade chunks |
| `POST` | `/api/research/ask` | Yes | Evidence-grounded Q&A with citations |
| `POST` | `/api/research/compare` | Yes | Compare 2+ papers across dimensions |
| `POST` | `/api/research/synthesize` | Yes | Knowledge discovery & theme synthesis |
| `GET` | `/api/research/history` | Yes | Fetch past research inquiries |

---

## 🧪 Automated Testing

ResearchLens AI includes both unit and end-to-end integration tests:

```bash
cd backend
npm test
```

### Verified Test Suite:
- `validatePdfBuffer`: Rejects empty files and invalid magic bytes (`%PDF-`).
- `tokenize`: Normalizes terms and eliminates academic stopwords.
- `retrieveRelevantPassages`: Ranks candidate chunks using BM25 scoring with phrase boosting.
- `chunkPageText`: Splits multi-page text into overlapping segments with page metadata.
- `GET /api/health`: Validates healthy API status and configuration.
- `POST /api/auth/register` & `login`: Verifies bcrypt password hashing and signed JWT issuance.
- `GET /api/research/documents`: Enforces 401 unauthorized protection and user isolation.
- `POST /api/research/upload`: Ingests binary PDF, extracts pages via `pdfjs-dist`, and persists chunks.
- `POST /api/research/ask`: Bounded evidence retrieval and citation tag validation.
- `DELETE /api/research/documents/:id`: Verifies cascading chunk deletion.

---

## 🚢 Deployment Guide

### Frontend on Vercel / Netlify
1. Connect your GitHub repository.
2. Set Root Directory to `frontend`.
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Set Environment Variable: `VITE_API_URL=https://your-backend.onrender.com/api`

### Backend on Render
1. Connect your GitHub repository.
2. Set Root Directory to `backend`.
3. Build Command: `npm install`
4. Start Command: `node src/server.js`
5. Set Environment Variables:
   - `PORT=5000`
   - `CLIENT_URL=https://your-frontend.vercel.app`
   - `DATABASE_URL=your_supabase_postgres_connection_string`
   - `JWT_SECRET=your_jwt_secret`
   - `GEMINI_API_KEY=your_gemini_api_key`
   - `GEMINI_MODEL=gemini-2.5-flash`

### Database on Supabase PostgreSQL
1. Create a project at [supabase.com](https://supabase.com/).
2. Open the SQL Editor and run `backend/database/schema.sql`.
3. Copy the Connection String from Project Settings > Database > URI (use transaction pooler mode).
4. Paste it as `DATABASE_URL` in your backend environment variables.

---

## ⚖️ Limitations & Ethical Considerations

- **Scanned Documents**: ResearchLens AI extracts selectable text from PDF documents. Documents consisting entirely of scanned raster images require OCR preprocessing before indexing.
- **Language Scope**: Retrieval tokenization is optimized for English-language scientific papers.
- **AI Verification Disclosure**: ResearchLens AI strictly grounds model responses in retrieved passages and admits when evidence is missing. However, LLM outputs should always be reviewed alongside the cited original page excerpts before making clinical, legal, or safety-critical decisions.
