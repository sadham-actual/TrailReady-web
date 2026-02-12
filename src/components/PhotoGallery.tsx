'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import Image from 'next/image';

type ConfidenceLevel = 'low' | 'medium' | 'high' | string;

export interface GalleryPhoto {
  id: string;
  url: string;
  vehicleType: string;
  timestamp: string;
  fieldNotes?: string;
  confidence?: ConfidenceLevel;
}

interface PhotoGalleryProps {
  photos: GalleryPhoto[];
  className?: string;
}

function formatIntelTime(value: string): string {
  if (!value) return 'UNKNOWN';
  if (/[a-z]/i.test(value) && value.toUpperCase().includes('AGO')) {
    return value.toUpperCase();
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value.toUpperCase();

  const deltaMs = Date.now() - parsed.getTime();
  const mins = Math.floor(deltaMs / (1000 * 60));
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);

  if (mins < 1) return 'NOW';
  if (mins < 60) return `${mins}M AGO`;
  if (hours < 24) return `${hours}H AGO`;
  return `${days}D AGO`;
}

function confidenceLabel(confidence?: ConfidenceLevel): string {
  if (!confidence) return 'UNKNOWN';
  return confidence.toUpperCase();
}

export function PhotoGallery({ photos, className = '' }: PhotoGalleryProps) {
  const [expandedPhoto, setExpandedPhoto] = useState<GalleryPhoto | null>(null);

  useEffect(() => {
    if (!expandedPhoto) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setExpandedPhoto(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [expandedPhoto]);

  if (!photos || photos.length === 0) {
    return (
      <section className={`bg-stone-50 ${className}`}>
        <div className="flex min-h-48 items-center justify-center border border-dashed border-stone-700 bg-stone-50 px-4 py-10">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-stone-600">
            NO PHOTO INTEL AVAILABLE
          </p>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className={`bg-stone-50 ${className}`}>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {photos.map((photo, index) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => setExpandedPhoto(photo)}
              className="group relative overflow-hidden border border-stone-800 bg-stone-100 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-600"
              aria-label={`Expand photo ${index + 1}`}
            >
              <div className="relative aspect-square">
                <Image
                  src={photo.url}
                  alt={`Trail photo ${index + 1}`}
                  fill
                  sizes="(max-width: 768px) 50vw, 33vw"
                  className="object-cover"
                />

                <div className="pointer-events-none absolute inset-0">
                  <span className="absolute left-0 top-0 h-4 w-4 border-l border-t border-amber-600 opacity-0 transition-all duration-200 group-hover:left-1 group-hover:top-1 group-hover:opacity-100" />
                  <span className="absolute right-0 top-0 h-4 w-4 border-r border-t border-amber-600 opacity-0 transition-all duration-200 group-hover:right-1 group-hover:top-1 group-hover:opacity-100" />
                  <span className="absolute bottom-0 left-0 h-4 w-4 border-b border-l border-amber-600 opacity-0 transition-all duration-200 group-hover:bottom-1 group-hover:left-1 group-hover:opacity-100" />
                  <span className="absolute bottom-0 right-0 h-4 w-4 border-b border-r border-amber-600 opacity-0 transition-all duration-200 group-hover:bottom-1 group-hover:right-1 group-hover:opacity-100" />
                </div>

                <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-2 py-1.5">
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-stone-100">
                    {photo.vehicleType.toUpperCase()} • {formatIntelTime(photo.timestamp)}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {expandedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/80 p-4 md:p-8"
          role="dialog"
          aria-modal="true"
          onClick={() => setExpandedPhoto(null)}
        >
          <div
            className="relative grid h-full w-full max-w-6xl grid-rows-[1fr_auto] overflow-hidden border border-stone-200 bg-stone-50 md:grid-cols-[1fr_320px] md:grid-rows-1"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative bg-black">
              <Image
                src={expandedPhoto.url}
                alt="Expanded trail intel"
                fill
                sizes="100vw"
                className="object-contain"
              />
              <button
                type="button"
                onClick={() => setExpandedPhoto(null)}
                className="absolute right-3 top-3 border border-stone-200 bg-black/70 p-1.5 text-stone-100 transition-colors hover:border-amber-600 hover:text-amber-600"
                aria-label="Close expanded photo"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <aside className="border-t border-stone-300 bg-stone-50 p-4 md:border-l md:border-t-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-stone-500">Expanded View</p>
              <p className="mt-2 font-mono text-xs font-semibold uppercase tracking-wider text-stone-900">
                {expandedPhoto.vehicleType.toUpperCase()} • {formatIntelTime(expandedPhoto.timestamp)}
              </p>

              <div className="mt-4 border border-stone-300 bg-stone-100 p-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-600">Field Notes</p>
                <p className="mt-2 font-mono text-xs uppercase tracking-wider text-stone-800">
                  {expandedPhoto.fieldNotes?.trim() || 'NO FIELD NOTES'}
                </p>
              </div>

              <div className="mt-3 border border-stone-300 bg-stone-100 p-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-600">Confidence</p>
                <p className="mt-2 font-mono text-xs font-semibold uppercase tracking-wider text-amber-700">
                  {confidenceLabel(expandedPhoto.confidence)}
                </p>
              </div>
            </aside>
          </div>
        </div>
      )}
    </>
  );
}

export default PhotoGallery;
