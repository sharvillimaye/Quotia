import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function Sessions() {
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
      <h1 className="text-4xl mb-8">Sessions</h1>
      <p>Welcome to your sessions!</p>
      <Link to="/dashboard">
        <button className="mt-4 px-4 py-2 bg-white text-black rounded">Back to Dashboard</button>
      </Link>
    </div>
  );
}

export default Sessions;