import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Navbar from "../Components/Navbar";
import Footer from "../Components/Footer";

const ProductDetails = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5001/api/products/${id}`
        );
        setProduct(res.data);
      } catch (error) {
        console.error("Error fetching product:", error);
      }
    };

    fetchProduct();
  }, [id]);

  if (!product) return <p style={{ textAlign: "center", marginTop: "100px" }}>Loading...</p>;

  return (
    <>
      <Navbar />

      <div
        style={{
          minHeight: "80vh",
          padding: "50px 20px",
          background: "#f9fafb"
        }}
      >
        <div
          style={{
            maxWidth: "1000px",
            margin: "auto",
            background: "#fff",
            borderRadius: "15px",
            boxShadow: "0 8px 25px rgba(0,0,0,0.08)",
            overflow: "hidden",
            display: "flex",
            flexWrap: "wrap"
          }}
        >
          {/* LEFT SIDE - IMAGE */}
          <div style={{ flex: "1 1 400px", background: "#f3f4f6" }}>
            {product.image ? (
              <img
                src={`http://localhost:5001/uploads/${product.image}`}
                alt={product.title}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover"
                }}
              />
            ) : (
              <div
                style={{
                  padding: "100px 20px",
                  textAlign: "center",
                  color: "#9ca3af"
                }}
              >
                No Image Available
              </div>
            )}
          </div>

          {/* RIGHT SIDE - DETAILS */}
          <div style={{ flex: "1 1 500px", padding: "40px" }}>
            <h2 style={{ marginBottom: "10px" }}>{product.title}</h2>

            <p
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                color: "#16a34a",
                marginBottom: "20px"
              }}
            >
              ₹{product.price}
            </p>

            <p style={{ marginBottom: "20px", color: "#555" }}>
              {product.description}
            </p>

            <p style={{ marginBottom: "30px" }}>
              <strong>Category:</strong>{" "}
              <span
                style={{
                  background: "#e5f9ee",
                  padding: "5px 12px",
                  borderRadius: "20px",
                  fontSize: "14px",
                  color: "#16a34a"
                }}
              >
                {product.category}
              </span>
            </p>

            {/* SELLER CARD */}
            <div
              style={{
                background: "#f9fafb",
                padding: "20px",
                borderRadius: "10px",
                border: "1px solid #eee"
              }}
            >
              <h3 style={{ marginBottom: "15px" }}>Seller Information</h3>

              <p><strong>Name:</strong> {product.seller.fullName}</p>
              <p><strong>Email:</strong> {product.seller.email}</p>
              <p><strong>Phone:</strong> {product.seller.mobileNumber}</p>

           {/*   <div style={{ marginTop: "15px" }}>
                <a href={`mailto:${product.seller.email}`}>
                  <button
                    style={{
                      background: "#16a34a",
                      color: "#fff",
                      padding: "10px 15px",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                      marginRight: "10px"
                    }}
                  >
                    Email Seller
                  </button>
                </a>

                <a href={`tel:${product.seller.mobileNumber}`}>
                  <button
                    style={{
                      background: "#2563eb",
                      color: "#fff",
                      padding: "10px 15px",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer"
                    }}
                  >
                    Call Seller
                  </button>
                </a>
              </div>*/}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default ProductDetails;