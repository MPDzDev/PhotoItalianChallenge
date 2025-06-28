import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { compressImage } from '../utils/compressImage';

export default function CreateChallenge() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [hint, setHint] = useState('');
  const [examplePhoto, setExamplePhoto] = useState(null);
  const [active, setActive] = useState(false);
  const [status, setStatus] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('');

    let examplePhotoPath = null;
    if (examplePhoto) {
      const filename = `${crypto.randomUUID()}`;
      const compressed = await compressImage(examplePhoto);
      const { data, error } = await supabase.storage
        .from('photos')
        .upload(filename, compressed);
      if (error) {
        setStatus('Photo upload failed');
        return;
      }
      examplePhotoPath = data.path;
    }

    // fetch current max sort_order
    const { data: existing } = await supabase
      .from('challenges')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1);
    const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 1;

    const { error } = await supabase.from('challenges').insert({
      title,
      description,
      hint,
      example_photo: examplePhotoPath,
      active,
      sort_order: nextOrder,
    });
    if (error) {
      setStatus('Error creating challenge');
    } else {
      setTitle('');
      setDescription('');
      setHint('');
      setExamplePhoto(null);
      setActive(false);
      setStatus('Challenge created');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 mb-4">
      <h2 className="text-lg font-bold">Create Challenge</h2>
      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="border p-1"
        required
      />
      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="border p-1"
      />
      <input
        type="text"
        placeholder="Hint"
        value={hint}
        onChange={(e) => setHint(e.target.value)}
        className="border p-1"
      />
      <input
        type="file"
        onChange={(e) => setExamplePhoto(e.target.files[0])}
      />
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
        />
        Active
      </label>
      <button className="bg-blue-600 text-white px-3 py-1">Create</button>
      {status && <p>{status}</p>}
    </form>
  );
}
