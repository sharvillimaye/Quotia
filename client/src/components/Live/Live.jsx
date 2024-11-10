import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff } from 'lucide-react';

// Custom hook for speech recognition
const useSpeechRecognition = () => {
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState(null);
  const lastFinalTranscriptRef = useRef('');

  // Check if browser supports speech recognition
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = SpeechRecognition ? new SpeechRecognition() : null;

  useEffect(() => {
    if (!recognition) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let interimText = '';
      let finalText = '';

      // Process all results
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          const newText = result[0].transcript.trim();
          // Only add if it's not a duplicate of the last final transcript
          if (newText !== lastFinalTranscriptRef.current) {
            finalText = newText;
            lastFinalTranscriptRef.current = newText;
          }
        } else {
          interimText = result[0].transcript;
        }
      }

      setInterimTranscript(interimText);
      if (finalText) {
        setTranscript(prev => {
          const newTranscript = prev ? `${prev} ${finalText}` : finalText;
          return newTranscript;
        });
      }
    };

    recognition.onend = () => {
      if (isListening) {
        recognition.start();
      }
    };

    recognition.onerror = (event) => {
      setError(`Error occurred in recognition: ${event.error}`);
      setIsListening(false);
    };

    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, [isListening]);

  const startListening = useCallback(() => {
    if (!recognition) return;
    
    setTranscript('');
    setInterimTranscript('');
    setError(null);
    lastFinalTranscriptRef.current = '';
    setIsListening(true);
    try {
      recognition.start();
    } catch (err) {
      console.log('Recognition already started');
    }
  }, [recognition]);

  const stopListening = useCallback(() => {
    if (!recognition) return;
    
    setIsListening(false);
    setInterimTranscript('');
    recognition.stop();
    lastFinalTranscriptRef.current = '';
  }, [recognition]);

  return {
    transcript,
    interimTranscript,
    isListening,
    error,
    startListening,
    stopListening,
    hasSupport: !!recognition
  };
};

function Live() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const {
    transcript,
    interimTranscript,
    isListening,
    error,
    startListening,
    stopListening,
    hasSupport
  } = useSpeechRecognition();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleSendMessage = () => {
    if (input.trim()) {
      setMessages([...messages, { user: true, text: input }]);
      setInput('');
      setTimeout(() => {
        setMessages((prevMessages) => [
          ...prevMessages,
          { user: false, text: "This is a bot response." }
        ]);
      }, 1000);
    }
  };

  const toggleTranscription = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-gray-800 border-b border-gray-700">
        <h1 className="text-2xl font-bold text-white">Live Session</h1>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleLogout} 
            className="px-4 py-2 bg-white text-black rounded"
          >
            Log Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-hidden">
        <div className="grid grid-cols-12 gap-6 h-full max-w-8xl mx-auto">
          {/* Chatbot Section */}
          <div className="col-span-12 lg:col-span-6 flex flex-col bg-gray-800 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white">Chatbot</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.user ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      msg.user
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-100'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-gray-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSendMessage}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Send
                </button>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="col-span-12 lg:col-span-6 flex flex-col gap-6">
            {/* Live Transcription */}
            <div className="flex-1 bg-gray-800 rounded-lg overflow-hidden">
              <div className="p-4 border-b border-gray-700">
                <h2 className="text-lg font-semibold text-white">Live Transcription</h2>
              </div>
              <div className="p-4 h-[calc(100%-120px)] overflow-y-auto">
                <div className="bg-gray-700 p-4 rounded-lg text-gray-100 h-full relative">
                  {!hasSupport ? (
                    <div className="text-yellow-400">
                      Speech recognition is not supported in this browser. Please try Chrome, Edge, or Safari.
                    </div>
                  ) : error ? (
                    <div className="text-red-400">{error}</div>
                  ) : (
                    <div className="whitespace-pre-wrap">
                      {transcript}
                      <span className="text-gray-400">{interimTranscript}</span>
                    </div>
                  )}
                  {isListening && (
                    <div className="absolute top-2 right-2">
                      <div className="animate-pulse">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-2 border-t border-gray-700">
                <button
                  onClick={toggleTranscription}
                  disabled={!hasSupport}
                  className={`w-full px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                    isListening 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  } text-white ${!hasSupport && 'opacity-50 cursor-not-allowed'}`}
                >
                  {isListening ? (
                    <>
                      <MicOff size={20} />
                      Stop Transcription
                    </>
                  ) : (
                    <>
                      <Mic size={20} />
                      Start Transcription
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Key Terms */}
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="p-4 border-b border-gray-700">
                <h2 className="text-lg font-semibold text-white">Key Terms</h2>
              </div>
              <div className="p-4">
                <ul className="space-y-2 text-gray-100">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span className="font-medium">Term 1:</span> Definition
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span className="font-medium">Term 2:</span> Definition
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span className="font-medium">Term 3:</span> Definition
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Live;