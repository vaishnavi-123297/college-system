const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  professor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  time: { type: Date, required: true },
  status: { type: String, enum: ['booked','cancelled'], default: 'booked' }
}, { timestamps: true });

// optional: unique index to avoid duplicate bookings at same time for same professor
AppointmentSchema.index({ professor: 1, time: 1, status: 1 }, { unique: false });

module.exports = mongoose.model('Appointment', AppointmentSchema);
