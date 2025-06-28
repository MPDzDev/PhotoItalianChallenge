import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('login'); // or 'register'
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  async function handleGoogleLogin() {
  setErrorMsg('');
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/hunt',
      },
    });
    if (error) {
      setErrorMsg(error.message || 'Authentication failed');
    }
  } catch {
    setErrorMsg('Server error. Check configuration and network.');
  }
}

  useEffect(() => {
    let subscription;
    async function initSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      console.log('Current session:', session); // Log the current session
      if (session) navigate('/hunt');
    }
    initSession();
    const {
      data: { subscription: sub },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', session); // Log auth state changes
      if (session) navigate('/hunt');
    });
    subscription = sub;
    return () => {
      subscription?.unsubscribe();
    };
  }, [navigate]);

  async function storeCredentials() {
    if (window.PasswordCredential) {
      try {
        await navigator.credentials.store(
          new window.PasswordCredential({ id: email, password })
        );
      } catch (_) {
        /* ignore */
      }
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg('');
    setMessage('');

    try {
      if (mode === 'register') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) {
          setErrorMsg(error.message || 'Registration failed');
        } else {
          await storeCredentials();
          setMessage('Check your email to confirm your account.');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          setErrorMsg(error.message || 'Authentication failed');
        } else {
          await storeCredentials();
          navigate('/hunt');
        }
      }
    } catch (err) {
      setErrorMsg('Server error. Check configuration and network.');
    }
  }

  return (
    <div className="p-4 max-w-md mx-auto text-center">
      <h1 className="text-3xl mb-4">Welcome, matey!</h1>
      {message ? (
        <p>{message}</p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="username"
            className="border p-2 rounded"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="password"
            required
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            className="border p-2 rounded"
          />
          <div className="flex justify-center gap-4">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              {mode === 'login' ? 'Login' : 'Register'}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setErrorMsg('');
              }}
              className="underline"
            >
              {mode === 'login' ? 'Need an account?' : 'Have an account?'}
            </button>
          </div>
          <div className="flex justify-center mt-2">
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="bg-red-600 text-white px-4 py-2 rounded"
            >
              Sign in with Google
            </button>
          </div>
          {errorMsg && <p className="text-red-600">{errorMsg}</p>}
        </form>
      )}
    </div>
  );
}