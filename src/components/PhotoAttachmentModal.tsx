import React, { useState } from 'react';
import { 
  X, 
  Image as ImageIcon, 
  Upload, 
  Link as LinkIcon, 
  Sparkles, 
  Plus, 
  Trash2, 
  Check, 
  Layers
} from 'lucide-react';
import { PhotoAttachment } from '../types';
import { generatePhotoInsight } from '../lib/api';

interface PhotoAttachmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  photos: PhotoAttachment[];
  onUpdatePhotos: (photos: PhotoAttachment[]) => void;
  locationName?: string;
}

const CURATED_PRESETS = [
  {
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
    caption: 'Serene mountain valley and crisp morning light',
    albumTitle: 'Nature & Solitude'
  },
  {
    url: 'https://images.unsplash.com/photo-1528164344705-475426879c0d?w=800&auto=format&fit=crop&q=80',
    caption: 'Temple gardens and peaceful twilight walk',
    albumTitle: 'Spiritual Moments'
  },
  {
    url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80',
    caption: 'Warm cappuccino and morning reflection nook',
    albumTitle: 'Daily Cozy Rituals'
  },
  {
    url: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&auto=format&fit=crop&q=80',
    caption: 'Golden hour waves along the coastline',
    albumTitle: 'Coastal Journeys'
  }
];

