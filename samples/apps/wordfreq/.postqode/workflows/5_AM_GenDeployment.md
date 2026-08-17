<context>
Read `design.md`, specifically the Resolved Decisions section.
</context>

<task>
Add deployment instructions to `deploy.md` for running the app locally. The app must run using Flask's built-in development server (app.run()), bound to host 0.0.0.0, reading the port from the PORT environment variable with a default of 8000, and with threaded=True to handle concurrent requests. Provide start commands for both bash/macOS/Linux (PORT=8000 python app.py) and Windows PowerShell ($env:PORT=8000; python app.py). Include a step to confirm the app responds correctly, e.g. curl -I http://localhost:8000, and note the URL to open in a browser (http://localhost:8000).
</task>

<constraints>
Do not include instructions for exposing the app publicly (no localtunnel, ngrok, or hosting platforms). This is for local use only. Do not introduce Gunicorn or any other WSGI server, use only Flask's built-in dev server. Save output to `deploy.md`.
</constraints>