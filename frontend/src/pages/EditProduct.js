import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../Components/Sidebar";
import Footer from "../Components/Footer";
import "../styles/AddProduct.css"; // Reuse the beautiful add product styles
import "../styles/Dashboard.css";

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [form, setForm] = useState({
    title: "",
    category: "",
    condition: "New",
    description: "",
    price: "",
    pickupPoint: "",
    yearsUsed: "",
    status: ""
  });

  const [existingImages, setExistingImages] = useState([]); // URLs from DB
  const [newImages, setNewImages] = useState([]);          // Local file objects
  const [previews, setPreviews] = useState([]);            // Mix of URLs and local blobs

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await axios.get(`http://localhost:5001/api/products/${id}`);
        if (res.data) {
          setForm({
            title: res.data.title || "",
            description: res.data.description || "",
            price: res.data.price || "",
            category: res.data.category || "",
            condition: res.data.condition || "New",
            pickupPoint: res.data.pickupPoint || "",
            yearsUsed: res.data.yearsUsed || "",
            status: res.data.status || "active"
          });

          const images = res.data.images || (res.data.image ? [res.data.image] : []);
          setExistingImages(images);
          setPreviews(images);
        }
        setLoading(false);
      } catch (err) {
        console.error("Error fetching product:", err);
        setError("Failed to load product details ❌");
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const remainingSlots = 5 - (existingImages.length + newImages.length);
      const addedFiles = files.slice(0, remainingSlots);

      const updatedNewImages = [...newImages, ...addedFiles];
      setNewImages(updatedNewImages);

      // Update previews: current existing images + current new images (as blobs)
      const newLocalPreviews = addedFiles.map(file => URL.createObjectURL(file));
      setPreviews([...previews, ...newLocalPreviews]);
    }
  };

  const removeExistingImage = (index) => {
    const urlToRemove = previews[index];
    const updatedExisting = existingImages.filter(url => url !== urlToRemove);
    setExistingImages(updatedExisting);
    setPreviews(previews.filter((_, i) => i !== index));
  };

  const removeNewImage = (index) => {
    // Index relative to combined previews. We need to find its index in newImages.
    const previewToRemove = previews[index];
    const newIdx = index - existingImages.length;
    setNewImages(newImages.filter((_, i) => i !== newIdx));
    setPreviews(previews.filter((_, i) => i !== index));
  };

  const handleUpdate = async (e, newStatus = null) => {
    e.preventDefault();
    if (updating) return;
    setUpdating(true);
    setError("");

    const formData = new FormData();
    Object.keys(form).forEach(key => {
      if (key === 'status' && newStatus) {
        formData.append(key, newStatus);
      } else {
        formData.append(key, form[key]);
      }
    });

    // Add remaining existing images as strings
    existingImages.forEach(url => formData.append('existingImages', url));

    // Add newly uploaded files
    newImages.forEach(file => formData.append('images', file));

    try {
      await axios.put(`http://localhost:5001/api/products/${id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      navigate("/dashboard");
    } catch (err) {
      console.error("Update error:", err);
      setError(err.response?.data?.message || "Error updating product ❌");
      setUpdating(false);
    }
  };

  if (loading) return <div className="loading" style={{ padding: '5rem', textAlign: 'center' }}>Loading listing details...</div>;

  return (
    <div className="dashboard-page-container">
      <div className="dashboard-layout">
        <Sidebar />
        <main className="dashboard-main">
          <div className="list-item-content">
          <div className="content-left">
            <div className="page-title">
              <h1>Edit Your Listing</h1>
              <p>Update your item details, photos, or price.</p>
            </div>

            <div className="section-card upload-section">
              <h3>Photos</h3>
              <div className="upload-box" onClick={() => document.getElementById('imageInput').click()}>
                <input
                  id="imageInput"
                  type="file"
                  multiple
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleImageChange}
                />
                {previews.length > 0 ? (
                  <div className="previews-grid-container" onClick={(e) => e.stopPropagation()}>
                    {previews.map((src, idx) => (
                      <div key={idx} className="preview-item">
                        <img src={src} alt={`Preview ${idx}`} className="image-preview-thumb" />
                        <button
                          className="remove-img-btn"
                          onClick={() => idx < existingImages.length ? removeExistingImage(idx) : removeNewImage(idx)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {previews.length < 5 && (
                      <div className="add-more-box" onClick={() => document.getElementById('imageInput').click()}>
                        <span>+</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="upload-icon">📷</div>
                    <p><strong>Upload Photos</strong></p>
                    <p className="upload-hint">Upload up to 5 photos of your item.</p>
                    <button className="select-btn" type="button">Select Images</button>
                  </>
                )}
              </div>
            </div>

            <div className="section-card info-section">
              <h3>Basic Information</h3>
              <div className="input-group">
                <label>Product Title</label>
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Item title"
                  required
                />
              </div>
              <div className="row">
                <div className="input-group half">
                  <label>Category</label>
                  <select name="category" value={form.category} onChange={handleChange} required>
                    <option value="">Select Category</option>
                    <option value="Books">Books</option>
                    <option value="Fan">Fan</option>
                    <option value="Trunk">Trunk</option>
                    <option value="Cycles">Cycles</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
                <div className="input-group half">
                  <label>Condition</label>
                  <div className="condition-toggle">
                    {['New', 'Like New', 'Used'].map(c => (
                      <button
                        key={c}
                        type="button"
                        className={form.condition === c ? 'active' : ''}
                        onClick={() => setForm({ ...form, condition: c })}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="input-group small">
                <label>Years Used</label>
                <input
                  name="yearsUsed"
                  type="number"
                  value={form.yearsUsed}
                  onChange={handleChange}
                  placeholder="How many years used?"
                />
              </div>
              <div className="input-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Mention details like age, defects..."
                  required
                />
              </div>
            </div>

            <div className="section-card pricing-section">
              <h3>Pricing & Location</h3>
              <div className="row">
                <div className="input-group half">
                  <label>Price (₹)</label>
                  <div className="price-input">
                    <span>₹</span>
                    <input
                      name="price"
                      type="number"
                      value={form.price}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div className="input-group half">
                  <label>Pickup Point</label>
                  <div className="location-input">
                    <span>📍</span>
                    <input
                      name="pickupPoint"
                      value={form.pickupPoint}
                      onChange={handleChange}
                      placeholder="Where to collect?"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {error && <div className="error-message" style={{ color: '#ef4444', marginBottom: '1rem', fontWeight: 'bold' }}>{error}</div>}

            <div className="form-actions">
              {form.status === 'draft' ? (
                <>
                  <button className="continue-btn" onClick={(e) => handleUpdate(e, 'pending')} disabled={updating}>
                    {updating ? "Listing..." : "List Product"}
                  </button>
                  <button className="draft-btn" onClick={(e) => handleUpdate(e, 'draft')} disabled={updating}>
                    {updating ? "Saving..." : "Update Draft"}
                  </button>
                </>
              ) : (
                <button className="continue-btn" onClick={(e) => handleUpdate(e, 'active')} disabled={updating}>
                  {updating ? "Updating..." : "Update Listing"}
                </button>
              )}
              <button className="draft-btn" type="button" onClick={() => navigate("/dashboard")}>
                Cancel
              </button>
            </div>
          </div>

          <div className="content-right">
            <div className="health-card">
              <div className="health-header">
                <h3>🛠️ Listing Options</h3>
              </div>
              <p className="health-hint">Keeping your photos and price updated helps you sell faster.</p>
              <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div className="health-item">
                  <span>Current Photos</span>
                  <span>{previews.length} / 5</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
    <Footer />
  </div>
);
};

export default EditProduct;
