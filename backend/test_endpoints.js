const axios = require('axios');

const endpoints = [
  'http://localhost:5001/api/products/admin/stats',
  'http://localhost:5001/api/products/admin/pending',
  'http://localhost:5001/api/products/admin/approved',
  'http://localhost:5001/api/products/admin/flagged',
  'http://localhost:5001/api/auth/users',
  'http://localhost:5001/api/activities'
];

const testEndpoints = async () => {
  for (const url of endpoints) {
    try {
      const res = await axios.get(url);
      console.log(`[PASS] ${url} -> ${res.status}`);
    } catch (err) {
      console.log(`[FAIL] ${url} -> ${err.response?.status || err.message}`);
    }
  }
};

testEndpoints();
