// routes/school.js
import express from 'express';
import { authenticateToken, adminOnly } from '../middleware/auth.js';
import {
  getAllSchools,
  getSchoolById,
  createSchool,
  updateSchool,
  deleteSchool,
} from '../controllers/schoolController.js';

const router = express.Router();

router.get('/', authenticateToken, getAllSchools);
router.get('/:id', authenticateToken, getSchoolById);
router.post('/', authenticateToken, adminOnly, createSchool);
router.put('/:id', authenticateToken, adminOnly, updateSchool);
router.delete('/:id', authenticateToken, adminOnly, deleteSchool);

export default router;