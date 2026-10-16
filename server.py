#!/usr/bin/env python3
"""
AquaPulse Oceanic Simulator - Backend Server & Government Gateway API
Serves the interactive simulator web application and provides REST/Telemetry API endpoints.
"""

import os
import sys
import json
import time
from datetime import datetime
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
SIM_DIR = BASE_DIR / "simulator"

# Try importing FastAPI & Uvicorn, fallback to standard http.server
try:
    from fastapi import FastAPI, HTTPException
    from fastapi.staticfiles import StaticFiles
    from fastapi.responses import FileResponse, JSONResponse
    import uvicorn
    USE_FASTAPI = True
except ImportError:
    USE_FASTAPI = False

if USE_FASTAPI:
    app = FastAPI(
        title="AquaPulse Tandem Maritime Gateway API",
        description="REST Telemetry Stream & Government Cloud Integration for Autonomous Solar Pilot Vessel & Tethered Submarine",
        version="2.4.0"
    )

    # In-memory simulated live state
    live_state = {
        "vessel_id": "AP-ASV-IND-042",
        "timestamp_utc": datetime.utcnow().isoformat(),
        "status": "AUTONOMOUS_PATROL",
        "navigation": {
            "latitude": 9.9650,
            "longitude": 76.2200,
            "heading_deg": 268.0,
            "speed_knots": 4.8,
            "active_route": "Cochin Offshore Shelf"
        },
        "power": {
            "battery_pct": 94.2,
            "solar_watts": 845,
            "net_surplus_watts": 280
        },
        "subsea_probe": {
            "depth_meters": 45.0,
            "umbilical_tension_n": 82.4,
            "water_temp_c": 24.6
        },
        "water_quality": {
            "dissolved_oxygen_mg_l": 6.84,
            "ph": 8.14,
            "salinity_psu": 34.8,
            "microplastics_per_m3": 12.4
        },
        "fisheries": {
            "total_count": 1842,
            "health_quality_index": 94.8,
            "biomass_density_kg_m3": 0.42
        }
    }

    @app.get("/api/telemetry")
    def get_telemetry():
        live_state["timestamp_utc"] = datetime.utcnow().isoformat()
        return live_state

    @app.post("/api/subsea/depth")
    def set_depth(target_depth: float):
        if target_depth < 0 or target_depth > 150:
            raise HTTPException(status_code=400, detail="Depth out of range (0-150m)")
        live_state["subsea_probe"]["depth_meters"] = target_depth
        return {"status": "SUCCESS", "target_depth": target_depth}

    @app.get("/api/gov/export")
    def export_gov_report():
        return {
            "regulatory_agency": "National Marine Fisheries & Ocean Regulatory Authority (DoF)",
            "packet_format": "AP-GOV-2.4-CRYPT",
            "vessel_id": live_state["vessel_id"],
            "export_time": datetime.utcnow().isoformat(),
            "telemetry_snapshot": live_state
        }

    # Mount static directory
    app.mount("/", StaticFiles(directory=str(SIM_DIR), html=True), name="static")

    def run_server():
        port = int(os.environ.get("PORT", 8000))
        print(f"================================================================")
        print(f"⚓ AquaPulse ASV-UUV Marine Simulator Server Starting...")
        print(f"📡 Government Telemetry Gateway API & Tactical Web Dashboard")
        print(f"🌐 Access Simulator at: http://localhost:{port}")
        print(f"================================================================")
        uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")

else:
    # Fallback to standard library http.server
    import http.server
    import socketserver

    def run_server():
        port = int(os.environ.get("PORT", 8000))
        os.chdir(str(SIM_DIR))
        Handler = http.server.SimpleHTTPRequestHandler
        print(f"================================================================")
        print(f"⚓ AquaPulse ASV-UUV Marine Simulator (Static HTTP)")
        print(f"🌐 Access Simulator at: http://localhost:{port}")
        print(f"================================================================")
        with socketserver.TCPServer(("", port), Handler) as httpd:
            try:
                httpd.serve_forever()
            except KeyboardInterrupt:
                pass

if __name__ == "__main__":
    run_server()
