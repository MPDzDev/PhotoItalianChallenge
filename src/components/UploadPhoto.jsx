import React, { useRef, useState } from 'react';
import { supabase } from '../supabaseClient';
import FullScreenImage from './FullScreenImage';

export default function UploadPhoto({
  challengeId,
  userId,
  exampleUrl,
  submitted,
  userPhotoUrl,
  onUploaded,
  title,
  description,
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

  const photoSrc = submitted && userPhotoUrl ? userPhotoUrl : exampleUrl;

  return (
    <div className="mt-2 polaroid">
      <div className="relative">
        {photoSrc && (
          <>
            <img
              src={photoSrc}
              alt="example"
              className="w-full object-contain max-h-64 cursor-pointer"
              onClick={() => setShowExample(true)}
            />
            {showExample && (
              <FullScreenImage
                src={photoSrc}
                alt="example"
                onClose={() => setShowExample(false)}
              />
            )}
          </>
        )}
        {!submitted && (
          <div
            onClick={() => inputRef.current.click()}
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white text-sm font-semibold animate-heartbeat cursor-pointer"
          >
            Click to upload your version
          </div>
        )}
      </div>
      <div className="mt-2 text-center text-sm handwriting">
        <p className="font-bold">{title}</p>
        {description && <p className="italic">{description}</p>}
      </div>
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
