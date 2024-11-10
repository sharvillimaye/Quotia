import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Download, FileText, FileDown, ChevronLeft, Search } from 'lucide-react';

function Sessions() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    } else {
      // Simulate fetching sessions data
      setTimeout(() => {
        setSessions([
          {
            id: 1,
            date: '2024-03-15',
            duration: '45 minutes',
            topic: 'Diabetes Management',
            keyTerms: 12,
            status: 'completed'
          },
          {
            id: 2,
            date: '2024-03-14',
            duration: '30 minutes',
            topic: 'Blood Pressure Review',
            keyTerms: 8,
            status: 'completed'
          },
          {
            id: 3,
            date: '2024-03-13',
            duration: '20 minutes',
            topic: 'Medication Discussion',
            keyTerms: 6,
            status: 'completed'
          }
        ]);
        setIsLoading(false);
      }, 1000);
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleDownloadTranscript = (sessionId) => {
    // Implement transcript download logic
    console.log(`Downloading transcript for session ${sessionId}`);
  };

  const handleDownloadInsights = (sessionId) => {
    // Implement insights PDF download logic
    console.log(`Downloading insights for session ${sessionId}`);
  };

  const filteredSessions = sessions.filter(session => 
    session.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.date.includes(searchTerm)
  );

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-4">
          <Link 
            to="/dashboard" 
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
          >
            <ChevronLeft size={20} />
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="text-2xl font-bold text-white ml-4">Previous Sessions</h1>
        </div>
        <button 
          onClick={handleLogout} 
          className="px-4 py-2 bg-white text-black rounded hover:bg-gray-100 transition-colors"
        >
          Log Out
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search sessions by topic or date..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Sessions Table */}
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-700">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Topic
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Key Terms
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Downloads
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {isLoading ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 text-center text-gray-400">
                        Loading sessions...
                      </td>
                    </tr>
                  ) : filteredSessions.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 text-center text-gray-400">
                        No sessions found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredSessions.map((session) => (
                      <tr key={session.id} className="hover:bg-gray-700/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {new Date(session.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">
                          {session.topic}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {session.duration}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {session.keyTerms}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            {session.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          <div className="flex justify-center gap-3">
                            <button
                              onClick={() => handleDownloadTranscript(session.id)}
                              className="p-2 hover:bg-gray-600 rounded-full transition-colors group"
                              title="Download Transcript"
                            >
                              <FileText size={20} className="text-gray-400 group-hover:text-white" />
                            </button>
                            <button
                              onClick={() => handleDownloadInsights(session.id)}
                              className="p-2 hover:bg-gray-600 rounded-full transition-colors group"
                              title="Download Insights PDF"
                            >
                              <FileDown size={20} className="text-gray-400 group-hover:text-white" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Sessions;