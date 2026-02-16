async function testEndpoints() {
    const baseURL = 'http://localhost:5001/api';

    // Test Signup
    try {
        console.log("Testing POST /auth/signup...");
        const res = await fetch(`${baseURL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fullName: "TestUser",
                email: "testdebug" + Date.now() + "@example.com",
                password: "password123"
            })
        });
        console.log(`Signup Response: ${res.status} ${res.statusText}`);
        const txt = await res.text();
        console.log("Body:", txt.substring(0, 100));
    } catch (err) {
        console.log("Signup Error:", err.message);
    }

    // Test Test Route
    try {
        console.log("\nTesting GET /auth/test...");
        const res = await fetch(`${baseURL}/auth/test`);
        console.log(`Test Response: ${res.status} ${res.statusText}`);
        const txt = await res.text();
        console.log("Body:", txt);
    } catch (err) {
        console.log("Test Error:", err.message);
    }
}

testEndpoints();
