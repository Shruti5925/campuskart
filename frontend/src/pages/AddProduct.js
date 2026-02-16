import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/Auth.css";

function AddProduct() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    category: ""
  });
  const [message, setMessage] = useState("");
  const token = localStorage.getItem("token");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submitProduct = async (e) => {
    e.preventDefault();

    try {
      await axios.post(
        "http://localhost:5001/api/products",
        form,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setMessage("Product added successfully! ✅");
      setTimeout(() => navigate("/want-to-sell"), 1500);
    } catch (err) {
      setMessage("Error adding product ❌");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Add New Product</h2>
        <form className="auth-form" onSubmit={submitProduct}>
          <input
            name="title"
            placeholder="What are you selling?"
            value={form.title}
            onChange={handleChange}
            required
          />
          <textarea
            name="description"
            placeholder="Describe your item..."
            value={form.description}
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
            value={form.price}
            onChange={handleChange}
            required
          />
          <input
            name="category"
            placeholder="Category (e.g., Cycle, Electronics)"
            value={form.category}
            onChange={handleChange}
            required
          />

          <button type="submit" style={{ marginTop: '10px' }}>List Product</button>
          <button
            type="button"
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

export default AddProduct;
