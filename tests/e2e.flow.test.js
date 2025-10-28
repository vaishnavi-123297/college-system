// tests/e2e.flow.test.js
// tests/e2e.flow.test.js (top of file)
require('dotenv').config();                         // load .env if present
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
let mongod;
const app = require('../src/app');
const User = require('../src/models/User');
const Appointment = require('../src/models/Appointment');

jest.setTimeout(20000);

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  await User.deleteMany({});
  await Appointment.deleteMany({});
});

async function registerAndLogin(name, email, password, role) {
  // register
  await request(app).post('/api/auth/register').send({ name, email, password, role });
  // login
  const res = await request(app).post('/api/auth/login').send({ email, password });
  return res.body.token;
}

test('Full user flow: professor posts availability, students book, professor cancels, student sees no pending', async () => {
  // 1. Create users & tokens
  const profToken = await registerAndLogin('Professor P1', 'prof1@example.com', 'password', 'professor');
  const a1Token = await registerAndLogin('Student A1', 'a1@example.com', 'password', 'student');
  const a2Token = await registerAndLogin('Student A2', 'a2@example.com', 'password', 'student');

  // 2. Professor posts availability (two distinct future times)
  const t1 = new Date(Date.now() + 3600 * 1000).toISOString(); // +1 hour
  const t2 = new Date(Date.now() + 7200 * 1000).toISOString(); // +2 hours
  await request(app)
    .post('/api/professors/availability')
    .set('Authorization', `Bearer ${profToken}`)
    .send({ slots: [t1, t2] })
    .expect(200);

  // 3. Student A1 views available slots for professor
  const prof = await User.findOne({ email: 'prof1@example.com' });
  let res = await request(app).get(`/api/professors/${prof._id}/slots`).expect(200);
  expect(res.body.slots).toEqual(expect.arrayContaining([t1, t2]));

  // 4. Student A1 books appointment for t1
  res = await request(app)
    .post('/api/appointments/book')
    .set('Authorization', `Bearer ${a1Token}`)
    .send({ professorId: prof._id, time: t1 })
    .expect(200);
  const appA1 = res.body.appointment;
  expect(appA1).toHaveProperty('status', 'booked');

  // 5. Student A2 books appointment for t2
  res = await request(app)
    .post('/api/appointments/book')
    .set('Authorization', `Bearer ${a2Token}`)
    .send({ professorId: prof._id, time: t2 })
    .expect(200);
  const appA2 = res.body.appointment;
  expect(appA2).toHaveProperty('status', 'booked');

  // 6. Professor cancels appointment with Student A1
  await request(app)
    .post(`/api/professors/cancel-appointment/${appA1._id}`)
    .set('Authorization', `Bearer ${profToken}`)
    .expect(200);

  // 7. Student A1 checks their appointments and should see appointment with status 'cancelled'
  res = await request(app)
    .get('/api/appointments/my')
    .set('Authorization', `Bearer ${a1Token}`)
    .expect(200);
  expect(res.body.appointments.length).toBeGreaterThanOrEqual(1);
  // ensure no 'booked' appointments remain for A1
  const pending = res.body.appointments.filter(a => a.status === 'booked');
  expect(pending.length).toBe(0);
});
