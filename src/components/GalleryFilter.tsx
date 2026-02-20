import { useState } from 'react';
import {
  categoryLabels,
  type GalleryCategory,
  type Photo,
} from '../data/gallery';

interface Props {
  photos: Photo[];
}

export default function GalleryFilter({ photos }: Props) {
  const [active, setActive] = useState<GalleryCategory | 'all'>('all');

  const categories = Object.keys(categoryLabels) as GalleryCategory[];
  const filtered =
    active === 'all' ? photos : photos.filter((p) => p.category === active);

  if (photos.length === 0) {
    return (
      <div className="rounded-lg border border-border/50 bg-bg-secondary/50 p-12 text-center">
        <p className="text-text-muted">Photos coming soon.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap gap-2">
        <button
          onClick={() => setActive('all')}
          aria-pressed={active === 'all'}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            active === 'all'
              ? 'bg-accent text-bg'
              : 'border border-border bg-bg-secondary text-text-muted hover:text-text'
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActive(cat)}
            aria-pressed={active === cat}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              active === cat
                ? 'bg-accent text-bg'
                : 'border border-border bg-bg-secondary text-text-muted hover:text-text'
            }`}
          >
            {categoryLabels[cat]}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((photo, i) => (
          <div
            key={i}
            className="group overflow-hidden rounded-lg border border-border/50"
          >
            <img
              src={photo.src}
              alt={photo.alt}
              className="aspect-[4/3] w-full object-cover transition-transform group-hover:scale-105"
              loading="lazy"
            />
            {photo.caption && (
              <div className="bg-bg-secondary p-3">
                <p className="text-sm text-text-muted">{photo.caption}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
