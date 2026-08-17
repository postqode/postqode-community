Here are the answers to your questions, and any other decisions you need that I haven't addressed:

Language and framework: Python with Flask
Max input length: 5,000 characters
No file system access, no database, no user accounts, stateless requests only
Color palette: 
#FFFFFF background, 
#0A2540 text, 
#635BFF accent
Font: Inter, system-ui, sans-serif
No external CSS frameworks, no icons, no images
Server: Flask built-in development server, host 0.0.0.0, port from PORT environment variable, default 8000, threaded=True
Startup commands must be documented for both bash/macOS/Linux (PORT=8000 python app.py) and Windows PowerShell ($env:PORT=8000; python app.py)
Testing library: pytest
Dependency management: requirements.txt (no Poetry, no pipenv)