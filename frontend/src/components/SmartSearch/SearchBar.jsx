import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import SuggestionsDropdown from './SuggestionsDropdown';
import IntentChips from './IntentChips';

export default function SearchBar({ onSearch, isSearching }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [intent, setIntent] = useState(null);
  const [fallbackMsg, setFallbackMsg] = useState(null);
  
  const searchRef = useRef(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounce logic for suggestions
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length >= 2) {
        fetchSuggestions(query);
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const fetchSuggestions = async (q) => {
    try {
      const response = await axios.get(`/api/search/suggestions?q=${encodeURIComponent(q)}`);
      setSuggestions(response.data.suggestions || []);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    }
  };

  const handleSearch = async (searchQuery) => {
    if (!searchQuery.trim()) return;
    
    setShowSuggestions(false);
    
    try {
      // Provide the query to parent, and let parent handle loading state
      const response = await axios.post('/api/search/smart', { q: searchQuery });
      
      setIntent(response.data.meta.intent);
      
      if (response.data.meta.fallback_used) {
        setFallbackMsg(response.data.meta.fallback_used === 'dropped_rooms_surface' 
          ? "Nous n'avons pas trouvé de résultats exacts, nous avons élargi la recherche (sans critère de surface/chambres)." 
          : "Nous avons élargi la recherche pour vous proposer plus de résultats.");
      } else {
        setFallbackMsg(null);
      }
      
      onSearch(response.data.data, response.data.meta);
    } catch (error) {
      console.error("Error performing smart search:", error);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    handleSearch(query);
  };

  const handleSuggestionClick = (suggestion) => {
    const cleanSuggestion = suggestion.replace(/^À\s/, '');
    setQuery(cleanSuggestion);
    handleSearch(cleanSuggestion);
  };

  return (
    <div className="w-full max-w-4xl mx-auto my-6" ref={searchRef}>
      <form onSubmit={onSubmit} className="relative flex items-center w-full h-16 rounded-full focus-within:shadow-lg bg-white overflow-hidden border border-gray-200 transition-shadow">
        <div className="grid place-items-center h-full w-12 text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        
        <input
          className="peer h-full w-full outline-none text-lg text-gray-700 bg-transparent"
          type="text"
          id="search"
          placeholder="Ex: Maison à Rabat avec 3 chambres..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          autoComplete="off"
        />

        <button 
          type="submit" 
          disabled={isSearching}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 mr-2 font-medium transition-colors disabled:bg-indigo-400 flex items-center"
        >
          {isSearching ? (
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : null}
          Rechercher
        </button>
      </form>

      {showSuggestions && suggestions.length > 0 && (
        <SuggestionsDropdown 
          suggestions={suggestions} 
          onSelect={handleSuggestionClick} 
        />
      )}

      {intent && <IntentChips intent={intent} />}
      
      {fallbackMsg && (
        <div className="mt-3 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100 flex items-start">
          <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {fallbackMsg}
        </div>
      )}
    </div>
  );
}
