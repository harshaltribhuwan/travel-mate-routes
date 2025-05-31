import React from "react";
import { Link } from "react-router-dom";
import "./Landing.scss";

const Landing = () => {
  return (
    <div className="landing-container">
      <div className="landing-content">
        <h1>Welcome to TravelMate</h1>
        <p>Plan your next adventure with ease!</p>
        <div className="landing-buttons">
          <Link to="/map" className="landing-button map-button">
            Explore Map
          </Link>
          <Link to="/chat" className="landing-button chat-button">
            Chat with TravelMate
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Landing;
