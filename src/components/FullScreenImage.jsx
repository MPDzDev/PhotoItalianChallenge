import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';

export default function FullScreenImage({ src, alt = '', onClose, downloadUrl }) {
  const getOrientation = () =>
    window.innerHeight >= window.innerWidth ? 'portrait' : 'landscape';
  const [orientation, setOrientation] = useState(getOrientation());

  useEffect(() => {
    const handler = () => setOrientation(getOrientation());
    window.addEventListener('resize', handler);
    window.addEventListener('orientationchange', handler);
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('resize', handler);
      window.removeEventListener('orientationchange', handler);
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  async function handleDownload(e) {
    e.stopPropagation();
    try {
      const res = await fetch(downloadUrl);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const name = downloadUrl.split('?')[0].split('/').pop() || 'photo';
      a.download = name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed', err);
    }
  }

  const content = (
    <div
      className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center"
      onClick={onClose}
    >
      <img
        src={src}
        alt={alt}
        className={`object-contain ${
          orientation === 'portrait' ? 'max-h-screen' : 'max-w-screen'
        }`}
      />
      {downloadUrl && (
        <button
          onClick={handleDownload}
          className="absolute top-2 right-2 bg-white text-black px-2 py-1 rounded shadow"
        >
          Download
        </button>
      )}
    </div>
  );

  return ReactDOM.createPortal(content, document.body);
}
