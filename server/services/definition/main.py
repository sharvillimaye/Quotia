import os
from dotenv import load_dotenv
import openai
import json

load_dotenv()

# Set the API key
openai.api_key = os.getenv("OPENAI_API_KEY")


# Function to call OpenAI GPT-4o mini model (chat version) and get the output
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


    # Call OpenAI's GPT-4o mini model using the chat-based API
    response = openai.ChatCompletion.create(
        model="gpt-4o-mini",  # Using the correct model for chat-based completion
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=150,
        temperature=0.7
    )


    # Extract the GPT output
    output = response['choices'][0]['message']['content'].strip()


    # Parse the output and ensure it's in valid JSON format
    try:
        terms = json.loads(output)
    except json.JSONDecodeError:
        # In case there's an error in decoding, return an empty dictionary
        terms = {}


    # Return the properly formatted JSON output
    return json.dumps(terms, indent=4)


# Example usage
if __name__ == "__main__":
    # Example paragraph
    paragraph = """
    The patient was diagnosed with diabetes and referred for a blood sugar test. The doctor mentioned that the patient might need insulin treatment depending on the results.
    """


    # Get the formatted response
    result = get_gpt_response(paragraph)
    print(result)