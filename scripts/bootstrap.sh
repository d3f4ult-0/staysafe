#!/usr/bin/env bash
set -e

echo "=== Bengal Safety Map: Local Bootstrap ==="

# 1. Check Python virtual environment
if [ ! -d ".venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv .venv
fi
source .venv/bin/activate

echo "Installing Python dependencies..."
pip install --upgrade pip
pip install -r <(cat <<EOF
fastapi
uvicorn
pydantic
pydantic-settings
sqlalchemy
psycopg[binary]
geoalchemy2
shapely
pytest
httpx
python-dateutil
requests
EOF
)

# 2. Check Node / npm dependencies
echo "Installing Web npm dependencies..."
npm --prefix apps/web install

# 3. Database initialization
echo "Initializing Database Tables & Seeding Synthetic Pilot Demo..."
PYTHONPATH=apps/api/src python3 -m bengal_safety_map.cli db init
PYTHONPATH=apps/api/src python3 -m bengal_safety_map.cli seed demo
PYTHONPATH=apps/api/src python3 -m bengal_safety_map.cli package build --area kolkata_metro

echo "=== Bootstrap Complete ==="
echo "Start Backend:  source .venv/bin/activate && PYTHONPATH=apps/api/src uvicorn bengal_safety_map.main:app --reload --port 8000"
echo "Start Frontend: npm --prefix apps/web run dev"
