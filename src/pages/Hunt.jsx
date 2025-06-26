import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import UploadPhoto from '../components/UploadPhoto';

export default function Hunt() {
  const [user, setUser] = useState(null);
  const [challenges, setChallenges] = useState([]);

  useEffect(() => {
    const session = supabase.auth.session ? supabase.auth.session() : null;
    setUser(session?.user || null);
    supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
  }, []);

  useEffect(() => {
    async function loadChallenges() {
      const { data } = await supabase.from('challenges').select('*').order('sort_order');
      setChallenges(data || []);
    }
    loadChallenges();
  }, []);

  if (!user) {
    return (
      <div className="p-4">
        <p>Please log in first.</p>
      </div>
    );
  }

  return (
    <div className="p-4 flex flex-col gap-4">
      {challenges.map((c) => (
        <div key={c.id} className="border p-2">
          <h2 className="font-bold">{c.title}</h2>
          <p>{c.clue}</p>
          <UploadPhoto challengeId={c.id} />
        </div>
      ))}
    </div>
  );
}
