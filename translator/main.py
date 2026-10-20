
from fastapi import FastAPI

app = FastAPI(
    title="Polyglot Translation Service",
    version="0.1.0",
)

@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "polyglot-translator",
        "model_loaded": False,
    }
