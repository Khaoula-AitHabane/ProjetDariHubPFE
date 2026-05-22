import React from 'react';

export default function IntentChips({ intent }) {
  if (!intent) return null;

  const chips = [];

  if (intent.category) {
    chips.push({ label: intent.category.toUpperCase(), icon: '🏷️', color: 'bg-blue-100 text-blue-800' });
  }
  if (intent.listingKind === 'rent') {
    chips.push({ label: 'Location', icon: '🔑', color: 'bg-green-100 text-green-800' });
  } else if (intent.listingKind === 'sale') {
    chips.push({ label: 'Vente', icon: '💰', color: 'bg-green-100 text-green-800' });
  }
  if (intent.city) {
    chips.push({ label: intent.city, icon: '📍', color: 'bg-red-100 text-red-800' });
  }
  if (intent.propertyType || intent.serviceType) {
    chips.push({ label: intent.propertyType || intent.serviceType, icon: '🏠', color: 'bg-purple-100 text-purple-800' });
  }
  if (intent.bedrooms) {
    chips.push({ label: `${intent.bedrooms} Chambres`, icon: '🛏️', color: 'bg-indigo-100 text-indigo-800' });
  }
  if (intent.surface) {
    chips.push({ label: `${intent.surface} m²`, icon: '📏', color: 'bg-teal-100 text-teal-800' });
  }
  if (intent.maxPrice) {
    chips.push({ label: `Max ${intent.maxPrice} DH`, icon: '💵', color: 'bg-emerald-100 text-emerald-800' });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-4 animate-fade-in-up">
      <span className="text-sm text-gray-500 py-1.5 mr-2 font-medium">L'IA a compris :</span>
      {chips.map((chip, idx) => (
        <div 
          key={idx} 
          className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center shadow-sm ${chip.color}`}
        >
          <span className="mr-1.5">{chip.icon}</span>
          {chip.label}
        </div>
      ))}
    </div>
  );
}
