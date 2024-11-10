import os
import openai
import json
import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import uvicorn

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Set the API key for OpenAI
openai.api_key = os.getenv("OPENAI_API_KEY")
if not openai.api_key:
    logging.error("OpenAI API key not set. Make sure to set the OPENAI_API_KEY environment variable.")

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
class UserInput(BaseModel):
    question: str

class ChatbotResponse(BaseModel):
    response: str

# Function to call OpenAI GPT-4o mini model
def get_medical_chatbot_response(user_input):
    prompt = f"""
    You are a chatbot that specializes in helping elderly, disabled, or patients with difficulty understanding complex medical terms. You are highly versed in medical terminology but must provide explanations in simple, clear language to make sure patients of all ages and abilities can understand. When explaining complex medical concepts, be sure to:
    
    - Define any medical terms or jargon in simple terms.
    - Provide empathetic and reassuring responses.
    - Break down any next steps or treatments in easy-to-follow language, with clear instructions.
    - Be emotionally sensitive and supportive, especially when dealing with difficult diagnoses.
    
    Answer the following question or statement about a medical term or condition:
    
    "{user_input}"
    
    Be sure to provide clear, understandable answers with a focus on comfort, clarity, and simplicity.
    """

    logging.debug(f"Generated prompt for OpenAI: {prompt}")

    try:
        response = openai.ChatCompletion.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a helpful assistant designed to assist elderly, disabled, and patients with medical terminology and diagnoses in an easy-to-understand, patient-friendly manner."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=300,
            temperature=0.7
        )
        logging.debug(f"OpenAI response: {response}")
        return response['choices'][0]['message']['content'].strip()
    except Exception as e:
        logging.error(f"Error communicating with OpenAI API: {e}")
        raise HTTPException(status_code=500, detail="Error communicating with OpenAI API.")

# API endpoint for the chatbot
@app.post("/medical-chatbot", response_model=ChatbotResponse)
async def medical_chatbot_endpoint(user_input: UserInput):
    logging.debug(f"Received user input: {user_input.question}")
    response = get_medical_chatbot_response(user_input.question)
    logging.debug(f"Response to be sent: {response}")
    return {"response": response}

if __name__ == "__main__":
    logging.info("Starting server...")
    uvicorn.run(app, host="0.0.0.0", port=8000)  # Change the port number here