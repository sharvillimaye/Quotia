import lancedb
import torch
from transformers import AutoTokenizer, AutoModel
import numpy as np

# Step 1: Load pre-trained BERT model to generate query embeddings
model_name = "bert-base-uncased"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModel.from_pretrained(model_name)

# Step 2: Connect to the existing database
uri = "medical_terms_db"
db = lancedb.connect(uri)

# Step 3: Open the medical_terms table
tbl = db.open_table("medical_terms")

# Step 4: Function to generate embeddings for search query
def generate_query_embedding(query):
    inputs = tokenizer(query, return_tensors="pt")
    outputs = model(**inputs)
    return outputs.last_hidden_state.mean(dim=1).squeeze()

# Step 5: Function to search for medical terms based on query
def search_medical_terms(query, top_k=3):
    query_embedding = generate_query_embedding(query).numpy()  # Convert tensor to numpy array
    # Perform similarity search on LanceDB (find closest vectors)
    results = tbl.search(query_embedding).limit(top_k).to_pandas()

    print("Top matched medical terms:")
    for _, result in results.iterrows():
        term = result["term"]
        definition = result["definition"]
        print(f"{term}: {definition}")

# Step 6: Example search
search_query = "high blood pressure"  # Change this to test different queries
search_medical_terms(search_query)
