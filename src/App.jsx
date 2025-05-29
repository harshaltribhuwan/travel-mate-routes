import { lazy, Suspense } from "react";
const DirectionCityMap = lazy(() =>
  import("./components/DirectionCityMap/DirectionCityMap.jsx")
);
import "leaflet/dist/leaflet.css";
import "./App.scss";
import Loader from "./components/DirectionCityMap/Loader.jsx";

export default function App() {
  return (
    <Suspense fallback={<Loader />}>
      <div className="App">
        <DirectionCityMap />
      </div>
    </Suspense>
  );
}
