import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function ChallengeList() {
  const [challenges, setChallenges] = useState([]);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('challenges')
        .select('*')
        .order('sort_order');
      setChallenges(data || []);
    }
    load();

    const channel = supabase
      .channel('challenges')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'challenges' }, load)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  async function updateActive(id, active) {
    await supabase.from('challenges').update({ active }).eq('id', id);
    setChallenges(
      challenges.map((c) => (c.id === id ? { ...c, active } : c))
    );
  }

  return (
    <table className="w-full border-collapse mb-4">
      <thead>
        <tr>
          <th className="border p-2">Title</th>
          <th className="border p-2">Active</th>
          <th className="border p-2">Action</th>
        </tr>
      </thead>
      <tbody>
        {challenges.map((c) => (
          <tr key={c.id} className="border-t">
            <td className="border p-2">{c.title}</td>
            <td className="border p-2">{c.active ? 'Yes' : 'No'}</td>
            <td className="border p-2">
              <button
                onClick={() => updateActive(c.id, !c.active)}
                className={`px-2 ${c.active ? 'bg-red-500' : 'bg-green-500'} text-white`}
              >
                {c.active ? 'Deactivate' : 'Activate'}
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
