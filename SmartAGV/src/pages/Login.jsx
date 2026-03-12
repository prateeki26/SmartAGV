import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, User, Lock } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Check if user is already logged in
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (isLoggedIn === 'true') {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    if (users.length === 0) {
      setError('User does not exist. Please create an account.');
      return;
    }

    const user = users.find(u => u.username === username);
    
    if (!user) {
      setError('User does not exist. Please create an account.');
      return;
    }

    if (user.password !== password) {
      setError('Invalid username or password');
      return;
    }

    localStorage.setItem('isLoggedIn', 'true');
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#121212] p-4 font-sans text-white">
      <div className="w-full max-w-md bg-[#1e1e1e] rounded-2xl p-8 shadow-2xl border border-white/5">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-indigo-500/10 p-4 rounded-full mb-4">
            <Bot className="w-12 h-12 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-white mb-2">Welcome To SmartAGV</h1>
          <p className="text-gray-400 text-sm">Sign in to manage your robotic fleet</p>
        </div>

        <form className="space-y-4" onSubmit={handleLogin}>
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-red-500 text-sm text-center font-medium">{error}</p>
            </div>
          )}
          
          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                <User className="h-5 w-5" />
              </div>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-[#2a2a2a] border border-transparent rounded-xl focus:bg-[#333333] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-gray-500 text-white"
                required
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                <Lock className="h-5 w-5" />
              </div>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-[#2a2a2a] border border-transparent rounded-xl focus:bg-[#333333] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-gray-500 text-white"
                required
              />
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3.5 px-4 rounded-xl transition-colors duration-200 shadow-lg shadow-blue-500/30"
            >
              Login
            </button>
          </div>
        </form>

        <div className="mt-8 flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:justify-between text-sm">
          <button 
            type="button" 
            onClick={() => navigate('/signup')} 
            className="text-blue-400 hover:text-blue-300 transition-colors font-medium text-left"
          >
            Create an account
          </button>
          <button 
            type="button" 
            onClick={() => navigate('/forgot-password')}
            className="text-blue-400 hover:text-blue-300 transition-colors font-medium text-left sm:text-right"
          >
            Forgot Password?
          </button>
        </div>
      </div>
    </div>
  );
}
