#!/usr/bin/env bash
# AquaPulse Simulator Launcher Script

PORT=8000
echo "=========================================================="
echo "⚓ Starting AquaPulse ASV-UUV Marine Intelligence Simulator"
echo "=========================================================="

# Check if port 8000 is occupied, if so use next available
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️ Port $PORT is already in use. Switching to port 8080..."
    PORT=8080
fi

# Launch server in background or foreground
echo "🚀 Launching Python Telemetry Server on http://localhost:$PORT ..."
PORT=$PORT python3 server.py &
SERVER_PID=$!

sleep 1.5

# Open browser on macOS
if command -v open >/dev/null 2>&1; then
    open "http://localhost:$PORT"
elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "http://localhost:$PORT"
fi

echo "✅ Simulator running! Press Ctrl+C to terminate."
wait $SERVER_PID
