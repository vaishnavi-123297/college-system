const User = require('../models/User');

async function seed() {
  await User.deleteMany({});
  await User.create({ name: 'Professor P1', email: 'prof1@example.com', password: 'password', role: 'professor', availability: [] });
  await User.create({ name: 'Student A1', email: 'a1@example.com', password: 'password', role: 'student' });
  await User.create({ name: 'Student A2', email: 'a2@example.com', password: 'password', role: 'student' });
  console.log('seed done');
}

module.exports = seed;
