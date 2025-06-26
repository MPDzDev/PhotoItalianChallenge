import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import AdminTable from '../components/AdminTable';

export default function Admin() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = supabase.auth.session ? supabase.auth.session() : null;
    setUser(session?.user || null);
    setLoading(false);
    supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
  }, []);

  if (loading) return null;
  if (!user) return <p className="p-4">Please log in first.</p>;

  return (
    <div className="p-4">
      <h1 className="text-xl mb-4">Admin Dashboard</h1>
      <AdminTable />
    </div>
  );
}
