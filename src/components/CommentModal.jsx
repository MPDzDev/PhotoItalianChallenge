import React, { useState } from 'react';
import ReactDOM from 'react-dom';

export default function CommentModal({ onSubmit, onCancel }) {
  const [comment, setComment] = useState('');

  const content = (
    <div
      className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white p-4 rounded shadow max-w-xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <textarea
          className="w-full border p-2 mb-2"
          rows="3"
          placeholder="Enter comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-2 py-1 bg-gray-300 rounded">Cancel</button>
          <button onClick={() => onSubmit(comment)} className="px-2 py-1 bg-blue-600 text-white rounded">Submit</button>
        </div>
      </div>
    </div>
  );
  return ReactDOM.createPortal(content, document.body);
}
