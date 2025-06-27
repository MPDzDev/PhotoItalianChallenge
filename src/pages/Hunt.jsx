import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import UploadPhoto from '../components/UploadPhoto';
import { useNavigate } from 'react-router-dom';

export default function Hunt() {
  const [user, setUser] = useState(null);
  const [challenges, setChallenges] = useState([]);
  const navigate = useNavigate();

  const ADMIN_WHITELIST = ['mdziedzic97@gmail.com'];

  useEffect(() => {
    let subscription;
    async function loadSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user || null);
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

  useEffect(() => {
    async function loadChallenges() {
      const { data } = await supabase
        .from('challenges')
        .select('*')
        .eq('active', true)
        .order('sort_order');
      setChallenges(data || []);
    }
    loadChallenges();
    const channel = supabase
      .channel('challenges')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'challenges' }, loadChallenges)
      .subscribe();
    return () => supabase.removeChannel(channel);
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
      {ADMIN_WHITELIST.includes(user.email) && (
        <button
          onClick={() => navigate('/admin')}
          className="bg-purple-600 text-white px-3 py-1 rounded self-start"
        >
          Go to Admin Panel
        </button>
      )}
      {challenges.map((c) => (
        <div key={c.id} className="border p-2">
          <h2 className="font-bold">{c.title}</h2>
          {c.description && <p className="italic">{c.description}</p>}
          {c.hint && <p>Hint: {c.hint}</p>}
          {c.example_photo && (
            <img
              src={supabase.storage.from('photos').getPublicUrl(c.example_photo).data.publicUrl}
              alt="example"
              className="h-32 my-2"
            />
          )}
          <UploadPhoto challengeId={c.id} />
        </div>
      ))}
    </div>
  );
}
