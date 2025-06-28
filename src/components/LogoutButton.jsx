import React from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function LogoutButton({ className = '' }) {
  const navigate = useNavigate();
  async function handleLogout() {
    await supabase.auth.signOut();
    navigate('/login');
  }

  return (
    <button onClick={handleLogout} className={className}>
      Logout
    </button>
  );
}
