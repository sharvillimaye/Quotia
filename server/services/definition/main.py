import os
import openai
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import uvicorn
from mysql.connector import Error

load_dotenv()

# Set the API key for OpenAI
openai.api_key = os.getenv("OPENAI_API_KEY")


# Initialize FastAPI
app = FastAPI()

# Disable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

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

    # try:
    #     connection = mysql.connector.connect(
    #         host=os.getenv("DB_HOST"),
    #         user=os.getenv("DB_USER"),
    #         password=os.getenv("DB_PASSWORD"),
    #         database=os.getenv("DB_NAME")
    #     )

    #     if connection.is_connected():
    #         cursor = connection.cursor()

    #         # Insert a new meeting into the meetings table
    #         insert_query = """
    #         INSERT INTO meetings (transcript)
    #         VALUES (%s)
    #         """
    #         transcript = paragraph_input.paragraph
    #         cursor.execute(insert_query, (transcript))

    #         # Commit the transaction
    #         connection.commit()

    #         # Get the ID of the newly created meeting
    #         meeting_id = cursor.lastrowid

    #         # Insert the key terms into the keyterms table
    #         insert_keyterms_query = """
    #         INSERT INTO keyterms (terms, meetingId)
    #         VALUES (%s, %s)
    #         """
    #         terms_json = terms
    #         cursor.execute(insert_keyterms_query, (terms_json, meeting_id))

    #         # Commit the transaction
    #         connection.commit()

    # except Error as e:
    #     raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

    # finally:
    #     if connection.is_connected():
    #         cursor.close()
    #         connection.close()
    
    return {"terms": terms}

@app.get("/meetings", response_model=list)
async def get_all_meetings():
    try:
        connection = mysql.connector.connect(
            host=os.getenv("DB_HOST"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            database=os.getenv("DB_NAME")
        )

        if connection.is_connected():
            cursor = connection.cursor(dictionary=True)

            # Query to get all meetings
            select_query = "SELECT * FROM meetings"
            cursor.execute(select_query)
            meetings = cursor.fetchall()

    except Error as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

    return meetings

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)  # Change the port number here