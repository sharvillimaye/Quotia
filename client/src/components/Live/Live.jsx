import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Download, FileText, FileDown, ChevronLeft, Search } from 'lucide-react';

// Custom hook for speech recognition
const useSpeechRecognition = () => {
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState(null);
  const lastFinalTranscriptRef = useRef('');
  const recognitionRef = useRef(null);

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  useEffect(() => {
    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }

    if (!recognitionRef.current) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        let interimText = '';
        let finalText = '';

        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            const newText = result[0].transcript.trim();
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

      recognitionRef.current.onerror = (event) => {
        setError(`Error occurred in recognition: ${event.error}`);
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const notifyTranscriptionPaused = async (transcriptData) => {
    try {
      const response = await fetch('http://0.0.0.0:8001/extract-medical-terms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paragraph: transcriptData,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to notify server about transcription pause');
      }

      const data = await response.json();
      return data.terms;
    } catch (error) {
      console.error('Error notifying transcription pause:', error);
      return null;
    }
  };

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    
    setTranscript('');
    setInterimTranscript('');
    setError(null);
    lastFinalTranscriptRef.current = '';
    
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (err) {
      if (err.name === 'InvalidStateError') {
        recognitionRef.current.stop();
        setTimeout(() => {
          recognitionRef.current.start();
          setIsListening(true);
        }, 100);
      } else {
        console.error('Recognition error:', err);
        setError('Failed to start recognition');
      }
    }
  }, []);

  const stopListening = useCallback(async () => {
    if (!recognitionRef.current) return;
    
    try {
      recognitionRef.current.stop();
      setIsListening(false);
      setInterimTranscript('');
      
      const response = await notifyTranscriptionPaused(transcript);
      lastFinalTranscriptRef.current = '';
      return response;
    } catch (err) {
      console.error('Error stopping recognition:', err);
      setError('Failed to stop recognition');
      return null;
    }
  }, [transcript]);

  return {
    transcript,
    interimTranscript,
    isListening,
    error,
    startListening,
    stopListening,
    hasSupport: !!SpeechRecognition
  };
};

function Live() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [keyTerms, setKeyTerms] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  
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

  const handleSendMessage = async () => {
    if (input.trim()) {
      // Add user message immediately
      setMessages(prevMessages => [...prevMessages, { user: true, text: input.trim() }]);
      setInput('');
      setIsLoading(true);

      console.log(input.trim());

      try {
        const response = await fetch('http://0.0.0.0:8000/medical-chatbot', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            question: input.trim()
          })
        });

        if (!response.ok) {
          throw new Error('Failed to get response from chat API');
        }

        const data = await response.json();
        setMessages(prevMessages => [
          ...prevMessages,
          { user: false, text: data.response }
        ]);
      } catch (error) {
        console.error('Error sending message:', error);
        setMessages(prevMessages => [
          ...prevMessages,
          { user: false, text: "Sorry, I encountered an error. Please try again." }
        ]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const toggleTranscription = async () => {
    if (isListening) {
      const terms = await stopListening();
      if (terms) {
        setKeyTerms(terms);
      }
    } else {
      setKeyTerms({});
      startListening();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      <header className="flex items-center justify-between px-6 py-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-4">
          <Link 
            to="/dashboard" 
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
          >
            <ChevronLeft size={20} />
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="text-2xl font-bold text-white ml-4">Live Session</h1>
        </div>
        <button 
          onClick={handleLogout} 
          className="px-4 py-2 bg-white text-black rounded hover:bg-gray-100 transition-colors"
        >
          Log Out
        </button>
      </header>

      <main className="flex-1 p-6 overflow-hidden">
        <div className="grid grid-cols-12 gap-6 h-full max-w-8xl mx-auto">
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
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] p-3 rounded-lg bg-gray-700 text-gray-100">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
                  placeholder="Type a message..."
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-6 flex flex-col gap-6">
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

            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="p-4 border-b border-gray-700">
                <h2 className="text-lg font-semibold text-white">Key Terms</h2>
              </div>
              <div className="p-4">
                {Object.keys(keyTerms).length === 0 ? (
                  <p className="text-gray-400 italic">
                    No key terms available yet. Start transcription to analyze terms.
                  </p>
                ) : (
                  <ul className="space-y-4 text-gray-100">
                    {Object.entries(keyTerms).map(([term, definition]) => (
                      <li key={term} className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          <span className="font-medium">{term}:</span>
                        </div>
                        <p className="ml-4 text-gray-300">{definition}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Live;