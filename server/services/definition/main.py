import os
import openai
import json
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
import uvicorn

load_dotenv()

# Set the API key for OpenAI
openai.api_key = os.getenv("OPENAI_API_KEY")

# Initialize FastAPI
app = FastAPI()

# Define request and response models
class ParagraphInput(BaseModel):
    paragraph: str

class TermsResponse(BaseModel):
    terms: dict

# Function to call OpenAI GPT-4o mini model
def get_gpt_response(paragraph):
    prompt = f"""
    Given the following paragraph, identify the key medical terms and provide a brief definition for each term in plain text.

    "{paragraph}"

    Please respond with the key terms and their definitions in pure JSON format, without any numbering or special formatting (e.g. no bold, italics).

    Example format:

    {{
        "Diabetes": "A chronic medical condition characterized by high blood sugar levels due to the body's inability to produce or effectively use insulin.",
        "Blood Sugar Test": "A medical test that measures the concentration of glucose in the blood to assess an individual's blood sugar levels.",
        "Insulin Treatment": "A therapy involving the administration of insulin to help regulate blood sugar levels in individuals with diabetes."
    }}
    """

    try:
        response = openai.ChatCompletion.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=150,
            temperature=0.7
        )

        output = response['choices'][0]['message']['content'].strip()

        # Parse the output to ensure it's valid JSON
        terms = json.loads(output)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error communicating with OpenAI API or parsing response.")

    return terms

# API endpoint for the term extraction functionality
@app.post("/extract-medical-terms", response_model=TermsResponse)
async def extract_medical_terms(paragraph_input: ParagraphInput):
    terms = get_gpt_response(paragraph_input.paragraph)
    return {"terms": terms}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)  # Change the port number here