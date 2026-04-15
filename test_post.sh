#!/bin/bash
# Start API in background
dotnet run --project SportCenter.Api/SportCenter.Api.csproj > /tmp/api.log 2>&1 &
SERVER_PID=$!

# Wait for API to be ready (max 15 seconds)
for i in {1..30}; do
  if curl -s http://localhost:5172/api/events > /dev/null 2>&1; then
    echo "API is ready"
    break
  fi
  sleep 1
done

# Send POST request
echo "Sending POST request..."
RESPONSE=$(curl -s -X POST http://localhost:5172/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "name": "UTC Test",
    "description": "Testing UTC conversion",
    "category": "Sport",
    "startTime": "2026-04-16T10:00:00",
    "endTime": "2026-04-16T12:00:00",
    "locations": [{ "locationId": 1 }],
    "templateId": null,
    "createdBy": "test",
    "isRecurring": false,
    "recurrenceFrequency": null,
    "recurrenceEndDate": null,
    "isDraft": false
  }')

echo "Response: $RESPONSE"

# Extract ID
ID=$(echo $RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
echo "Created event ID: $ID"

# Kill server
kill $SERVER_PID 2>/dev/null
wait $SERVER_PID 2>/dev/null

echo "Test complete."
