// backend/controllers/qualityImageVerification.js
const { verifyImages } = require("./aiController");

/**
 * Wrapper around verifyImages that returns only the match boolean.
 * It expects the same multipart form-data (title, category, images).
 */
async function verifyQualityImages(req, res) {
  // Reuse existing verifyImages logic but capture its response.
  // We'll create a mock response object to intercept the JSON.
  const mockRes = {
    jsonPayload: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.jsonPayload = payload; }
  };
  await verifyImages(req, mockRes);
  // The original verifyImages returns { match: true/false, message? }
  const result = mockRes.jsonPayload || {};
  // Send simplified response
  return { imageMatch: result.match === true };
}

module.exports = { verifyQualityImages };
