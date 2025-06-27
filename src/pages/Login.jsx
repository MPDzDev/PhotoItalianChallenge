import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let subscription;
    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) navigate('/hunt');
    }
    checkSession();
    const {
      data: { subscription: sub },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) navigate('/hunt');
    });
    subscription = sub;
    return () => {
      subscription?.unsubscribe();
    };
  }, [navigate]);

  async function handleAuth(type) {
    setErrorMsg('');
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: type === 'register' },
      });
      if (error) {
        setErrorMsg(error.message || 'Authentication failed');
      } else {
        setSent(true);
      }
    } catch (err) {
      setErrorMsg('Server error. Check configuration and network.');
    }
  }

  return (
    <div className="p-4 max-w-md mx-auto text-center">
      <h1 className="text-3xl mb-4">Welcome, matey!</h1>
      {sent ? (
        <p>Check your email for a magic link.</p>
      ) : (
        <div className="flex flex-col gap-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="border p-2 rounded"
          />
          <div className="flex justify-center gap-4">
            <button
              type="button"
              onClick={() => handleAuth('login')}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => handleAuth('register')}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              Register
            </button>
          </div>
          {errorMsg && <p className="text-red-600">{errorMsg}</p>}
        </div>
      )}
    </div>
  );
}
