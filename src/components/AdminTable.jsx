import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function AdminTable() {
  const [submissions, setSubmissions] = useState([]);
  const [signedUrls, setSignedUrls] = useState({});

  useEffect(() => {
    const channel = supabase
      .channel('submissions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'submissions' }, () => {
        load();
      })
      .subscribe();

    load();
    return () => supabase.removeChannel(channel);
  }, []);

  async function load() {
    const { data } = await supabase
      .from('submissions')
      .select('id, status, photo_url, challenge_id, user_id, created_at')
      .order('created_at');
    setSubmissions(data || []);
    if (data) {
      const urls = {};
      await Promise.all(
        data.map(async (s) => {
          if (s.photo_url) {
            const { data: url } = await supabase
              .storage
              .from('photos')
              .createSignedUrl(s.photo_url, 60 * 60);
            urls[s.id] = url?.signedUrl;
          }
        })
      );
      setSignedUrls(urls);
    }
  }

  async function updateStatus(id, status) {
    await supabase.from('submissions').update({ status }).eq('id', id);
    if (status === 'approved') {
      await supabase.rpc('increment_coins', { p_user: submissions.find((s) => s.id === id).user_id });
    }
  }

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr>
          <th className="border p-2">Photo</th>
          <th className="border p-2">Status</th>
          <th className="border p-2">Action</th>
        </tr>
      </thead>
      <tbody>
        {submissions.map((s) => (
          <tr key={s.id} className="border-t">
            <td className="border p-2">
              <img src={signedUrls[s.id]} alt="submission" className="h-20" />
            </td>
            <td className="border p-2">{s.status}</td>
            <td className="border p-2">
              <button onClick={() => updateStatus(s.id, 'approved')} className="bg-green-500 text-white px-2 mr-1">Accept</button>
              <button onClick={() => updateStatus(s.id, 'rejected')} className="bg-red-500 text-white px-2">Reject</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
