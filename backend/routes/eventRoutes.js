import express from 'express';
import {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  updateEventStatus,
  registerForEvent,
  cancelRegistration,
  checkinParticipant,
  getRegistrations,
  exportRegistrations,
  addGalleryPhoto,
  getGallery,
  approveGalleryPhoto,
  deleteGalleryPhoto
} from '../controllers/eventController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(verifyToken);

// CRUD de Eventos
router.get('/', getEvents);
router.get('/:id', getEventById);
router.post('/', createEvent);
router.put('/:id', updateEvent);
router.delete('/:id', deleteEvent);
router.patch('/:id/status', updateEventStatus);

// Inscrições
router.post('/:id/register', registerForEvent);
router.delete('/:id/register', cancelRegistration);
router.get('/:id/registrations', getRegistrations);
router.get('/:id/registrations/export', exportRegistrations);

// Check-in
router.post('/:id/checkin/:regId', checkinParticipant);

// Galeria (Mural de Memórias)
router.post('/:id/gallery', addGalleryPhoto);
router.get('/:id/gallery', getGallery);
router.patch('/:id/gallery/:photoId/approve', approveGalleryPhoto);
router.delete('/:id/gallery/:photoId', deleteGalleryPhoto);

export default router;
