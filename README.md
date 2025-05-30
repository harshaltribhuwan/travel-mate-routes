# 🗺️ TravelMate Routes – Smart, Voice-Enabled Map App (PWA)

TravelMate Routes is a lightweight, powerful **React.js-based mapping application** built with Leaflet and OpenStreetMap. It helps users **search destinations, get directions, hear voice navigation, explore nearby places**, and **save routes** — all without a backend. Built as a **Progressive Web App**, it works seamlessly across **mobile, tablet, and desktop**.

🔗 **Live Demo**: [travelmate-routes.netlify.app](https://travelmate-routes.netlify.app)

## ✨ Features

### 🔍 Destination Search & Routing
- Search for any location using Nominatim API
- Get step-by-step directions using OSRM Routing
- View **multiple route alternatives** to the same destination

### 🗣️ Voice Navigation
- Integrated with `speak-tts` for **text-to-speech guidance**
- Voice instructions are spoken aloud when clicking on route steps
- Toggle voice on/off as needed

### 📜 Route Details
- Click “View Route Details” to see all turn-by-turn instructions
- Interact with each step (click to hear it spoken aloud)

### 💾 Save & Reuse Routes
- Save routes in `localStorage` for future use
- Access saved routes instantly without searching again

### 🗺️ Multiple Map Skins
Choose from 4 map styles:
- Satellite View  
- Classic View  
- Minimal View  
- Night Mode  

### 📍 Current Location Tracking
- Auto-locate the user’s real-time position
- Pan and center map on current location

### 🧭 Nearby Places (within 1000 meters)
- Explore POIs like:
  - 🏨 Hotels
  - ☕ Cafes
  - 🍽️ Restaurants
  - 🏥 Hospitals & Medical
- Filter by categories
- Powered by Overpass API

### 📂 Route History
- View all past destinations
- Re-select from history to instantly load directions

### 💡 Minimal, Responsive Design
- Inspired by Google Maps styling
- Clean, intuitive UI across **mobile**, **desktop**, and **tablet**

### 💻 Progressive Web App (PWA)
- Installable on any device
- Works offline (via leaflet.offline)
- Smooth experience across all platforms

## 🛠️ Tech Stack

| Tech             | Description                                 |
|------------------|---------------------------------------------|
| **React.js**     | Frontend framework                          |
| **Vite**         | Fast build tool for React                   |
| **Leaflet**      | Open-source interactive maps                |
| **SASS**         | Styling with modular SCSS                   |
| **LocalStorage** | Store routes and history locally            |
| **PWA**          | Offline support and installable experience  |

## 🧩 Libraries & APIs Used

### 🔗 NPM Packages
```json
"leaflet": "^1.9.4",
"leaflet-geosearch": "^4.2.0",
"leaflet-routing-machine": "^3.2.12",
"leaflet.offline": "^3.1.0",
"speak-tts": "^2.0.0"
```

### 🔗 Open APIs Used

- 🔍 Geocoding/Search**: [`https://nominatim.openstreetmap.org/search`](https://nominatim.openstreetmap.org/search)
- 🛣️ Routing: [`https://router.project-osrm.org/route/v1`](https://router.project-osrm.org/route/v1)
- 🗺️ Map Tiles: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`
- 🏨 Nearby POIs: [`https://overpass-api.de/api/interpreter`](https://overpass-api.de/api/interpreter)

## Built with 💙 by a React.js developer with 3.4+ years of experience. If you find this project helpful, feel free to ⭐️ the repo or reach out for feedback and collaboration.
