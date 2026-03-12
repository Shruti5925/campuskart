import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Footer from "../Components/Footer";
import defaultProduct from "../assets/default-product.svg";
import "../styles/ContactSeller.css";

const ContactSeller = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5001/api/products/${id}`
        );
        setProduct(res.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching details:", err);
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) return <div className="loading">Loading details...</div>;
  if (!product) return <div className="error">Data not found</div>;

 return (
  <div className="page-wrapper">
    
    <div className="contact-container">
      <div className="contact-card">
        <h1>Contact Seller</h1>

        {/* Product Section */}
        <div className="contact-product">
          <img
            src={product.image || defaultProduct}
            alt={product.title}
          />
          <div>
            <h2>{product.title}</h2>
            <p className="price">₹{product.price}</p>
            <p>{product.description}</p>
          </div>
        </div>

        {/* Seller Section */}
        {product?.seller && (
          <div className="seller-details">
            <h3>Seller Information</h3>

            <div className="seller-grid">
              <p><strong>Name:</strong> {product.seller.firstName} {product.seller.lastName}</p>
              <p><strong>Email:</strong> {product.seller.email}</p>
              <p><strong>Department:</strong> {product.seller.department}</p>
              <p><strong>College ID:</strong> {product.seller.collegeId}</p>
              <p><strong>Mobile:</strong> {product.seller.mobileNumber}</p>
              <p><strong>Gender:</strong> {product.seller.gender}</p>
              <p><strong>Address:</strong> {product.seller.address}</p>
              <p><strong>Role:</strong> {product.seller.role}</p>
            </div>
          </div>
        )}

        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Back to Product
        </button>
      </div>
    </div>

    <Footer />

  </div>
);
};

export default ContactSeller;