# AquaPulse: Tandem Autonomous Marine Intelligence System
## Solar-Powered Surface Pilot Vessel (ASV) & Tethered Deep-Probe Submarine (UUV)

[![System Architecture](https://img.shields.io/badge/Architecture-ASV--UUV%20Tandem-blue)](#)
[![Solar Powered](https://img.shields.io/badge/Power-1.2kW%20Bifacial%20PV-brightgreen)](#)
[![Edge AI](https://img.shields.io/badge/Compute-Dual%20Jetson%20Orin%20550TOPS-cyan)](#)
[![Telemetry](https://img.shields.io/badge/Comms-Starlink%20%7C%20NavIC%20%7C%20HF%20Mesh-orange)](#)
[![Government Sync](https://img.shields.io/badge/Database-National%20Fisheries%20Cloud%20(Ed25519)-purple)](#)

---

## 📖 Project Overview

**AquaPulse** started as a concept for an autonomous small submarine to monitor water pollution and marine life. This project evolves that concept into a physical-hardened, deployment-grade **Tandem Robotic System**:
- **AquaPulse-ASV (Autonomous Surface Vessel / Pilot Boat):** Sits permanently on the surface, harvesting continuous solar power via a $1.2\text{ kWp}$ bifacial deck, navigating with $360^\circ$ FMCW marine radar, and maintaining gigabit satellite uplinks (Starlink / NavIC / HF / UHF) to central government databases.
- **AquaPulse-UUV (Tethered Sub-Surface Probe):** Deployed from the pilot boat via an active heave-compensating winch and a neutrally-buoyant Kevlar-armored umbilical cable (0 to 150m depth). Delivers unlimited subsea runtime, 4K stereo machine vision, multibeam forward sonar, CTD oceanographic profiling, and microplastic optical spectrometry.
- **Fisheries AI Intelligence:** Edge neural networks (YOLOv10-Marine + ByteTrack) identify fish species (Mackerel, Sardine, Tuna, Pomfret), calculate individual fish length and biomass ($W = a \cdot L^b$), and score a visual/environmental **Health Quality Index (HQI)**.
- **National Government Maritime Portal:** Real-time bi-directional telemetry synchronizes with the Department of Fisheries (DoF), Marine Police, Coast Guard, and national research bodies (CMFRI / NIO) with automated Marine Protected Area (MPA) illegal trawler alerts.

---

## 📁 Repository Contents

| File / Folder | Description |
| :--- | :--- |
| [`Aqua_Pulse_Original_Slides.md`](file:///Users/aadilsp/Desktop/Antigravity/TKM-Submarine/Aqua_Pulse_Original_Slides.md) | Clean, faithful Markdown transcript of the original 8 PowerPoint slides. |
| [`AquaPulse_Tandem_System_Project_Report.md`](file:///Users/aadilsp/Desktop/Antigravity/TKM-Submarine/AquaPulse_Tandem_System_Project_Report.md) | Exhaustive engineering and feasibility report with Mermaid diagrams, mathematical models (solar balance, catenary drag, allometric biomass), sensor specs, comms topology, and economic cost breakdown. |
| [`simulator/index.html`](file:///Users/aadilsp/Desktop/Antigravity/TKM-Submarine/simulator/index.html) | Interactive 6-view tactical maritime simulation dashboard. |
| [`simulator/style.css`](file:///Users/aadilsp/Desktop/Antigravity/TKM-Submarine/simulator/style.css) | Cyber-maritime dark mode visual theme with glassmorphism and radar aesthetics. |
| [`simulator/app.js`](file:///Users/aadilsp/Desktop/Antigravity/TKM-Submarine/simulator/app.js) | Full simulation engine: 60 FPS subsea physics, catenary winch animation, YOLO camera stream, radar sweeps, Leaflet GPS navigation, and telemetry charting. |
| [`server.py`](file:///Users/aadilsp/Desktop/Antigravity/TKM-Submarine/server.py) | Python FastAPI/HTTP backend providing REST endpoints (`/api/telemetry`, `/api/subsea/depth`, `/api/gov/export`). |
| [`run_sim.sh`](file:///Users/aadilsp/Desktop/Antigravity/TKM-Submarine/run_sim.sh) | Executable bash runner script that starts the server and launches your browser. |

---

## 🚀 Running the Interactive Simulator

### Option 1: One-Click Shell Script (Recommended)
```bash
./run_sim.sh
```
This automatically finds an available port (8000/8080), starts `server.py`, and opens the dashboard in your default browser.

### Option 2: Python Command Line
```bash
python3 server.py
```
Then navigate to: **`http://localhost:8000`**

### Option 3: Direct Browser File (Offline)
You can also directly open `simulator/index.html` in Safari, Chrome, or Firefox.

---

## 🎛️ Simulator Dashboard Features

1. **Tactical Nautical Map & Route Dispatcher:**
   - Real geographic coordinates of the Arabian Sea (Southwest Coast of India: Cochin Port, Chetwai Shelf, Vizhinjam Deep Canyon, Lakshadweep Sea).
   - Live vessel path interpolation, speed control (1x, 2x, 5x, 10x warp), Marine Protected Area (MPA) exclusion polygons.
2. **Subsea Tandem 2D Depth Cutaway:**
   - 60 FPS physics animation of the surface catamaran floating on waves, solar irradiance rays, moonpool winch, Kevlar umbilical catenary curve, and subsea probe diving from 0m to 150m.
   - Sonar beam sweeps, thermocline gradient indicator, swimming fish schools, and microplastic particles.
3. **AI Computer Vision & Biomass Lab:**
   - Simulated low-light 4K stereo camera feed with bounding boxes, species classification, fish length (cm), weight (g), and Health Quality Index (HQI).
4. **National Government Central Dashboard:**
   - Official Ministry of Fisheries & Ocean Resources layout with real-time rolling charts for Dissolved Oxygen, Water Temperature, and Microplastics.
   - Live Ed25519-signed telemetry log with one-click JSON audit export.
5. **Navigational FMCW Radar & Marine Comms:**
   - Realistic 360° phosphor-green rotating radar sweep tracking surface vessels and buoys.
   - Satellite uplink status (Starlink LEO + ISRO NavIC RTK GNSS + HF/UHF mesh).
6. **Physics & Parameter Tuning Panel:**
   - Sliders for Submersible Depth ($0 - 150\text{m}$), Solar Irradiance ($0 - 1200\text{ W/m}^2$), Cruising Speed ($0 - 10\text{ kts}$), Beaufort Sea State (0 to 6), Fish Density, and Ocean Pollution.
   - Scenario triggers: Umbilical tension snag, Hypoxic dead zone, and Illegal trawler detection.
