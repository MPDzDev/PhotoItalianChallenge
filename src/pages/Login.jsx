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

  async function handleLogin(e) {
    e.preventDefault();
    setErrorMsg('');
    try {
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) {
        setErrorMsg(error.message || 'Login failed');
      } else {
        setSent(true);
      }
    } catch (err) {
      setErrorMsg('Server error. Check configuration and network.');
    }
  }

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-xl mb-4">Login</h1>
      {sent ? (
        <p>Check your email for a magic link.</p>
      ) : (
        <form onSubmit={handleLogin} className="flex flex-col gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="border p-2"
          />
          <button className="bg-blue-500 text-white p-2">Send Magic Link</button>
          {errorMsg && <p className="text-red-600">{errorMsg}</p>}
        </form>
      )}
    </div>
  );
}
