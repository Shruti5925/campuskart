// frontend/src/utils/computeScore.js
/**
 * Replicates the backend quality score algorithm for live UI feedback.
 * @param {Object} data - product fields (title, category, price, description, images)
 * @param {boolean} imageMatch - result from the quality‑image‑verification endpoint
 * @returns {{score:number, rating:string, suggestions:string[]}}
 */
export function computeScore(data, imageMatch) {
  let score = 0;
  const suggestions = [];

  // Title present (15)
  if (data.title && data.title.trim()) {
    score += 15;
    if (data.title.trim().length > 10) {
      score += 10;
    } else {
      suggestions.push('Use a more descriptive title.');
    }
  } else {
    suggestions.push('Add a product title.');
  }

  // Category selected (10)
  if (data.category && data.category.trim()) {
    score += 10;
  } else {
    suggestions.push('Select a product category.');
  }

  // Price entered (10)
  if (data.price) {
    score += 10;
  } else {
    suggestions.push('Add a price to improve buyer trust.');
  }

  // Description length >100 (15)
  if (data.description && data.description.length > 100) {
    score += 15;
  } else {
    suggestions.push('Provide more details about the product.');
  }

  // AI‑generated description used (10) – we treat any non‑empty description as satisfying this
  if (data.description && data.description.trim()) {
    score += 10;
  }

  // At least 3 images uploaded (10)
  if (Array.isArray(data.images) && data.images.length >= 3) {
    score += 10;
  } else {
    suggestions.push('Upload at least 3 images.');
  }

  // AI image verification passed (20)
  if (imageMatch) {
    score += 20;
  } else {
    suggestions.push('Some uploaded images may not match the product.');
  }

  // Clamp score
  score = Math.min(100, Math.max(0, score));

  // Rating mapping
  let rating = 'Needs Improvement';
  if (score >= 90) rating = 'Excellent Listing';
  else if (score >= 70) rating = 'Good Listing';
  else if (score >= 40) rating = 'Average Listing';

  return { score, rating, suggestions };
}
