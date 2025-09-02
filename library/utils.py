from jina import Flow, Document
import os

# Replace with your actual token
os.environ["JINA_AUTH_TOKEN"] = "jina_45f5513546da4aa38aa73a87a4e6b9c0wxx5yL0-669DODr84WI3-yhEq3Gi"


# Function to generate embedding for a single spell text
def generate_embedding_for_spell(text: str):
    """
    Generate an embedding vector for a given spell description using Jina.
    Returns a list of floats.
    """
    # Wrap the text in a Jina Document
    doc = Document(text=text)

    # Create a temporary Flow with the transformer encoder from Jina Hub
    f = Flow().add(
        uses='jinahub+docker://TransformerTorchEncoder',
        uses_with={'model_name': 'sentence-transformers/all-MiniLM-L6-v2'}
    )

    with f:
        # Post the document to the Flow and get results
        response = f.post('/', inputs=doc, return_results=True)

    # Extract embedding from the response
    embedding_vector = response[0].docs[0].embedding
    return embedding_vector
