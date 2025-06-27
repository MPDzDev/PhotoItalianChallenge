import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import UploadPhoto from '../components/UploadPhoto';
import MySubmissions from '../components/MySubmissions';
import { useNavigate } from 'react-router-dom';

export default function Hunt() {
  const [user, setUser] = useState(null);
  const [challenges, setChallenges] = useState([]);
  const [exampleUrls, setExampleUrls] = useState({});
  const [challengeStatus, setChallengeStatus] = useState({});
  const [expanded, setExpanded] = useState(null);
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
    if (!user) return;
    async function loadSubmitted() {
      const { data } = await supabase
        .from('submissions')
        .select('challenge_id, status, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      const statusMap = {};
      data?.forEach((s) => {
        if (!statusMap[s.challenge_id]) statusMap[s.challenge_id] = s.status;
      });
      setChallengeStatus(statusMap);
    }
    loadSubmitted();
    const channel = supabase
      .channel('user_subs')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'submissions', filter: `user_id=eq.${user.id}` },
        loadSubmitted
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [user]);

  useEffect(() => {
    async function loadChallenges() {
      const { data } = await supabase
        .from('challenges')
        .select('*')
        .eq('active', true)
        .order('sort_order');
      setChallenges(data || []);
      if (data) {
        const urls = {};
        await Promise.all(
          data.map(async (c) => {
            if (c.example_photo) {
              const { data: url } = await supabase
                .storage
                .from('photos')
                .createSignedUrl(c.example_photo, 60 * 60);
              urls[c.id] = url?.signedUrl;
            }
          })
        );
        setExampleUrls(urls);
      }
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
      {challenges.map((c) => {
        const status = challengeStatus[c.id];
        let rowClass = 'bg-amber-100';
        if (status === 'approved') rowClass = 'bg-green-200';
        else if (status === 'rejected') rowClass = 'bg-red-200';
        return (
          <div key={c.id} className={`${rowClass} rounded shadow`}>
            <div
              onClick={() => setExpanded(expanded === c.id ? null : c.id)}
              className="p-2 cursor-pointer font-bold"
            >
              {c.title}
            </div>
            {expanded === c.id && (
              <div className="p-4 border-t bg-white rounded-b">
                {c.description && (
                  <p className="italic mb-2">{c.description}</p>
                )}
                {c.hint && <p className="mb-2">Hint: {c.hint}</p>}
                <UploadPhoto
                  challengeId={c.id}
                  userId={user.id}
                  exampleUrl={exampleUrls[c.id]}
                  submitted={!!status}
                  onUploaded={() =>
                    setChallengeStatus({
                      ...challengeStatus,
                      [c.id]: 'pending',
                    })
                  }
                />
              </div>
            )}
          </div>
        );
      })}
      <MySubmissions userId={user.id} />
    </div>
  );
}
