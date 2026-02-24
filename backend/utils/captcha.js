const jwt = require('jsonwebtoken');

/**
 * Generates a simple math-based CAPTCHA and signs the solution.
 */
exports.generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 9) + 1;
    const num2 = Math.floor(Math.random() * 9) + 1;
    const answer = num1 + num2;
    const question = `What is ${num1} + ${num2}?`;

    // Sign the answer with a short expiry (5 minutes)
    const token = jwt.sign(
        { answer: answer.toString() },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '5m' }
    );

    return { question, token };
};

/**
 * Verifies the user's captcha answer against the signed token.
 */
exports.verifyCaptcha = (token, userAnswer) => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        return decoded.answer === userAnswer.toString();
    } catch (err) {
        return false; // Token expired or invalid
    }
};
