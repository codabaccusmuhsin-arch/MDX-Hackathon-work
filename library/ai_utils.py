# library/ai_utils.py
import os
import requests
import numpy as np
from library.models import Spell

# Make sure you have set your JINA_AUTH_TOKEN in environment variables
JINA_API_KEY = os.getenv("JINA_AUTH_TOKEN")

def embed_query(query: str):
    """
    Converts a text query into an embedding vector using Jina's API.
    """
    if not JINA_API_KEY:
        raise ValueError("JINA_AUTH_TOKEN is not set in your environment!")

    url = "https://api.jina.ai/v1/embeddings"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {JINA_API_KEY}"
    }
    payload = {
        "input": query,
        "model": "jina-embeddings-v2-base-en"
    }

    response = requests.post(url, headers=headers, json=payload)
    response.raise_for_status()  # Raise an error if API fails

    # The embedding is returned as a list of floats
    embedding = response.json()["data"][0]["embedding"]
    return embedding


def embed_text(text: str):
    """
    Alias for embed_query, used for consistency in other parts of the code.
    """
    return embed_query(text)


def cosine_similarity(vec1, vec2):
    """
    Compute cosine similarity between two vectors.
    """
    v1 = np.array(vec1, dtype=float)
    v2 = np.array(vec2, dtype=float)
    if v1.shape != v2.shape:
        raise ValueError("Vector shapes do not match for cosine similarity.")
    return np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2))


def search_spells(query: str, limit: int = 5):
    """
    Search for spells using a query string and return the most similar results.
    """
    query_embedding = embed_query(query)
    results = []

    for spell in Spell.objects.exclude(embedding=None):
        similarity = cosine_similarity(query_embedding, spell.embedding)
        results.append({
            "id": spell.id,
            "name": spell.name,
            "description": spell.description,
            "similarity": float(similarity)
        })

    # Sort results by similarity descending
    results.sort(key=lambda x: x["similarity"], reverse=True)

    # Return top results
    return results[:limit]
