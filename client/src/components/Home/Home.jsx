import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    navigate('/');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
      <h1 className="text-4xl mb-8">Quotio</h1>
      {isLoggedIn ? (
        <div>
          <button onClick={handleLogout} className="px-4 py-2 bg-white text-black rounded">Log Out</button>
          <Link to="/dashboard">
            <button className="px-4 py-2 bg-white text-black rounded ml-4">Go to Dashboard</button>
          </Link>
        </div>
      ) : (
        <div className="space-x-4">
          <Link to="/login">
            <button className="px-4 py-2 bg-white text-black rounded">Log In</button>
          </Link>
          <Link to="/signup">
            <button className="px-4 py-2 bg-white text-black rounded">Sign Up</button>
          </Link>
        </div>
      )}
    </div>
  );
}

export default Home;