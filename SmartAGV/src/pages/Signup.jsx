import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Bot, Mail, Lock, User } from 'lucide-react';

export default function Signup() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSignup = (e) => {
    e.preventDefault();
    
    // Create new user object
    const newUser = { username, email, password };
    
    // Retrieve existing users from localStorage or default to empty array
    const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
    
    // Add new user
    existingUsers.push(newUser);
    
    // Save updated users list to localStorage
    localStorage.setItem('users', JSON.stringify(existingUsers));
    
    // Navigate back to Login page upon success
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#121212] p-4 font-sans text-white">
      <div className="w-full max-w-md bg-[#1e1e1e] rounded-2xl p-8 shadow-2xl border border-white/5">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-indigo-500/10 p-4 rounded-full mb-4">
            <Bot className="w-12 h-12 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-white mb-2">Create an Account</h1>
          <p className="text-gray-400 text-sm">Sign up to join SmartAGV</p>
        </div>

        <form className="space-y-4" onSubmit={handleSignup}>
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
                <Mail className="h-5 w-5" />
              </div>
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
              Create Account
            </button>
          </div>
        </form>

        <div className="mt-8 flex justify-center text-sm">
          <Link to="/" className="text-blue-400 hover:text-blue-300 transition-colors font-medium">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
