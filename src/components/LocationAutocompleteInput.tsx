import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Loader2, ExternalLink, X } from 'lucide-react';

export interface LocationSuggestion {
  id: string;
  primaryName: string;
  secondaryName: string;
  fullAddress: string;
  lat?: number;
  lon?: number;
}

interface LocationAutocompleteInputProps {
  label: string;
  value: string;
  placeholder?: string;
  required?: boolean;
  onChange: (value: string, details?: { fullAddress: string; lat?: number; lon?: number }) => void;
  helperText?: string;
}

export const LocationAutocompleteInput: React.FC<LocationAutocompleteInputProps> = ({
  label,
  value,
  placeholder = 'Buscar cancha, estadio o dirección...',
  required = false,
  onChange,
  helperText,
}) => {
  const [inputValue, setInputValue] = useState(value || '');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<any>(null);

  // Sync internal input value if prop changes externally
  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Search places as user types
  const handleInputChange = (text: string) => {
    setInputValue(text);
    onChange(text);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    const trimmed = text.trim();
    if (trimmed.length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        // Query Photon Geocoding API (Fast, Free, OpenStreetMap powered, no API key needed)
        const res = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(trimmed)}&limit=6`
        );
        if (!res.ok) throw new Error('Photon error');
        const data = await res.json();

        if (data && Array.isArray(data.features) && data.features.length > 0) {
          const list: LocationSuggestion[] = data.features.map((f: any, idx: number) => {
            const props = f.properties || {};
            const coords = f.geometry?.coordinates || [];
            const lon = coords[0];
            const lat = coords[1];

            const name = props.name || props.street || trimmed;
            const subtitleParts = [
              props.street && props.name !== props.street ? props.street : null,
              props.locality || props.district,
              props.city,
              props.state,
              props.country,
            ].filter(Boolean);

            const secondaryName = subtitleParts.join(', ');
            const fullAddress = secondaryName ? `${name}, ${secondaryName}` : name;

            return {
              id: `${props.osm_id || idx}_${lat}_${lon}`,
              primaryName: name,
              secondaryName,
              fullAddress,
              lat,
              lon,
            };
          });
          setSuggestions(list);
          setIsOpen(true);
        } else {
          setSuggestions([]);
          setIsOpen(false);
        }
      } catch (err) {
        console.warn('Autocomplete fetch error:', err);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 280);
  };

  const handleSelectSuggestion = (sug: LocationSuggestion) => {
    setInputValue(sug.fullAddress);
    onChange(sug.fullAddress, {
      fullAddress: sug.fullAddress,
      lat: sug.lat,
      lon: sug.lon,
    });
    setIsOpen(false);
    setSuggestions([]);
  };

  const mapsUrl = inputValue.trim()
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(inputValue.trim())}`
    : null;

  return (
    <div ref={containerRef} className="relative space-y-1">
      <div className="flex items-center justify-between">
        <label className="block text-[11px] font-bold uppercase text-[#65676B]">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        {mapsUrl && (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[10px] text-[#1877F2] hover:text-[#0866FF] font-bold transition-colors"
          >
            <span>Ver en Google Maps</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#65676B]">
          {isLoading ? (
            <Loader2 className="w-4 h-4 text-[#1877F2] animate-spin" />
          ) : (
            <MapPin className="w-4 h-4 text-[#1877F2]" />
          )}
        </div>

        <input
          type="text"
          required={required}
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          className="w-full pl-9 pr-9 py-2 bg-[#F0F2F5] border border-[#CED0D4] rounded-xl text-[#050505] text-xs font-medium focus:outline-none focus:border-[#1877F2] focus:bg-white transition-all"
        />

        {inputValue && (
          <button
            type="button"
            onClick={() => {
              setInputValue('');
              onChange('');
              setSuggestions([]);
              setIsOpen(false);
            }}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#65676B] hover:text-[#050505]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {helperText && (
        <p className="text-[10px] text-[#65676B] mt-0.5">{helperText}</p>
      )}

      {/* Uber-style Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-[#CED0D4] rounded-2xl shadow-xl overflow-hidden divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-150 max-h-64 overflow-y-auto">
          <div className="px-3 py-1.5 bg-[#F0F2F5] text-[10px] font-bold text-[#65676B] uppercase tracking-wider flex items-center gap-1">
            <Search className="w-3 h-3 text-[#1877F2]" />
            Sugerencias de Ubicación
          </div>
          {suggestions.map((sug) => (
            <button
              key={sug.id}
              type="button"
              onClick={() => handleSelectSuggestion(sug)}
              className="w-full text-left px-3.5 py-2.5 hover:bg-[#E7F3FF]/60 flex items-start gap-2.5 transition-colors cursor-pointer group"
            >
              <div className="p-1.5 rounded-lg bg-[#E7F3FF] text-[#1877F2] group-hover:bg-[#1877F2] group-hover:text-white transition-colors shrink-0 mt-0.5">
                <MapPin className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-[#050505] truncate group-hover:text-[#1877F2]">
                  {sug.primaryName}
                </p>
                {sug.secondaryName && (
                  <p className="text-[10px] text-[#65676B] truncate mt-0.5">
                    {sug.secondaryName}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
