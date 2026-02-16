import { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/Auth.css"; // Reuse auth styles for consistent look

function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState({
    title: "",
    description: "",
    price: "",
    category: ""
  });
  const [message, setMessage] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await axios.get(`http://localhost:5001/api/products/${id}`);
        if (res.data) {
          setProduct({
            title: res.data.title || "",
            description: res.data.description || "",
            price: res.data.price || "",
            category: res.data.category || ""
          });
        }
      } catch (err) {
        console.error("Error fetching product:", err);
        setMessage("Failed to load product details ❌");
      }
    };
    fetchProduct();
  }, [id]);

  const handleChange = (e) => {
    setProduct({ ...product, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        `http://localhost:5001/api/products/${id}`,
        product,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setMessage("Product updated successfully! ✅");
      setTimeout(() => navigate("/want-to-sell"), 1500);
    } catch (err) {
      setMessage(err.response?.data?.message || "Error updating product ❌");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Edit Product</h2>
        <form className="auth-form" onSubmit={handleUpdate}>
          <input
            name="title"
            placeholder="Product Title"
            value={product.title}
            onChange={handleChange}
            required
          />
          <textarea
            name="description"
            placeholder="Description"
            value={product.description}
            onChange={handleChange}
            style={{
              padding: '12px',
              borderRadius: '6px',
              border: '1px solid #ddd',
              minHeight: '100px',
              fontFamily: 'inherit'
            }}
            required
          />
          <input
            name="price"
            type="number"
            placeholder="Price (₹)"
            value={product.price}
            onChange={handleChange}
            required
          />
          <input
            name="category"
            placeholder="Category (e.g., Cycle, Table)"
            value={product.category}
            onChange={handleChange}
            required
          />

          <button type="submit" style={{ marginTop: '10px' }}>Update Product</button>
          <button
            type="button"
            className="secondary-btn"
            onClick={() => navigate("/want-to-sell")}
            style={{
              marginTop: '10px',
              background: '#f1f5f9',
              color: '#64748b',
              padding: '12px',
              border: 'none',
              borderRadius: '6px',
              width: '100%',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
        </form>
        <p className="auth-message">{message}</p>
      </div>
    </div>
  );
}

export default EditProduct;
