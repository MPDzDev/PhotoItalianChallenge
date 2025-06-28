import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import AdminTable from '../components/AdminTable';
import CreateChallenge from '../components/CreateChallenge';
import ChallengeList from '../components/ChallengeList';
import { Navigate, useNavigate } from 'react-router-dom';
import LogoutButton from '../components/LogoutButton';

export default function Admin() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const ADMIN_WHITELIST = ['mdziedzic97@gmail.com'];

  useEffect(() => {
    let subscription;
    async function loadSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);
    }
    loadSession();

    const {
      data: { subscription: sub },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    subscription = sub;
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  if (loading) return null;
  if (!user) return <p className="p-4">Please log in first.</p>;
  if (!ADMIN_WHITELIST.includes(user.email)) return <Navigate to="/hunt" replace />;

  return (
    <div className="p-4">
      <div className="flex justify-between mb-4">
        <button
          onClick={() => navigate('/hunt')}
          className="bg-purple-600 text-white px-3 py-1 rounded"
        >
          Go to Hunt Panel
        </button>
        <LogoutButton className="bg-gray-300 px-3 py-1 rounded" />
      </div>
      <h1 className="text-xl mb-4">Admin Dashboard</h1>
      <CreateChallenge />
      <ChallengeList />
      <AdminTable />
    </div>
  );
}
