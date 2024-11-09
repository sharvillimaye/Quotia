import os
from dotenv import load_dotenv
import openai
import json

load_dotenv()

# Set the API key
openai.api_key = os.getenv("OPENAI_API_KEY")


# Function to call OpenAI GPT-4o mini model (chat version) and get the output
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


    # Call OpenAI's GPT-4o mini model using the chat-based API
    response = openai.ChatCompletion.create(
        model="gpt-4o-mini",  # Using the correct model for chat-based completion
        messages=[
            {"role": "system", "content": "You are a helpful assistant designed to assist elderly, disabled, and patients with medical terminology and diagnoses in an easy-to-understand, patient-friendly manner."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=300,  # Allow more tokens for a more detailed explanation
        temperature=0.7
    )


    # Extract and return the response from GPT
    return response['choices'][0]['message']['content'].strip()


# Main function for terminal-based interaction with the chatbot
def run_medical_chatbot():
    print("Welcome to the Patient-Friendly Medical Terminology Chatbot!")
    print("This chatbot helps you understand medical terms and conditions in a simple, clear way.")
    print("You can ask questions related to medical terms, conditions, treatments, or next steps.")
    print("Type 'exit' to end the chat.")


    while True:
        # Get user input (question about medical terms or conditions)
        user_input = input("\nYou: ")


        # Check if the user wants to exit the conversation
        if user_input.lower() == 'exit':
            print("Goodbye! Stay healthy and take care.")
            break
       
        # Get the chatbot's response based on the input
        response = get_medical_chatbot_response(user_input)
       
        # Display the chatbot's response
        print("\nChatbot:", response)


# Example usage
if __name__ == "__main__":
    run_medical_chatbot()