import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function Dashboard() {
  const navigate = useNavigate();

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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
      <div className="absolute top-4 right-4">
        <button onClick={handleLogout} className="px-4 py-2 bg-white text-black rounded">Log Out</button>
      </div>
      <h1 className="text-4xl mb-8">Dashboard</h1>
      <p>Welcome to your dashboard!</p>
      <div className="mt-8 space-x-4">
        <Link to="/sessions">
          <button className="px-4 py-2 bg-white text-black rounded">View your Sessions</button>
        </Link>
        <Link to="/live">
          <button className="px-4 py-2 bg-white text-black rounded">Start a Live Session</button>
        </Link>
      </div>
    </div>
  );
}

export default Dashboard;