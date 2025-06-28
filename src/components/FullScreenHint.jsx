import React from 'react';
import ReactDOM from 'react-dom';

export default function FullScreenHint({ text, onClose }) {
  const content = (
    <div
      className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="bg-white p-4 rounded shadow max-w-xl mx-auto text-center whitespace-pre-wrap">
        {text}
      </div>
    </div>
  );
  return ReactDOM.createPortal(content, document.body);
}
