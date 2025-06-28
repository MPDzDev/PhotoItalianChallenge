import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import FullScreenImage from './FullScreenImage';
import CommentModal from './CommentModal';

export default function AdminTable() {
  const [submissions, setSubmissions] = useState([]);
  const [previewUrls, setPreviewUrls] = useState({});
  const [downloadUrls, setDownloadUrls] = useState({});
  const [viewer, setViewer] = useState(null); // {preview, download}
  const [pendingAction, setPendingAction] = useState(null); // {id, status}

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
      .select('id, status, comment, photo_url, photo_preview, challenge_id, user_id, created_at')
      .order('created_at');
    setSubmissions(data || []);
    if (data) {
      const previews = {};
      const fulls = {};
      await Promise.all(
        data.map(async (s) => {
          if (s.photo_preview) {
            const { data: url } = await supabase
              .storage
              .from('photos')
              .createSignedUrl(s.photo_preview, 60 * 60);
            previews[s.id] = url?.signedUrl;
          }
          if (s.photo_url) {
            const { data: url } = await supabase
              .storage
              .from('photos')
              .createSignedUrl(s.photo_url, 60 * 60);
            fulls[s.id] = url?.signedUrl;
          }
        })
      );
      setPreviewUrls(previews);
      setDownloadUrls(fulls);
    }
  }

  async function updateStatus(id, status, comment) {
    await supabase
      .from('submissions')
      .update({ status, comment })
      .eq('id', id);
  }

  return (
    <div className="relative">
      <table className="w-full border-collapse">
      <thead>
        <tr>
          <th className="border p-2">Photo</th>
          <th className="border p-2">Status</th>
          <th className="border p-2">Comment</th>
          <th className="border p-2">Action</th>
        </tr>
      </thead>
      <tbody>
        {submissions.map((s) => (
          <tr key={s.id} className="border-t">
            <td className="border p-2">
              <img
                src={previewUrls[s.id]}
                alt="submission"
                className="h-20 cursor-pointer"
                onClick={() => setViewer({ preview: previewUrls[s.id], download: downloadUrls[s.id] })}
              />
            </td>
            <td className="border p-2">{s.status}</td>
            <td className="border p-2 whitespace-pre-wrap">{s.comment}</td>
            <td className="border p-2">
              <button onClick={() => setPendingAction({ id: s.id, status: 'approved' })} className="bg-green-500 text-white px-2 mr-1">Accept</button>
              <button onClick={() => setPendingAction({ id: s.id, status: 'rejected' })} className="bg-red-500 text-white px-2">Reject</button>
            </td>
          </tr>
        ))}
      </tbody>
      </table>
      {viewer && (
        <FullScreenImage
          src={viewer.preview}
          downloadUrl={viewer.download}
          alt="submission"
          onClose={() => setViewer(null)}
        />
      )}
      {pendingAction && (
        <CommentModal
          onCancel={() => setPendingAction(null)}
          onSubmit={async (comment) => {
            await updateStatus(pendingAction.id, pendingAction.status, comment);
            setPendingAction(null);
          }}
        />
      )}
    </div>
  );
}
