/**
 * Formats a date string into numerical DD/MM/YYYY format.
 * @param {string|Date} dateString - The date to format.
 * @returns {string} - Formatted date string in DD/MM/YYYY.
 */
export const formatNumericDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return String(dateString);
    
    // Using en-GB as it defaults to DD/MM/YYYY
    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};
