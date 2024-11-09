import lancedb
import torch
from transformers import AutoTokenizer, AutoModel
import numpy as np
import pyarrow as pa  # Import PyArrow for schema creation

# Step 1: Load pre-trained BERT model to generate embeddings
model_name = "bert-base-uncased"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModel.from_pretrained(model_name)

# Step 2: Create medical terms with definitions
medical_terms = {
    "Diabetes": "A disease that occurs when your blood glucose, also called blood sugar, is too high.",
    "Hypertension": "A condition in which the force of the blood against the artery walls is too high.",
    "Cancer": "A disease in which some body cells grow uncontrollably and spread to other parts of the body.",
    "Asthma": "A condition in which your airways narrow and swell and may produce extra mucus, making breathing difficult."
}

# Step 3: Generate embeddings for each term
def generate_embedding(term):
    inputs = tokenizer(term, return_tensors="pt")
    outputs = model(**inputs)
    # Detach tensor from the computation graph and convert it to a NumPy array
    return outputs.last_hidden_state.mean(dim=1).squeeze().detach().numpy()

# Step 4: Connect to LanceDB and create a database
uri = "medical_terms_db"
db = lancedb.connect(uri)

# Step 5: Define schema using pyarrow
schema = pa.schema([
    ('term', pa.string()),
    ('definition', pa.string()),
    ('embedding', pa.list_(pa.float32()))  # Adjust this based on embedding size (768 for BERT)
])

# Step 6: Create a table with the schema in the database, using 'overwrite' mode
tbl = db.create_table("medical_terms", schema=schema, mode="overwrite")

# Step 7: Insert data into the table
for term, definition in medical_terms.items():
    embedding = generate_embedding(definition)  # Get the embedding as a NumPy array
    tbl.add([{"term": term, "definition": definition, "embedding": embedding}])

print("Vector database created and embeddings inserted successfully!")
