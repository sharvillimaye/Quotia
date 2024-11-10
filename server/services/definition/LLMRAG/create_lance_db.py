import json
import torch
from transformers import BertTokenizer, BertModel
from lancedb import connect
from lancedb.pydantic import LanceModel, Vector
from dotenv import load_dotenv

# Load environment variables from .env (if needed for other configurations)
load_dotenv()

# Load the terms and definitions from terms.json
with open('terms.json', 'r') as f:
    terms_data = json.load(f)

# Initialize Lance DB (create new or overwrite existing)
db_path = "lance_vector_db"
db = connect(db_path)

# Define the schema for the table using LanceModel
class Words(LanceModel):
    text: str
    vector: Vector(768)  # BERT embeddings are 768-dimensional

# Create the table without indexes (we don't need an index for text)
table = db.create_table(
    "terms_embeddings",
    schema=Words,
    mode="overwrite",
)

# Initialize BERT tokenizer and model
tokenizer = BertTokenizer.from_pretrained('bert-base-uncased')
model = BertModel.from_pretrained('bert-base-uncased')

# Function to generate embeddings using BERT
def generate_bert_embedding(text: str):
    # Encode text to tensor
    inputs = tokenizer(text, return_tensors='pt', truncation=True, padding=True, max_length=512)
    with torch.no_grad():
        outputs = model(**inputs)
    # Use the last hidden state for embedding
    embedding = outputs.last_hidden_state.mean(dim=1).squeeze().numpy()  # Mean pooling over token embeddings
    return embedding

# Process each term and store it in the database
for term_data in terms_data:
    term = term_data['term']
    definition = term_data['definition']
    embedding = generate_bert_embedding(f"{term}: {definition}")

    # Add the term and embedding to the table
    table.add([{
        "text": f"{term}: {definition}",
        "vector": embedding.tolist()  # Convert the numpy array to a list
    }])

print("Terms and embeddings have been successfully stored in LanceDB.")
