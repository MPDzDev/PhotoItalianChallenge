import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';

export default function FullScreenImage({ src, alt = '', onClose }) {
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
    </div>
  );

  return ReactDOM.createPortal(content, document.body);
}
