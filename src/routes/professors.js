const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Appointment = require('../models/Appointment');
const User = require('../models/User');

// Professor posts availability (array of ISO datetime strings)
router.post('/availability', auth, async (req, res) => {
  try {
    if (req.user.role !== 'professor') return res.status(403).json({ msg: 'Only professors' });
    const { slots } = req.body; // slots: ["2025-10-28T10:00:00.000Z", ...]
    if (!Array.isArray(slots)) return res.status(400).json({ msg: 'slots required' });

    // store availability on professor doc (overwrite)
    await User.findByIdAndUpdate(req.user._id, { $set: { availability: slots } }, { new: true, upsert: true });
    res.json({ msg: 'Availability saved', slots });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Professor cancels an appointment (by appointment id)
router.post('/cancel-appointment/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'professor') return res.status(403).json({ msg: 'Only professors' });
    const appId = req.params.id;
    const appointment = await Appointment.findById(appId);
    if (!appointment) return res.status(404).json({ msg: 'Appointment not found' });
    if (!appointment.professor.equals(req.user._id)) return res.status(403).json({ msg: 'Not your appointment' });

    appointment.status = 'cancelled';
    await appointment.save();
    res.json({ msg: 'Appointment cancelled', appointment });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Get professor available slots (shows professor's posted slots minus already booked ones)
router.get('/:profId/slots', async (req, res) => {
  try {
    const prof = await User.findById(req.params.profId);
    if (!prof) return res.status(404).json({ msg: 'Professor not found' });
    const posted = prof.availability || [];

    // find already booked (status = booked)
    const booked = await Appointment.find({ professor: prof._id, status: 'booked' }).select('time -_id');
    const bookedTimes = booked.map(b => b.time.toISOString());

    // filter out booked from posted
    const free = posted.filter(s => !bookedTimes.includes(new Date(s).toISOString()));
    res.json({ slots: free });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;
