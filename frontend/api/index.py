import os
import sys

# Ensure backend and root are in sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
frontend_dir = os.path.dirname(current_dir)
root_dir = os.path.dirname(frontend_dir)
backend_dir = os.path.join(root_dir, "backend")

for p in [root_dir, backend_dir, frontend_dir]:
    if p not in sys.path:
        sys.path.insert(0, p)

from backend.main import app
