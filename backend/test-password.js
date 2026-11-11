const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const testPassword = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  
  const hashedPassword = '$2a$10$vMlS87DhEbeO6KU7CuBMjOBHaLeQhtOIq2b7CsjnzxPnLxkj8dquO';
  const enteredPassword = 'admin123'; // Try the password you use
  
  const isMatch = await bcrypt.compare(enteredPassword, hashedPassword);
  console.log(`Password match: ${isMatch}`);
  
  // If false, try common passwords
  const commonPasswords = ['admin', 'password', 'admin123', 'Admin123', '123456'];
  for (const pwd of commonPasswords) {
    const match = await bcrypt.compare(pwd, hashedPassword);
    console.log(`  "${pwd}": ${match}`);
  }
  
  await mongoose.disconnect();
};

testPassword();