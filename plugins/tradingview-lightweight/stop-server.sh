#!/usr/bin/env bash
# Stop the local Deephaven server and close the browser.
# Kill both the port holder AND any deephaven zombie processes.
lsof -ti:10000 2>/dev/null | xargs kill -9 2>/dev/null || true
ps aux | grep -E "[d]eephaven.*server-venv" | awk '{print $2}' | xargs kill -9 2>/dev/null || true
# Clean up zombie deephaven processes
ps aux | grep "[d]eephaven" | grep defunct | awk '{print $2}' | xargs kill -9 2>/dev/null || true
sleep 1
echo "Server stopped."
agent-browser close 2>/dev/null || true
