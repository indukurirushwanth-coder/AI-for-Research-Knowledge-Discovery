import express from 'express';
import multer from 'multer';
import {
  getDocuments,
  uploadDocuments,
  deleteDocument,
  askQuestion,
  comparePapers,
  synthesizeResearch,
  getHistory
} from '../controllers/research.controller.js';
import { authenticate } from '../middleware/auth.js';
import { MAX_FILE_SIZE } from '../services/pdf.service.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 5
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error(`File "${file.originalname}" is not a PDF. Only PDF files are supported.`));
    }
  }
});

// All research routes require JWT authentication
router.use(authenticate);

router.get('/documents', getDocuments);
router.post('/upload', upload.array('files', 5), uploadDocuments);
router.delete('/documents/:id', deleteDocument);
router.post('/ask', askQuestion);
router.post('/compare', comparePapers);
router.post('/synthesize', synthesizeResearch);
router.get('/history', getHistory);

export default router;
