import axios from "axios";

// Function to delete a product
export const deleteProduct = async (productId) => {
  try {
    // Get token from localStorage (assuming you saved it on login)
    const token = localStorage.getItem("token");

    if (!token) {
      console.error("No token found. Please login first.");
      return;
    }

    // Axios DELETE request
    const response = await axios.delete(
      `http://localhost:5001/api/products/${productId}`, // replace with your backend URL
      {
        headers: {
          Authorization: `Bearer ${token}`, // send JWT in header
        },
      }
    );

    console.log("Product deleted successfully:", response.data);
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error(
        `Error ${error.response.status}: ${error.response.data.message || error.response.data}`
      );
    } else {
      console.error("Error:", error.message);
    }
  }
};
