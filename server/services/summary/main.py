import os
import openai
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from dotenv import load_dotenv

# Load OpenAI API Key from .env file
load_dotenv()

# Set the API key for OpenAI (from .env file)
openai.api_key = os.getenv("OPENAI_API_KEY")

# Function to get content from GPT for each section
def get_section_from_gpt(section_name, transcript_text):
    prompt = f"""
    You are a medical assistant trained to communicate in a patient-friendly manner. Based on the following transcript, your task is to summarize the '{section_name}' in simple, clear, and compassionate terms that a patient or their caregiver can easily understand. Ensure that the tone is empathetic, and offer reassuring language where appropriate. Also, define any medical terminology that may be unfamiliar to the patient and clarify the next steps they need to take. Your response should be concise and informative, and it should address critical decision-making points.

    Remember that patients may be feeling overwhelmed or anxious, so your response should be supportive and easy to follow. Include any advice or resources that could help the patient feel confident about managing their condition.
    NO GREETINGS
    DO NOT USE BOLD FORMATING OR STATE SECTION NAME
    Transcript:
    {transcript_text}
    """
    try:
        response = openai.ChatCompletion.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a helpful, empathetic assistant with knowledge in healthcare."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=600,
            temperature=0.7
        )
        return response['choices'][0]['message']['content'].strip()
    except Exception as e:
        print(f"Error during GPT request: {e}")
        return ""


# Generate sections based on GPT output
def generate_all_sections(transcript_text):
    sections = {
        "Main Concerns & Diagnosis": get_section_from_gpt("Main Concerns & Diagnosis", transcript_text),
        "Important Words to Know": get_section_from_gpt("Important Words to Know", transcript_text),
        "What Comes Next": get_section_from_gpt("What Comes Next", transcript_text),
        "Treatment Overview": get_section_from_gpt("Treatment Overview", transcript_text),
        "Key Questions Answered": get_section_from_gpt("Key Questions Answered", transcript_text),
        "Resources & Support": get_section_from_gpt("Resources & Support", transcript_text),
    }
    return sections

# Create the PDF from sections
def create_pdf(sections, filename="visit_summary.pdf"):
    c = canvas.Canvas(filename, pagesize=letter)
    width, height = letter

    # Title
    c.setFont("Helvetica-Bold", 18)
    c.drawString(200, height - 40, "Visit Summary")
    c.setFont("Helvetica", 12)

    # Starting position for the content
    y_position = height - 80
    line_height = 14
    margin = 40
    max_line_length = width - 2 * margin

    # Add each section to the PDF
    for section_name, content in sections.items():
        if y_position < 100:
            c.showPage()
            c.setFont("Helvetica-Bold", 18)
            c.drawString(200, height - 40, "Visit Summary")
            c.setFont("Helvetica", 12)
            y_position = height - 80

        # Add section title
        c.setFont("Helvetica-Bold", 14)
        c.drawString(margin, y_position, section_name + ":")
        y_position -= line_height * 2  # Extra space after the title

        # Add content
        c.setFont("Helvetica", 12)
        lines = content.splitlines()

        for line in lines:
            wrapped_lines = wrap_text(line, max_line_length, c)
            for wrapped_line in wrapped_lines:
                c.drawString(margin, y_position, wrapped_line)
                y_position -= line_height

            if y_position < 100:
                c.showPage()
                y_position = height - 80

        y_position -= 20

    c.save()
    print(f"PDF generated successfully: {filename}")

# Helper function to wrap text within the defined width
def wrap_text(text, max_width, canvas_obj):
    wrapped_lines = []
    current_line = ""
    for word in text.split():
        test_line = f"{current_line} {word}".strip()
        if canvas_obj.stringWidth(test_line, "Helvetica", 12) < max_width:
            current_line = test_line
        else:
            wrapped_lines.append(current_line)
            current_line = word
    wrapped_lines.append(current_line)  # Add the last line
    return wrapped_lines

# Main function to generate the PDF from a transcript
def generate_visit_summary_pdf(transcript_text, output_pdf="visit_summary.pdf"):
    sections = generate_all_sections(transcript_text)
    create_pdf(sections, output_pdf)

# Example usage
if __name__ == "__main__":
    transcript_file = "visit_transcript.txt"
    with open(transcript_file, "r") as file:
        transcript_text = file.read()

    generate_visit_summary_pdf(transcript_text)
