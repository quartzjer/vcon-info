import React from 'react';

const PartyLink = ({ parties, setSelectedParty }) => {
  return (
    <span className="text-blue-400 cursor-pointer hover:text-blue-300">
      parties: [{parties.join(', ')}]
      {parties.map(p => (
        <span 
          key={p}
          onMouseEnter={() => setSelectedParty(p)}
          onMouseLeave={() => setSelectedParty(null)}
          className="inline-block ml-1"
        >
        </span>
      ))}
    </span>
  );
};

export default PartyLink;