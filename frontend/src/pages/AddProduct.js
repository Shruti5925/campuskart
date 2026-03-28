import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Sidebar from "../Components/Sidebar";
import Footer from "../Components/Footer";
import "../styles/AddProduct.css";
import "../styles/Dashboard.css";

const AddProduct = () => {
  const navigate = useNavigate();
  const token = sessionStorage.getItem("token");
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
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get("http://localhost:5001/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUserData(res.data);
      } catch (err) {
        console.error("Error fetching user:", err);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchUser();
    else setLoading(false);
  }, [token]);

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

  const nextStep = () => {
    setStep(step + 1);
    window.scrollTo(0, 0);
  };
  const prevStep = () => {
    setStep(step - 1);
    window.scrollTo(0, 0);
  };

  const submitProduct = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError("");

    const formData = new FormData();
    Object.keys(form).forEach(key => formData.append(key, form[key]));
    images.forEach(img => formData.append('images', img));
    formData.append('status', 'pending'); // Ensure it goes under review

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
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!form.title) {
      setError("Please at least provide a title to save a draft.");
      return;
    }
    setIsSubmitting(true);
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
      setIsSubmitting(false);
    }
  };

  const isStep1Complete = form.title && form.category && form.description;
  const isStep2Complete = form.price && form.pickupPoint;

  return (
    <div className="dashboard-page-container">
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

            {loading ? (
              <div className="loading-state" style={{ padding: '4rem', textAlign: 'center' }}>
                <div className="spinner"></div>
                <p>Verifying account status...</p>
              </div>
            ) : userData?.isSuspended ? (
              <div className="section-card suspension-notice-box" style={{ 
                background: '#fef2f2', 
                border: '1px solid #fee2e2', 
                padding: '3rem', 
                textAlign: 'center',
                borderRadius: '24px'
              }}>
                <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🚫</div>
                <h2 style={{ color: '#991b1b', fontWeight: '900', marginBottom: '1rem' }}>Access Restricted</h2>
                <p style={{ color: '#b91c1c', fontSize: '1.1rem', lineHeight: '1.6', maxWidth: '500px', margin: '0 auto 2rem' }}>
                  Your account has been suspended by the campus administrator. You are currently restricted from listing new products or saving drafts.
                </p>
                <div style={{ padding: '1rem', background: 'white', borderRadius: '12px', border: '1px solid #fee2e2', display: 'inline-block' }}>
                   <p style={{ margin: 0, fontSize: '0.9rem', color: '#7f1d1d' }}>
                     Please contact the help center if you believe this is an error.
                   </p>
                </div>
              </div>
            ) : (userData && userData.role !== 'admin' && !userData.isVerified) ? (
              <div className="section-card approval-notice-box" style={{ 
                background: '#f0fdf4', 
                border: '1px solid #dcfce7', 
                padding: '3rem', 
                textAlign: 'center',
                borderRadius: '24px'
              }}>
                <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>⏳</div>
                <h2 style={{ color: '#166534', fontWeight: '900', marginBottom: '1rem' }}>Account Pending Approval</h2>
                <p style={{ color: '#15803d', fontSize: '1.1rem', lineHeight: '1.6', maxWidth: '500px', margin: '0 auto 2rem' }}>
                  Your account is currently in the approval queue. You will be able to list new products and save drafts once an administrator has verified your account details.
                </p>
                <div style={{ padding: '1rem', background: 'white', borderRadius: '12px', border: '1px solid #dcfce7', display: 'inline-block' }}>
                   <p style={{ margin: 0, fontSize: '0.9rem', color: '#14532d' }}>
                     Most accounts are approved within 24 hours. Thank you for your patience!
                   </p>
                </div>
              </div>
            ) : (
              <>
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
                    <button className="back-btn" onClick={prevStep} disabled={isSubmitting}>Back</button>
                    <button className="continue-btn" onClick={submitProduct} disabled={!isStep2Complete || isSubmitting}>
                      {isSubmitting ? 'Listing...' : 'List Product'}
                    </button>
                  </div>
                  <button className="draft-btn" onClick={handleSaveDraft} disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Save as Draft'}
                  </button>
                </>
              )}
            </div>
            </>
            )}
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
    <Footer />
  </div>
);
};

export default AddProduct;
