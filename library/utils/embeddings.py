from openai import OpenAI

client = OpenAI(api_key="YOUR_API_KEY")

def generate_embedding_for_spell(text):
    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=text
    )
    return response.data[0].embedding
