import React from "react";
import Footer from "../Components/Footer";
import backgroundImage from "../assets/bv.jpeg";

const Guidelines = () => {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        position: "relative",
      }}
    >
      {/* Soft White Overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(6px)",
        }}
      />

      {/* Content */}
      <div
        style={{
          position: "relative",
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "4rem 2rem",
        }}
      >
        {/* Glass Window Card */}
        <div
          style={{
            width: "100%",
            maxWidth: "900px",
            background: "rgba(255,255,255,0.75)",
            backdropFilter: "blur(20px)",
            borderRadius: "25px",
            padding: "3rem",
            boxShadow: "0 25px 70px rgba(0,0,0,0.2)",
          }}
        >
          {/* Attractive Heading */}
          <h1
            style={{
              fontSize: "3.2rem",
              fontWeight: "800",
              textAlign: "center",
              background: "linear-gradient(90deg, #2563eb, #7c3aed)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              marginBottom: "1rem",
            }}
          >
            Community Guidelines
          </h1>

          <p
            style={{
              textAlign: "center",
              color: "#475569",
              marginBottom: "2.5rem",
              fontSize: "1.1rem",
            }}
          >
            Building a safe, respectful and trusted marketplace within your
            campus starts with you.
          </p>

          {/* Points */}
          <ul
            style={{
              color: "#1e293b",
              lineHeight: "1.9",
              paddingLeft: "1.5rem",
              fontSize: "1rem",
            }}
          >
            <li><strong>Verified Students Only:</strong> CampusKart is exclusively for college students. Account sharing is prohibited.</li>

            <li><strong>Authentic Listings:</strong> Provide accurate descriptions and upload real product images.</li>

            <li><strong>Safe Exchanges:</strong> Meet in public campus areas and avoid sharing sensitive financial details.</li>

            <li><strong>No Illegal or Harmful Items:</strong> Any restricted, offensive, or inappropriate products are strictly banned.</li>

            <li><strong>Respectful Communication:</strong> Harassment, abusive language, or misconduct will result in account suspension.</li>

            <li><strong>Fair Pricing & Transparency:</strong> Clearly mention product condition and avoid misleading pricing tactics.</li>

            <li><strong>Report Suspicious Activity:</strong> Help us maintain trust by reporting fake or harmful listings.</li>

            <li><strong>Personal Responsibility:</strong> Users are responsible for all actions performed through their accounts.</li>
          </ul>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Guidelines;