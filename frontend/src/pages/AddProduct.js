import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Sidebar from "../Components/Sidebar";
import "../styles/AddProduct.css";
import "../styles/Dashboard.css";

const AddProduct = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    title: "",
    category: "",
    condition: "New",
    description: "",
    price: "",
    pickupPoint: "",
    yearsUsed: ""
  });
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const newImages = [...images, ...files].slice(0, 5); // Limit to 5
      setImages(newImages);

      const newPreviews = newImages.map(file => URL.createObjectURL(file));
      setPreviews(newPreviews);
    }
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setImages(newImages);
    setPreviews(newPreviews);
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const submitProduct = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");

    const formData = new FormData();
    Object.keys(form).forEach(key => formData.append(key, form[key]));
    images.forEach(img => formData.append('images', img));
    formData.append('status', 'active'); // Ensure it's active when submitted

    try {
      await axios.post("http://localhost:5001/api/products", formData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      navigate("/dashboard");
    } catch (err) {
      console.error("error adding product", err);
      setError(err.response?.data?.message || "Failed to list product. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (!form.title) {
      setError("Please at least provide a title to save a draft.");
      return;
    }
    setLoading(true);
    setError("");

    const formData = new FormData();
    Object.keys(form).forEach(key => formData.append(key, form[key]));
    images.forEach(img => formData.append('images', img));
    formData.append('status', 'draft');

    try {
      await axios.post("http://localhost:5001/api/products", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      navigate("/dashboard");
    } catch (err) {
      console.error("error saving draft", err);
      setError(err.response?.data?.message || "Failed to save draft. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isStep1Complete = form.title && form.category && form.description;
  const isStep2Complete = form.price && form.pickupPoint;

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        <div className="list-item-content">

          <div className="content-left">
            <div className="page-title">
              <h1>List Your Item</h1>
              <p>Help a fellow student and earn some cash.</p>
              <button className="guidelines-btn">Posting Guidelines</button>
            </div>

            <div className="step-card">
              <div className="step-header">
                <h3>Step {step}: {step === 1 ? 'Product Details' : 'Pricing & Location'}</h3>
                <span className="step-indicator">{step} of 2</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: step === 1 ? '50%' : '100%' }}></div>
              </div>
              <p className="next-step-hint">{step === 1 ? 'Next: Pricing & Location' : 'Next: Preview'}</p>
            </div>

            {step === 1 && (
              <>
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
                            <button className="remove-img-btn" onClick={() => removeImage(idx)}>×</button>
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
                        <p className="upload-hint">Drag and drop or click to upload up to 5 photos. High-quality images sell 50% faster.</p>
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
                      placeholder="e.g. Engineering Mathematics - K.A. Stroud"
                      value={form.title}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="row">
                    <div className="input-group half">
                      <label>Category</label>
                      <select name="category" value={form.category} onChange={handleChange}>
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
                      placeholder="How many years have you used this?"
                      value={form.yearsUsed}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="input-group">
                    <label>Description</label>
                    <textarea
                      name="description"
                      placeholder="Mention details like age, defects, and why you are selling..."
                      value={form.description}
                      onChange={handleChange}
                    ></textarea>
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
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
                        placeholder="0.00"
                        value={form.price}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div className="input-group half">
                    <label>Pickup Point</label>
                    <div className="location-input">
                      <span>📍</span>
                      <input
                        name="pickupPoint"
                        placeholder="e.g. Hostel Block B, Reception"
                        value={form.pickupPoint}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>
                <div className="pro-tip">
                  <span className="tip-icon">ℹ️</span>
                  <p><strong>Pro Tip:</strong> Most sales happen near common areas like the cafeteria or central library. Mention if you can deliver within the campus!</p>
                </div>
              </div>
            )}

            {error && <div className="error-message" style={{ color: '#ef4444', marginBottom: '1rem', fontWeight: 'bold' }}>{error}</div>}
            <div className="form-actions">
              {step === 1 ? (
                <button className="continue-btn" onClick={nextStep} disabled={!isStep1Complete}>Continue to Preview</button>
              ) : (
                <>
                  <div className="step-actions">
                    <button className="back-btn" onClick={prevStep} disabled={loading}>Back</button>
                    <button className="continue-btn" onClick={submitProduct} disabled={!isStep2Complete || loading}>
                      {loading ? 'Listing...' : 'List Product'}
                    </button>
                  </div>
                  <button className="draft-btn" onClick={handleSaveDraft} disabled={loading}>
                    {loading ? 'Saving...' : 'Save as Draft'}
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="content-right">
            <div className="health-card">
              <div className="health-header">
                <h3>📈 Listing Health</h3>
              </div>
              <div className="health-list">
                <div className="health-item">
                  <span>Photos</span>
                  <span className={`status ${images.length > 0 ? 'excellent' : 'missing'}`}>{images.length > 0 ? `${images.length} Photos` : 'Missing'}</span>
                </div>
                <div className="health-item">
                  <span>Description</span>
                  <span className="status excellent">Excellent</span>
                </div>
                <div className="health-item">
                  <span>Price Logic</span>
                  <span className="status fair">Fair</span>
                </div>
              </div>
              <p className="health-hint">Items with clear photos and specific campus locations sell 4x faster.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AddProduct;
