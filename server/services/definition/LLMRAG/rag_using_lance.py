import os
import torch
from transformers import BertTokenizer, BertForSequenceClassification
from langchain.chains import RetrievalQA
from langchain.embeddings import Embedding
from langchain.vectorstores import LanceDB
from langchain.llms import OpenAI
from dotenv import load_dotenv
from lancedb import connect
from lancedb.pydantic import LanceModel, Vector

# Load environment variables from .env
load_dotenv()

# Connect to your LanceDB
db_path = "lance_vector_db"
db = connect(db_path)

# Define the schema for the table if not already defined (based on your original code)
class Words(LanceModel):
    text: str
    vector: Vector(768)  # BERT embeddings are 768-dimensional

# Reconnect to the table of embeddings
table = db["terms_embeddings"]

# Initialize BERT tokenizer and model for retrieval
tokenizer = BertTokenizer.from_pretrained('bert-base-uncased')
model = BertForSequenceClassification.from_pretrained('bert-base-uncased')

# Function to generate embeddings using BERT
def generate_bert_embedding(text: str):
    inputs = tokenizer(text, return_tensors='pt', truncation=True, padding=True, max_length=512)
    with torch.no_grad():
        outputs = model(**inputs)
    embedding = outputs.last_hidden_state.mean(dim=1).squeeze().numpy()
    return embedding

# Define the custom embedding class
class BertEmbedding(Embedding):
    def embed(self, texts):
        return [generate_bert_embedding(text) for text in texts]

# Create LangChain vector store using the LanceDB data
embedding_model = BertEmbedding()
vectorstore = LanceDB.from_lance_table(table, embedding_model)

# Initialize OpenAI's LLM (you can replace with any other LLM you like)
llm = OpenAI(temperature=0.5, openai_api_key=os.getenv("OPENAI_API_KEY"))

# Create the RetrievalQA chain
qa_chain = RetrievalQA.from_chain_type(llm, chain_type="map_reduce", retriever=vectorstore.as_retriever())

# Function to query the RAG model
def query_rag_model(query: str):
    answer = qa_chain.run(query)
    return answer

if __name__ == "__main__":
    query = input("Enter your query: ")
    answer = query_rag_model(query)
    print("Answer:", answer)