export const PhotoAttachmentModal: React.FC<PhotoAttachmentModalProps> = ({
  isOpen,
  onClose,
  photos,
  onUpdatePhotos,
  locationName
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'link' | 'presets'>('upload');
  const [photoUrl, setPhotoUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [albumTitle, setAlbumTitle] = useState('');
  const [isGeneratingInsight, setIsGeneratingInsight] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const resultUrl = event.target?.result as string;
        if (resultUrl) {
          const newPhoto: PhotoAttachment = {
            id: `photo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            url: resultUrl,
            caption: file.name.replace(/\.[^/.]+$/, ''),
            source: 'upload'
          };
          onUpdatePhotos([...photos, newPhoto]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddLink = () => {
    if (!photoUrl.trim()) return;
    const isGooglePhotos = photoUrl.includes('photos.app.goo.gl') || photoUrl.includes('photos.google.com');
    const newPhoto: PhotoAttachment = {
      id: `photo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      url: photoUrl.trim(),
      caption: caption.trim() || (isGooglePhotos ? 'Google Photos Memory' : 'Attached Photo'),
      albumTitle: albumTitle.trim() || (isGooglePhotos ? 'Google Photos Shared Album' : undefined),
      source: isGooglePhotos ? 'google_photos' : 'url'
    };
    onUpdatePhotos([...photos, newPhoto]);
    setPhotoUrl('');
    setCaption('');
    setAlbumTitle('');
  };

  const handleAddPreset = (preset: typeof CURATED_PRESETS[0]) => {
    const newPhoto: PhotoAttachment = {
      id: `photo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      url: preset.url,
      caption: preset.caption,
      albumTitle: preset.albumTitle,
      source: 'google_photos'
    };
    onUpdatePhotos([...photos, newPhoto]);
  };

  const handleRemovePhoto = (id: string) => {
    onUpdatePhotos(photos.filter(p => p.id !== id));
  };

  const handleGenerateReflection = async (photo: PhotoAttachment) => {
    try {
      setIsGeneratingInsight(photo.id);
      const insight = await generatePhotoInsight(
        photo.caption || 'Photo memory',
        locationName || 'Mindful Place'
      );
      // Update caption with generated insight
      onUpdatePhotos(photos.map(p => p.id === photo.id ? { ...p, caption: `${p.caption || ''} — ✨ ${insight}` } : p));
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingInsight(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-stone-900 border border-stone-800 text-stone-100 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-stone-800 flex items-center justify-between bg-stone-900/50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif font-semibold text-lg text-stone-100">
                Attach Photos & Google Photos Memories
              </h2>
              <p className="text-xs text-stone-400">
                Enhance your journal with visual memories and AI-generated reflections
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-4 flex space-x-2 border-b border-stone-800">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 flex items-center space-x-1.5 transition ${
              activeTab === 'upload'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Image</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('link')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 flex items-center space-x-1.5 transition ${
              activeTab === 'link'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Google Photos / Web Link</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 flex items-center space-x-1.5 transition ${
              activeTab === 'presets'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Curated Moments</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Upload Tab */}
          {activeTab === 'upload' && (
            <label className="border-2 border-dashed border-stone-700 hover:border-amber-500/60 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition bg-stone-950/40">
              <Upload className="w-8 h-8 text-amber-400 mb-2" />
              <span className="font-semibold text-stone-200 text-sm">Choose photos to upload</span>
              <span className="text-xs text-stone-500 mt-1">PNG, JPG, WEBP up to 10MB</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          )}

          {/* Link Tab */}
          {activeTab === 'link' && (
            <div className="space-y-3 bg-stone-950/50 p-4 rounded-xl border border-stone-800">
              <div>
                <label className="text-xs text-stone-400 font-medium block mb-1">
                  Google Photos or Image URL
                </label>
                <input
                  type="url"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="https://photos.app.goo.gl/... or https://..."
                  className="w-full bg-stone-900 border border-stone-700 focus:border-amber-500 rounded-lg p-2.5 text-xs text-stone-100 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-stone-400 font-medium block mb-1">
                    Caption (Optional)
                  </label>
                  <input
                    type="text"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="e.g. Sunset over the lake"
                    className="w-full bg-stone-900 border border-stone-700 focus:border-amber-500 rounded-lg p-2.5 text-xs text-stone-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-stone-400 font-medium block mb-1">
                    Album Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={albumTitle}
                    onChange={(e) => setAlbumTitle(e.target.value)}
                    placeholder="e.g. Summer Memories"
                    className="w-full bg-stone-900 border border-stone-700 focus:border-amber-500 rounded-lg p-2.5 text-xs text-stone-100 focus:outline-none"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddLink}
                disabled={!photoUrl.trim()}
                className="w-full flex items-center justify-center space-x-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 py-2 rounded-lg font-semibold text-xs transition disabled:opacity-40"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Attach Photo URL</span>
              </button>
            </div>
          )}

          {/* Curated Presets Tab */}
          {activeTab === 'presets' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {CURATED_PRESETS.map((preset, idx) => (
                <div 
                  key={idx}
                  onClick={() => handleAddPreset(preset)}
                  className="group relative rounded-xl overflow-hidden border border-stone-700 hover:border-amber-400 cursor-pointer transition aspect-square"
                >
                  <img
                    src={preset.url}
                    alt={preset.caption}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/20 to-transparent p-2 flex flex-col justify-end">
                    <p className="text-[10px] font-medium text-stone-200 line-clamp-2 leading-tight">
                      {preset.caption}
                    </p>
                    <span className="text-[9px] text-amber-400 mt-0.5 font-semibold flex items-center">
                      <Plus className="w-2.5 h-2.5 mr-0.5" /> Add
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Currently Attached Photos List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                Attached Photos ({photos.length})
              </h3>
            </div>

            {photos.length === 0 ? (
              <p className="text-xs text-stone-500 italic py-2">
                No photos attached yet to this journal reflection.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
                {photos.map((photo) => (
                  <div 
                    key={photo.id}
                    className="bg-stone-950 border border-stone-800 rounded-xl p-2.5 flex space-x-3 items-center group"
                  >
                    <img 
                      src={photo.url} 
                      alt={photo.caption || 'Attached'} 
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 rounded-lg object-cover border border-stone-700 shrink-0" 
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-stone-200 truncate">
                        {photo.caption || 'Photo Memory'}
                      </p>
                      {photo.albumTitle && (
                        <p className="text-[10px] text-stone-400 truncate">
                          Album: {photo.albumTitle}
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={() => handleGenerateReflection(photo)}
                        disabled={isGeneratingInsight === photo.id}
                        className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center space-x-1 mt-1 transition"
                      >
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>{isGeneratingInsight === photo.id ? 'Reflecting...' : 'Photo Reflection'}</span>
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(photo.id)}
                      className="p-1 text-stone-500 hover:text-rose-400 transition"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-stone-900/80 border-t border-stone-800 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center space-x-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 px-5 py-2 rounded-xl font-semibold text-sm transition shadow"
          >
            <Check className="w-4 h-4" />
            <span>Done</span>
          </button>
        </div>
      </div>
    </div>
  );
};
