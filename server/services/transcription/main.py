import speech_recognition as sr

def live_transcription():
    recognizer = sr.Recognizer()

    with sr.Microphone() as source:
        print("Adjusting for ambient noise... Please wait.")
        recognizer.adjust_for_ambient_noise(source)
        print("Ready to transcribe live audio.")

        try:
            while True:
                print("Listening...")
                audio = recognizer.listen(source, timeout=5, phrase_time_limit=5)

                try:
                    # Transcribe audio to text
                    text = recognizer.recognize_google(audio)
                    print(f"Transcription: {text}")

                except sr.UnknownValueError:
                    print("Could not understand audio.")
                except sr.RequestError as e:
                    print(f"API error; {e}")

        except KeyboardInterrupt:
            print("\nStopped by user.")

live_transcription()
