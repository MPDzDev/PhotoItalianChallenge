import React from 'react';
import pirateImg from '../assets/pirate-master.png';

export default function ChallengeMaster({ approvedCount }) {
  // Blur decreases with progress but stays heavy until fully completed.
  const blurLevel = approvedCount >= 10 ? 0 : 30 - approvedCount * 2;

  return (
    <div className="text-center my-4">
      <img
        src={pirateImg}
        alt="Pirate Challenge Master"
        style={{ filter: `blur(${blurLevel}px)` }}
        className="w-48 h-auto mx-auto rounded"
      />
      {approvedCount >= 10 ? (
        <p className="mt-2 font-bold">Ask this person where the treasure is!</p>
      ) : (
        <p className="mt-2 italic">Complete all challenges to reveal the master.</p>
      )}
    </div>
  );
}
