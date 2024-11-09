import os
import openai
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

# Set the API key for OpenAI
openai.api_key = os.getenv("OPENAI_API_KEY")

# Initialize FastAPI
app = FastAPI()

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
        return response['choices'][0]['message']['content'].strip()
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error communicating with OpenAI API.")

# API endpoint for the chatbot
@app.post("/medical-chatbot", response_model=ChatbotResponse)
async def medical_chatbot_endpoint(user_input: UserInput):
    response = get_medical_chatbot_response(user_input.question)
    return {"response": response}