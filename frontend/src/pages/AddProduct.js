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

          {/* ✅ LOWERCASE VALUES */}
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            required
          >
            <option value="">Select Category</option>
            <option value="book">Book</option>
            <option value="electronics">Electronics</option>
            <option value="fan">Fan</option>
            <option value="bicycle">Bicycle</option>
            <option value="others">Others</option>
          </select>

          <button type="submit">List Product</button>
        </form>

        <p className="auth-message">{message}</p>
      </div>
    </div>
  );
}

export default AddProduct;
