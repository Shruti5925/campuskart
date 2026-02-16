import React from 'react';
import { useNavigate } from 'react-router-dom';

const ProductCard = ({ product, isSeller, onDelete }) => {
    const navigate = useNavigate();

    return (
        <div className="product-card">
            <div className="product-image-placeholder">
                📦
            </div>
            <div className="product-content">
                <span className="product-category">{product.category}</span>
                <h3 className="product-title">{product.title}</h3>
                <p className="product-description">{product.description}</p>

                <div className="product-footer">
                    <span className="product-price">₹{product.price}</span>
                </div>

                {isSeller && (
                    <div className="management-actions">
                        <button
                            className="edit-btn"
                            onClick={() => navigate(`/edit/${product._id}`)}
                        >
                            Edit
                        </button>
                        <button
                            className="remove-btn"
                            onClick={() => onDelete(product._id)}
                        >
                            Remove
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductCard;
