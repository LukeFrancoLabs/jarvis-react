#!/bin/bash
# Jarvis Shutdown - stops the Jarvis React dashboard
# Usage: ./shutdown.sh  (or triggered by cron at 5 PM)

# Kill the Express API server
pkill -f "node server.js" 2>/dev/null

# Kill the Vite dev server
pkill -f "vite" 2>/dev/null

# Kill any node processes related to jarvis-react
pkill -f "jarvis-react/server.js" 2>/dev/null

sleep 1

# Verify they're gone
if lsof -i :5173 -i :3001 2>/dev/null | grep -q LISTEN; then
  echo "WARNING: Some Jarvis processes may still be running."
  lsof -i :5173 -i :3001 2>/dev/null
else
  echo "JARVIS is offline. Dashboard and API server shut down."
fi