import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function UploadPhoto({ challengeId, userId }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');

  async function handleUpload() {
    if (!file) return;
    const filename = `${crypto.randomUUID()}`;
    const { data, error } = await supabase.storage
      .from('photos')
      .upload(filename, file);
    if (error) return setStatus('Upload failed');

    await supabase.from('submissions').insert({
      challenge_id: challengeId,
      photo_url: data.path,
      user_id: userId,
    });
    setStatus('Submitted');
  }

  return (
    <div className="flex flex-col gap-2 mt-2">
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <button onClick={handleUpload} className="bg-green-500 text-white p-1">
        Upload
      </button>
      {status && <p>{status}</p>}
    </div>
  );
}
