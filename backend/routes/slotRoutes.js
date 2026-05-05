const express = require('express');
const { createSlot, getMySlots, deleteSlot, cancelSlot } = require('../controllers/slotController');
const { validate } = require('../middleware/validate');
const { createSlotValidation } = require('../validators/slotValidators');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);
router.use(authorizeRoles('faculty'));

router.post('/', createSlotValidation, validate, createSlot);
router.get('/my', getMySlots);
router.delete('/:id', deleteSlot);
router.patch('/:id/cancel', cancelSlot);

module.exports = router;
