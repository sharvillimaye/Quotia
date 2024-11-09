import speech_recognition as sr
import language_tool_python

# Initialize the grammar correction tool
tool = language_tool_python.LanguageTool('en-US')

def correct_grammar(text):
    matches = tool.check(text)
    corrected_text = language_tool_python.utils.correct(text, matches)
    return corrected_text

def live_transcription():
    recognizer = sr.Recognizer()

    with sr.Microphone() as source:
        print("Adjusting for ambient noise... Please wait.")
        recognizer.adjust_for_ambient_noise(source, duration=1)
        print("Ready to transcribe live audio.")
        
        # Start with an initial energy threshold
        recognizer.energy_threshold = recognizer.energy_threshold

        try:
            while True:
                print("Listening...")

                # Periodically adjust the energy threshold to adapt to the environment
                recognizer.adjust_for_ambient_noise(source, duration=1)
               #print(f"Current energy threshold: {recognizer.energy_threshold}")

                audio = recognizer.listen(source, timeout=120, phrase_time_limit=120)

                try:
                    # Transcribe audio to text
                    text = recognizer.recognize_google(audio, show_all=False)
                    corrected_text = correct_grammar(text)
                    print(f"Corrected Transcription: {corrected_text}")

                except sr.UnknownValueError:
                    print("Could not understand audio. Retrying...")

                except sr.RequestError as e:
                    print(f"API error; {e}")

        except KeyboardInterrupt:
            print("\nStopped by user.")

live_transcription()
