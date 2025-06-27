import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import UploadPhoto from '../components/UploadPhoto';
import MySubmissions from '../components/MySubmissions';
import { useNavigate } from 'react-router-dom';

export default function Hunt() {
  const [user, setUser] = useState(null);
  const [challenges, setChallenges] = useState([]);
  const [exampleUrls, setExampleUrls] = useState({});
  const [submittedChallenges, setSubmittedChallenges] = useState(new Set());
  const [challengeStatus, setChallengeStatus] = useState({});
  const [openId, setOpenId] = useState(null);
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
        .select('challenge_id, status')
        .eq('user_id', user.id);
      setSubmittedChallenges(new Set(data ? data.map((s) => s.challenge_id) : []));
      const statuses = {};
      data?.forEach((s) => {
        statuses[s.challenge_id] = s.status;
      });
      setChallengeStatus(statuses);
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
        const rowColor =
          status === 'approved'
            ? 'bg-green-200'
            : status === 'rejected'
            ? 'bg-red-200'
            : 'bg-amber-200';
        const isOpen = openId === c.id;
        return (
          <div key={c.id} className="border rounded overflow-hidden">
            <div
              className={`p-2 font-bold cursor-pointer ${rowColor}`}
              onClick={() => setOpenId(isOpen ? null : c.id)}
            >
              {c.title}
            </div>
            {isOpen && (
              <div className="p-2 bg-white">
                {c.description && <p className="italic mb-2">{c.description}</p>}
                {c.hint && <p className="mb-2">Hint: {c.hint}</p>}
                <UploadPhoto
                  challengeId={c.id}
                  userId={user.id}
                  exampleUrl={exampleUrls[c.id]}
                  submitted={submittedChallenges.has(c.id)}
                  onUploaded={() => {
                    setSubmittedChallenges(
                      new Set([...submittedChallenges, c.id])
                    );
                    setChallengeStatus((prev) => ({
                      ...prev,
                      [c.id]: 'pending',
                    }));
                  }}
                />
              </div>
            )}
          </div>
        );
      })
      <MySubmissions userId={user.id} />
    </div>
  );
}
