import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Signup() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8080/api/v1/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Signup failed');
      }

      // Clear form
      setUsername('');
      setEmail('');
      setPassword('');
      
      // Redirect to login page on success
      navigate('/login');
    } catch (err) {
      setError(err.message || 'An error occurred during signup');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
      <h1 className="text-4xl mb-8">Sign Up</h1>
      
      {error && (
        <div className="mb-4 w-full max-w-md p-4 bg-red-500 text-white rounded">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md">
        <div>
          <label className="block mb-2">Username:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={isLoading}
            className="px-4 py-2 bg-white text-black rounded w-full"
          />
        </div>
        <div>
          <label className="block mb-2">Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
            className="px-4 py-2 bg-white text-black rounded w-full"
          />
        </div>
        <div>
          <label className="block mb-2">Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            className="px-4 py-2 bg-white text-black rounded w-full"
          />
        </div>
        <button 
          type="submit" 
          disabled={isLoading}
          className="px-4 py-2 bg-white text-black rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Signing up...' : 'Sign Up'}
        </button>
      </form>
      
      <Link to="/">
        <button className="mt-4 px-4 py-2 bg-white text-black rounded hover:bg-gray-200">
          Back to Home
        </button>
      </Link>
    </div>
  );
}

export default Signup;