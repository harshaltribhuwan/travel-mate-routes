import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
const DirectionCityMap = lazy(() =>
  import("./components/DirectionCityMap/DirectionCityMap.jsx")
);
const ChatBot = lazy(() => import("./components/ChatBot/ChatBot.jsx"));
import "leaflet/dist/leaflet.css";
import "./App.scss";
import Loader from "./components/DirectionCityMap/Loader.jsx";
import Navbar from "./components/Navbar/Navbar.jsx";

export default function App() {
  return (
    <Router>
      <Suspense fallback={<Loader />}>
        <div className="App">
          <Routes>
            <Route path="/" element={<Navbar />} />
            <Route path="/map" element={<DirectionCityMap />} />
            <Route path="/chat" element={<ChatBot />} />
          </Routes>
        </div>
      </Suspense>
    </Router>
  );
}
