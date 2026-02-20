import React from "react";
import Navbar from "../Components/Navbar";
import Footer from "../Components/Footer";
import "../styles/Guidelines.css";

const Guidelines = () => {
  return (
    <div className="guidelines-container">
      <Navbar />

      <div className="guidelines-hero">
        <h1>CampusKart Guidelines</h1>
        <p>
          To ensure a safe and smooth experience for everyone, please follow
          these community rules.
        </p>
      </div>

      <div className="guidelines-content">
        <div className="guideline-card">
          <h2>1. Be Honest</h2>
          <p>
            Provide accurate details about your product including price,
            condition, and images. Misleading listings may be removed.
          </p>
        </div>

        <div className="guideline-card">
          <h2>2. Respect Campus Community</h2>
          <p>
            This platform is only for students. Maintain respectful
            communication while interacting with buyers and sellers.
          </p>
        </div>

        <div className="guideline-card">
          <h2>3. No Prohibited Items</h2>
          <p>
            Selling illegal, harmful, or restricted items is strictly
            prohibited and will result in account suspension.
          </p>
        </div>

        <div className="guideline-card">
          <h2>4. Meet Safely</h2>
          <p>
            Always meet in public campus areas during daytime when completing
            transactions.
          </p>
        </div>

        <div className="guideline-card">
          <h2>5. Fair Pricing</h2>
          <p>
            Keep pricing reasonable and student-friendly. Avoid price gouging
            or scams.
          </p>
        </div>

        <div className="guideline-card">
          <h2>6. Report Issues</h2>
          <p>
            If you notice suspicious activity or inappropriate listings, report
            them immediately.
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Guidelines;
