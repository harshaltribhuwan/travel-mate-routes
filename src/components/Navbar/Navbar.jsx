import React from "react";
import { Link } from "react-router-dom";
import "./Navbar.scss";

const Navbar = () => {
  return (
    <div className="navbar-container">
      <Link to="/map" className="nav-button">
        Map
      </Link>
      <Link to="/chat" className="nav-button">
        Chat
      </Link>
    </div>
  );
};

export default Navbar;
