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
                email: "testuniq" + Date.now() + "@example.com",
                password: "password123"
            })
        });
        console.log(`Signup Response: ${res.status} ${res.statusText}`);
        const txt = await res.text();
        console.log("Body:", txt.substring(0, 100)); // First 100 chars
    } catch (err) {
        console.log("Signup Error:", err.message);
    }

    // Test Products
    try {
        console.log("\nTesting GET /products...");
        const res = await fetch(`${baseURL}/products`);
        console.log(`Products Response: ${res.status} ${res.statusText}`);
        const txt = await res.text();
        console.log("Body:", txt.substring(0, 100));
    } catch (err) {
        console.log("Products Error:", err.message);
    }
}

testEndpoints();
