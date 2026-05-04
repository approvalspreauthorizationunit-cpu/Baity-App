#!/bin/bash

# Configuration
# Read from environment or .env.local
if [ -f .env.local ]; then
  export $(grep -v '^#' .env.local | xargs)
fi

PROJECT_REF=$SUPABASE_PROJECT_REF
# SUPABASE_ACCESS_TOKEN should be set in environment or .env.local

if [ -z "$PROJECT_REF" ]; then
  echo "Error: SUPABASE_PROJECT_REF is not set."
  exit 1
fi

if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
  echo "Error: SUPABASE_ACCESS_TOKEN is not set."
  exit 1
fi

functions=("calculate-order-totals" "process-order-completion" "process-withdrawal")

for name in "${functions[@]}"; do
  echo "--- Deploying function: $name ---"

  code_file="supabase/functions/$name/index.ts"

  if [ ! -f "$code_file" ]; then
    echo "Error: Function code not found at $code_file"
    continue
  fi

  # 1. Check if function exists
  status_code=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
    "https://api.supabase.com/v1/projects/$PROJECT_REF/functions/$name")

  if [ "$status_code" -eq 200 ]; then
    echo "Updating existing function..."
    curl -X PATCH "https://api.supabase.com/v1/projects/$PROJECT_REF/functions/$name" \
      -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"body\": \"$(cat $code_file | sed 's/"/\\"/g' | awk '{printf "%s\\n", $0}' | tr -d '\r')\"}"
  else
    echo "Creating new function..."
    curl -X POST "https://api.supabase.com/v1/projects/$PROJECT_REF/functions" \
      -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"name\": \"$name\",
        \"slug\": \"$name\",
        \"import_map\": true,
        \"verify_jwt\": true,
        \"body\": \"$(cat $code_file | sed 's/"/\\"/g' | awk '{printf "%s\\n", $0}' | tr -d '\r')\"
      }"
  fi

  echo -e "\nDeployment attempt for $name finished.\n"
done
