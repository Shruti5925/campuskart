const axios = require('axios');

async function testEndpoints() {
    const baseURL = 'http://localhost:5001/api/auth';

    // Test Signup (Expect 201 or 400 or 500, but NOT 404)
    try {
        console.log("Testing POST /signup...");
        const res = await axios.post(`${baseURL}/signup`, {
            fullName: "TestUser",
            email: "testuniq" + Date.now() + "@example.com",
            password: "password123"
        });
        console.log("Signup Response:", res.status, res.data);
    } catch (err) {
        console.log("Signup Error:", err.response ? err.response.status : err.code, err.response ? err.response.data : err.message);
    }

    // Test Login (Expect 400 or 200)
    try {
        console.log("Testing POST /login...");
        const res = await axios.post(`${baseURL}/login`, {
            email: "nonexistent@example.com",
            password: "password"
        });
        console.log("Login Response:", res.status, res.data);
    } catch (err) {
        console.log("Login Error:", err.response ? err.response.status : err.code, err.response ? err.response.data : err.message);
    }
}

testEndpoints();
