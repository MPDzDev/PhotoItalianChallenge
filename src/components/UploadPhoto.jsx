import React, { useRef, useState } from 'react';
import { supabase } from '../supabaseClient';
import FullScreenImage from './FullScreenImage';

export default function UploadPhoto({
  challengeId,
  userId,
  exampleUrl,
  submitted,
  onUploaded,
}) {
  const inputRef = useRef(null);
  const [status, setStatus] = useState('');
  const [showExample, setShowExample] = useState(false);

  async function handleFile(e) {
    const file = e.target.files?.[0];
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
    onUploaded?.();
  }

  return (
    <div className="relative mt-2">
      {exampleUrl && (
        <>
          <img
            src={exampleUrl}
            alt="example"
            className="h-32 w-full object-cover rounded cursor-pointer"
            onClick={() => setShowExample(true)}
          />
          {showExample && (
            <FullScreenImage
              src={exampleUrl}
              alt="example"
              onClose={() => setShowExample(false)}
            />
          )}
        </>
      )}
      {!submitted && (
        <div
          onClick={() => inputRef.current.click()}
          className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white text-sm font-semibold rounded animate-heartbeat cursor-pointer"
        >
          Click to upload your version
        </div>
      )}
      <input
        type="file"
        ref={inputRef}
        onChange={handleFile}
        className="hidden"
      />
      {status && <p className="text-green-700 mt-1">{status}</p>}
    </div>
  );
}
