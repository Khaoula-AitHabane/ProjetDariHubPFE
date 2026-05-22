import React from 'react';

export default function SuggestionsDropdown({ suggestions, onSelect }) {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden transform opacity-100 scale-100 transition-all duration-200">
      <ul className="py-2">
        {suggestions.map((suggestion, index) => {
          const isCity = suggestion.startsWith('À ');
          return (
            <li 
              key={index}
              onClick={() => onSelect(suggestion)}
              className="px-5 py-3 hover:bg-gray-50 cursor-pointer flex items-center group transition-colors"
            >
              {isCity ? (
                <div className="bg-gray-100 p-2 rounded-lg mr-3 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 group-hover:text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              ) : (
                <div className="bg-gray-100 p-2 rounded-lg mr-3 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 group-hover:text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              )}
              <span className="text-gray-700 group-hover:text-indigo-900 font-medium">
                {suggestion}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
