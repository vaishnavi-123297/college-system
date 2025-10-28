const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Appointment = require('../models/Appointment');
const User = require('../models/User');

// Student books appointment with professor for a time
router.post('/book', auth, async (req, res) => {
  try {
    if (req.user.role !== 'student') return res.status(403).json({ msg: 'Only students' });
    const { professorId, time } = req.body;
    if (!professorId || !time) return res.status(400).json({ msg: 'professorId and time required' });

    const prof = await User.findById(professorId);
    if (!prof || prof.role !== 'professor') return res.status(404).json({ msg: 'Professor not found' });

    // ensure professor posted this slot
    const posted = (prof.availability || []).map(s => new Date(s).toISOString());
    if (!posted.includes(new Date(time).toISOString())) {
      return res.status(400).json({ msg: 'Time not in professor availability' });
    }

    // check existing booked appointment conflict
    const conflict = await Appointment.findOne({ professor: prof._id, time: new Date(time), status: 'booked' });
    if (conflict) return res.status(400).json({ msg: 'Already booked' });

    const appointment = await Appointment.create({
      professor: prof._id,
      student: req.user._id,
      time: new Date(time),
      status: 'booked'
    });

    res.json({ appointment });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Student lists their appointments
router.get('/my', auth, async (req, res) => {
  try {
    const where = {};
    if (req.user.role === 'student') where.student = req.user._id;
    if (req.user.role === 'professor') where.professor = req.user._id;
    const apps = await Appointment.find(where).populate('professor', 'name email').populate('student', 'name email');
    res.json({ appointments: apps });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;
