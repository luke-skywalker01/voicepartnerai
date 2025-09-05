# Verwende ein offizielles Python-Image als Basis
FROM python:3.9-slim

# Setze das Arbeitsverzeichnis im Container
WORKDIR /app

# Kopiere zuerst nur die requirements.txt für bessere Layer-Caching
COPY requirements.txt .

# Installiere Python-Dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Kopiere den Anwendungscode in den Container
COPY . .

# Exponiere den Port, auf dem die Anwendung läuft
EXPOSE 8000

# Setze Umgebungsvariablen für bessere Performance
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Definiere den Befehl zum Starten der Anwendung
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]