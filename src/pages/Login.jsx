import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Login() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (!error) setSent(true);
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
        </form>
      )}
    </div>
  );
}
