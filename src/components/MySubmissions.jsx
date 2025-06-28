import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function MySubmissions({ userId }) {
  const [subs, setSubs] = useState([]);
  const [urls, setUrls] = useState({});

  useEffect(() => {
    if (!userId) return;
    async function load() {
      const { data } = await supabase
        .from('submissions')
        .select('id, status, comment, photo_url, challenge_id(title), created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      setSubs(data || []);
      if (data) {
        const u = {};
        await Promise.all(
          data.map(async (s) => {
            if (s.photo_url) {
              const { data: url } = await supabase
                .storage
                .from('photos')
                .createSignedUrl(s.photo_url, 60 * 60);
              u[s.id] = url?.signedUrl;
            }
          })
        );
        setUrls(u);
      }
    }
    load();
    const channel = supabase
      .channel('user_subs')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'submissions', filter: `user_id=eq.${userId}` },
        load
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [userId]);

  if (subs.length === 0) return null;

  return (
    <div className="mt-6">
      <h2 className="text-lg font-bold mb-2">My Submissions</h2>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="border p-2">Challenge</th>
            <th className="border p-2">Photo</th>
            <th className="border p-2">Status</th>
            <th className="border p-2">Comment</th>
          </tr>
        </thead>
        <tbody>
          {subs.map((s) => (
            <tr key={s.id} className="border-t">
              <td className="border p-2">{s.challenge_id?.title || s.challenge_id}</td>
              <td className="border p-2">
                <img src={urls[s.id]} alt="submission" className="h-20" />
              </td>
              <td className="border p-2">{s.status}</td>
              <td className="border p-2 whitespace-pre-wrap">{s.comment}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
