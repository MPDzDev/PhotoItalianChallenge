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

  return (
    <table className="w-full border-collapse mb-4">
      <thead>
        <tr>
          <th className="border p-2">Title</th>
          <th className="border p-2">Active</th>
        </tr>
      </thead>
      <tbody>
        {challenges.map((c) => (
          <tr key={c.id} className="border-t">
            <td className="border p-2">{c.title}</td>
            <td className="border p-2">{c.active ? 'Yes' : 'No'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
