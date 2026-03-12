import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Bot, Mail } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleReset = (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.email === email);

    if (user) {
      setMessage(`Account found. Your password is: ${user.password}`);
    } else {
      setError('Email not recognized.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#121212] p-4 font-sans text-white">
      <div className="w-full max-w-md bg-[#1e1e1e] rounded-2xl p-8 shadow-2xl border border-white/5">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-indigo-500/10 p-4 rounded-full mb-4">
            <Bot className="w-12 h-12 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-white mb-2">Forgot Password</h1>
          <p className="text-gray-400 text-sm">Recover your account credentials</p>
        </div>

        <form className="space-y-4" onSubmit={handleReset}>
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-red-500 text-sm text-center font-medium">{error}</p>
            </div>
          )}

          {message && (
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl flex flex-col space-y-3">
              <p className="text-green-500 text-sm text-center font-medium">{message}</p>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="w-full bg-green-600/20 hover:bg-green-600/30 text-green-500 font-medium py-2 px-4 rounded-lg transition-colors border border-green-500/30"
              >
                Go to Login
              </button>
            </div>
          )}
          
          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                <Mail className="h-5 w-5" />
              </div>
              <input
                type="email"
                placeholder="Registered Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
              Search Account
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
