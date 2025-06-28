import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import UploadPhoto from '../components/UploadPhoto';
import FullScreenImage from '../components/FullScreenImage';
import { useNavigate } from 'react-router-dom';
import { cachePhoto, getPreview, getFull } from '../utils/photoCache';

export default function Hunt() {
  const [user, setUser] = useState(null);
  const [challenges, setChallenges] = useState([]);
  const [exampleUrls, setExampleUrls] = useState({});
  const [challengeStatus, setChallengeStatus] = useState({});
  const [challengeComments, setChallengeComments] = useState({});
  const [mySubs, setMySubs] = useState({});
  const [subPreviewUrls, setSubPreviewUrls] = useState({});
  const [subFullUrls, setSubFullUrls] = useState({});
  const [expanded, setExpanded] = useState(null);
  const [viewerUrl, setViewerUrl] = useState(null);
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
        .select('id, challenge_id, status, comment, photo_url, photo_preview, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      const statusMap = {};
      const commentMap = {};
      const subsMap = {};
      const previewUrls = {};
      const fullUrls = {};
      if (data) {
        await Promise.all(
          data.map(async (s) => {
            if (!subsMap[s.challenge_id]) subsMap[s.challenge_id] = [];
            subsMap[s.challenge_id].push(s);
            if (!statusMap[s.challenge_id]) statusMap[s.challenge_id] = s.status;
            if (!commentMap[s.challenge_id]) commentMap[s.challenge_id] = s.comment;
            const cachedPreview = getPreview(s.id);
            const cachedFull = getFull(s.id);
            if (cachedPreview) {
              previewUrls[s.id] = cachedPreview;
            } else if (s.photo_preview) {
              const { data: url } = await supabase.storage
                .from('photos')
                .createSignedUrl(s.photo_preview, 60 * 60);
              previewUrls[s.id] = url?.signedUrl;
            }
            if (cachedFull) {
              fullUrls[s.id] = cachedFull;
            } else if (s.photo_url) {
              const { data: url } = await supabase.storage
                .from('photos')
                .createSignedUrl(s.photo_url, 60 * 60);
              fullUrls[s.id] = url?.signedUrl;
            }
          })
        );
      }
      setChallengeStatus(statusMap);
      setChallengeComments(commentMap);
      setMySubs(subsMap);
      setSubPreviewUrls(previewUrls);
      setSubFullUrls(fullUrls);
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

  const approvedCount = Object.values(challengeStatus).filter(
    (status) => status === 'approved'
  ).length;

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
      <h1 className="text-2xl text-center">
        {`Ready, set, snap! ${approvedCount}/10 photo challenges approved.`}
      </h1>
      <p className="text-center">
        Tap a card to read its instructions and view the sample image. Upload
        your own photo to complete the task &mdash; challenges can be tackled in
        any order.
      </p>
      {challenges.map((c) => {
        const status = challengeStatus[c.id];
        let rowClass = 'bg-amber-100';
        if (status === 'approved') rowClass = 'bg-green-200';
        else if (status === 'rejected') rowClass = 'bg-red-200';
        return (
          <div
            key={c.id}
            className={`${rowClass} rounded shadow transition hover:shadow-lg`}
          >
            <div
              onClick={() => setExpanded(expanded === c.id ? null : c.id)}
              className="p-3 cursor-pointer font-bold text-lg"
            >
              {c.title}
            </div>
            {expanded === c.id && (
              <div className="p-4 border-t bg-white rounded-b space-y-4">
                <UploadPhoto
                  challengeId={c.id}
                  userId={user.id}
                  exampleUrl={exampleUrls[c.id]}
                  submitted={!!status}
                  status={status}
                  comment={challengeComments[c.id]}
                  userPhotoUrl={
                    mySubs[c.id] && mySubs[c.id].length > 0
                      ? subPreviewUrls[mySubs[c.id][0].id]
                      : null
                  }
                  userFullPhotoUrl={
                    mySubs[c.id] && mySubs[c.id].length > 0
                      ? subFullUrls[mySubs[c.id][0].id]
                      : null
                  }
                  title={c.title}
                  description={c.description}
                  hint={c.hint}
                  onUploaded={(id, previewUrl, fullUrl) => {
                    setChallengeStatus({
                      ...challengeStatus,
                      [c.id]: 'pending',
                    });
                    setChallengeComments({
                      ...challengeComments,
                      [c.id]: '',
                    });
                    if (id) {
                      setMySubs((prev) => {
                        const list = prev[c.id] ? [...prev[c.id]] : [];
                        list.unshift({ id });
                        return { ...prev, [c.id]: list };
                      });
                      setSubPreviewUrls((p) => ({ ...p, [id]: previewUrl }));
                      setSubFullUrls((p) => ({ ...p, [id]: fullUrl }));
                      cachePhoto(id, previewUrl, fullUrl);
                    }
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
      {viewerUrl && (
        <FullScreenImage
          src={viewerUrl}
          alt="submission"
          onClose={() => setViewerUrl(null)}
        />
      )}
    </div>
  );
}
