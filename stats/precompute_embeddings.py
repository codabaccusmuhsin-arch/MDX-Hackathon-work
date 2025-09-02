import os
import pickle
import pandas as pd
from sentence_transformers import SentenceTransformer

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.join(BASE_DIR, 'datasets', 'my_data.xlsx')
OUTPUT_PATH = os.path.join(BASE_DIR, 'datasets', 'embeddings.pkl')

# Load dataset
df = pd.read_excel(DATASET_PATH)
dataset_text = df.astype(str).values.flatten().tolist()

# Load embedding model
model = SentenceTransformer('all-MiniLM-L6-v2')
dataset_embeddings = model.encode(dataset_text)

# Save to pickle
with open(OUTPUT_PATH, 'wb') as f:
    pickle.dump((dataset_text, dataset_embeddings), f)

print(f"Embeddings saved to {OUTPUT_PATH}")
