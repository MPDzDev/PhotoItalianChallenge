import React, { useRef, useState } from 'react';
import { supabase } from '../supabaseClient';
import FullScreenImage from './FullScreenImage';
import FullScreenHint from './FullScreenHint';
import { compressImage } from '../utils/compressImage';

export default function UploadPhoto({
  challengeId,
  userId,
  exampleUrl,
  submitted,
  status,
  comment,
  userPhotoUrl,
  userFullPhotoUrl,
  onUploaded,
  title,
  description,
  hint,
}) {
  const inputRef = useRef(null);
  const [message, setMessage] = useState('');
  const [showExample, setShowExample] = useState(false);
  const [showHint, setShowHint] = useState(false);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const filename = `${crypto.randomUUID()}`;
    const preview = await compressImage(file, 200000);
    const { data, error } = await supabase.storage
      .from('photos')
      .upload(filename, file);
    if (error) return setMessage('Upload failed');

    await supabase.storage
      .from('photos')
      .upload(`${filename}-preview.jpg`, preview);

    await supabase.from('submissions').insert({
      challenge_id: challengeId,
      photo_url: data.path,
      photo_preview: `${filename}-preview.jpg`,
      user_id: userId,
    });
    setMessage('Submitted');
    onUploaded?.();
  }

  const photoSrc = submitted && userPhotoUrl ? userPhotoUrl : exampleUrl;

  return (
    <div className="relative mt-2 polaroid">
      <div className="relative">
        {photoSrc && (
          <>
            <img
              src={photoSrc}
              alt="example"
              className="w-full object-contain cursor-pointer"
              onClick={() => setShowExample(true)}
            />
            {status && (
              <span
                className={`absolute bottom-1 left-1 text-xs px-1 rounded bg-white bg-opacity-70 ${
                  status === 'approved'
                    ? 'text-green-700'
                    : status === 'rejected'
                    ? 'text-red-700'
                    : 'text-yellow-700'
                }`}
              >
                {status}
              </span>
            )}
            {comment && (
              <span className="absolute bottom-1 right-1 text-xs bg-white bg-opacity-70 px-1 rounded whitespace-pre-wrap max-w-[70%] text-right">
                {comment}
              </span>
            )}
            {showHint && <FullScreenHint text={hint} onClose={() => setShowHint(false)} />}
            {showExample && (
              <FullScreenImage
                src={photoSrc}
                alt="example"
                downloadUrl={submitted ? userFullPhotoUrl : null}
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
      {hint && (
        <button
          className="absolute bottom-1 right-1 text-xs font-bold bg-white bg-opacity-70 rounded-full w-5 h-5 flex items-center justify-center"
          onClick={(e) => {
            e.stopPropagation();
            setShowHint(true);
          }}
        >
          ?
        </button>
      )}
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
      {message && <p className="text-green-700 mt-1">{message}</p>}
    </div>
  );
}
