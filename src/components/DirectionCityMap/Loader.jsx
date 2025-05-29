import React from 'react'
import "./Loader.scss"

const Loader = () => {
  return (
    <div className="route-loader">
      <div className="route-loader-dot"></div>
      <div className="route-loader-dot"></div>
      <div className="route-loader-dot"></div>
      <div className="route-loader-dot"></div>
    </div>
  );
}

export default Loader