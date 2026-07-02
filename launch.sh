#!/bin/bash
# Jarvis Launch - starts the Jarvis React dashboard on localhost
# Usage: ./launch.sh  (or say "Jarvis Launch" via Hermes voice command)

cd /Users/reddragon/jarvis-react

# Kill any existing instances
pkill -f "node server.js" 2>/dev/null
pkill -f "vite" 2>/dev/null
sleep 1

# Start the Express API server in background
nohup node server.js > /tmp/jarvis-server.log 2>&1 &
SERVER_PID=$!

# Start the Vite dev server in background
nohup npx vite > /tmp/jarvis-vite.log 2>&1 &
VITE_PID=$!

# Wait for Vite to be ready
for i in $(seq 1 15); do
  if curl -s http://localhost:5173 >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

# Open in browser
open http://localhost:5173

echo "JARVIS is online."
echo "  Dashboard: http://localhost:5173"
echo "  API Server: http://localhost:3001"
echo "  Server PID: $SERVER_PID"
echo "  Vite PID:   $VITE_PID"