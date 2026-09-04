import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  Navigation, 
  Check, 
  ExternalLink, 
  Search, 
  Compass
} from 'lucide-react';
import { LocationTag } from '../types';

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation?: LocationTag;
  onSaveLocation: (location: LocationTag | undefined) => void;
}

const POPULAR_SANCTUARIES = [
  { name: 'Cubbon Park, Bengaluru', address: 'Kasturba Road, Bengaluru, Karnataka', lat: 12.9763, lng: 77.5929, category: 'Nature & Parks' },
  { name: 'Marine Drive, Mumbai', address: 'Netaji Subhash Chandra Bose Road, Mumbai, Maharashtra', lat: 18.9438, lng: 72.8232, category: 'Coastal & Serenity' },
  { name: 'Lodhi Garden, New Delhi', address: 'Lodhi Road, New Delhi, Delhi', lat: 28.5933, lng: 77.2197, category: 'Heritage & Quiet' },
  { name: 'Varanasi Ghats, Varanasi', address: 'Ganga Riverfront, Varanasi, Uttar Pradesh', lat: 25.3176, lng: 82.9739, category: 'Spiritual' },
  { name: 'Munnar Tea Hills, Kerala', address: 'Idukki District, Kerala', lat: 10.0889, lng: 77.0595, category: 'Nature & Solitude' },
  { name: 'Home Sanctuary & Reading Nook', address: 'Private Sacred Space', category: 'Home' }
];

const CATEGORIES = [
  'Nature & Solitude',
  'Cafe & Reflection',
  'Travel & Journey',
  'Home Sanctuary',
  'Creative Studio',
  'Spiritual'
];

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  isOpen,
  onClose,
  currentLocation,
  onSaveLocation
}) => {
  const [placeName, setPlaceName] = useState(currentLocation?.name || '');
  const [address, setAddress] = useState(currentLocation?.address || '');
  const [selectedCategory, setSelectedCategory] = useState(currentLocation?.placeCategory || 'Nature & Solitude');
  const [lat, setLat] = useState<number | undefined>(currentLocation?.lat);
  const [lng, setLng] = useState<number | undefined>(currentLocation?.lng);
  const [isLocating, setIsLocating] = useState(false);

  if (!isOpen) return null;

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const latitude = pos.coords.latitude;
        const longitude = pos.coords.longitude;
        setLat(latitude);
        setLng(longitude);
        
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          if (res.ok) {
            const data = await res.json();
            const displayName = data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            const city = data.address?.city || data.address?.town || data.address?.suburb || 'Current Location';
            setPlaceName(city);
            setAddress(displayName);
          }
        } catch {
          setPlaceName('Current Coordinates');
          setAddress(`Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`);
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setIsLocating(false);
        alert('Could not retrieve GPS location. You can enter the place name manually.');
      },
      { timeout: 10000 }
    );
  };

  const handleSelectPreset = (preset: typeof POPULAR_SANCTUARIES[0]) => {
    setPlaceName(preset.name);
    setAddress(preset.address);
    setLat(preset.lat);
    setLng(preset.lng);
    setSelectedCategory(preset.category);
  };

  const handleSave = () => {
    if (!placeName.trim()) {
      onSaveLocation(undefined);
      onClose();
      return;
    }

    const query = encodeURIComponent(`${placeName} ${address || ''}`.trim());
    const mapUrl = lat && lng 
      ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
      : `https://www.google.com/maps/search/?api=1&query=${query}`;

    onSaveLocation({
      name: placeName.trim(),
      address: address.trim() || undefined,
      lat,
      lng,
      mapUrl,
      placeCategory: selectedCategory
    });
    onClose();
  };

  const handleClear = () => {
    onSaveLocation(undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#242731] border border-[#373b47] text-slate-100 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#373b47] flex items-center justify-between bg-[#1c1e26]">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif font-semibold text-lg text-slate-100">
                Tag Location &amp; Google Maps
              </h2>
              <p className="text-xs text-slate-400">
                Anchor your reflection to where it happened
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-[#282c37] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Quick GPS Button */}
          <button
            type="button"
            onClick={handleGetCurrentLocation}
            disabled={isLocating}
            className="w-full flex items-center justify-center space-x-2 bg-[#1c1e26] hover:bg-[#2d313d] text-slate-200 border border-[#373b47] py-2.5 px-4 rounded-xl text-xs font-semibold transition disabled:opacity-50"
          >
            <Navigation className={`w-4 h-4 text-rose-400 ${isLocating ? 'animate-spin' : ''}`} />
            <span>{isLocating ? 'Detecting Location...' : 'Use Current GPS Location'}</span>
          </button>

          {/* Location Inputs */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Place or Landmark Name
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={placeName}
                  onChange={(e) => setPlaceName(e.target.value)}
                  placeholder="e.g. Cubbon Park, Chai Point, or Home"
                  className="w-full bg-[#1c1e26] border border-[#373b47] focus:border-amber-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-100 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Address / City / Notes (Optional)
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Bengaluru, Karnataka or Near Lake Viewpoint"
                className="w-full bg-[#1c1e26] border border-[#373b47] focus:border-amber-500 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none"
              />
            </div>

            {/* Categories */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Vibe &amp; Category
              </label>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-full text-xs transition ${
                      selectedCategory === cat
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 font-medium'
                        : 'bg-[#1c1e26] text-slate-400 border border-[#373b47] hover:text-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Popular Sanctuaries & Presets */}
          <div className="space-y-2 pt-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center">
              <Compass className="w-3.5 h-3.5 mr-1 text-amber-400" />
              Suggested Spots &amp; Sanctuaries
            </label>
            <div className="grid grid-cols-2 gap-2">
              {POPULAR_SANCTUARIES.slice(0, 4).map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectPreset(item)}
                  className="p-2.5 rounded-xl bg-[#1c1e26] border border-[#373b47] hover:border-amber-400/40 text-left transition"
                >
                  <p className="text-xs font-semibold text-slate-200 truncate">{item.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{item.category}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Map Preview Link */}
          {placeName && (
            <div className="p-3 bg-[#1c1e26] rounded-xl border border-[#373b47] flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2 text-rose-300">
                <MapPin className="w-4 h-4 shrink-0" />
                <span className="truncate font-medium">{placeName}</span>
              </div>
              <a
                href={lat && lng ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(placeName)}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-1 text-amber-400 hover:text-amber-300 transition shrink-0 ml-2"
              >
                <span>View on Google Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#1c1e26] border-t border-[#373b47] flex items-center justify-between">
          {currentLocation ? (
            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-rose-400 hover:text-rose-300"
            >
              Remove Location
            </button>
          ) : (
            <div />
          )}
          
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 text-xs font-medium transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!placeName.trim()}
              className="flex items-center space-x-1.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 px-5 py-2 rounded-xl font-bold text-xs transition shadow disabled:opacity-40"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Location</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
