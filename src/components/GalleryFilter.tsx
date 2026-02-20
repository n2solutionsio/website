import { useEffect, useState } from 'react';
import {
  categoryLabels,
  type Album,
  type GalleryCategory,
} from '../data/gallery';

interface Props {
  albums: Album[];
  initialCategory: string;
}

export default function GalleryFilter({ albums, initialCategory }: Props) {
  const [active, setActive] = useState<GalleryCategory | 'all'>(
    isValidCategory(initialCategory) ? initialCategory : 'all',
  );

  // Sync with browser back/forward
  useEffect(() => {
    function onPopState() {
      const params = new URLSearchParams(window.location.search);
      const cat = params.get('category') ?? 'all';
      setActive(isValidCategory(cat) ? cat : 'all');
    }
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  function handleFilter(cat: GalleryCategory | 'all') {
    setActive(cat);
    const url = new URL(window.location.href);
    if (cat === 'all') {
      url.searchParams.delete('category');
    } else {
      url.searchParams.set('category', cat);
    }
    window.history.pushState({}, '', url.toString());
  }

  const categories = Object.keys(categoryLabels) as GalleryCategory[];
  const filtered =
    active === 'all' ? albums : albums.filter((a) => a.category === active);

  if (albums.length === 0) {
    return (
      <div className="rounded-lg border border-border/50 bg-bg-secondary/50 p-12 text-center">
        <p className="text-text-muted">Photos coming soon.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Filter pills */}
      <div className="mb-8 flex flex-wrap gap-2">
        <button
          onClick={() => handleFilter('all')}
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
            onClick={() => handleFilter(cat)}
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

      {/* Album sections */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-border/50 bg-bg-secondary/50 p-12 text-center">
          <p className="text-text-muted">No photos in this category yet.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {filtered.map((album) => (
            <section key={`${album.category}-${album.slug}`}>
              <div className="mb-4">
                <h2 className="text-xl font-bold">{album.title}</h2>
                {album.date && (
                  <p className="text-sm text-text-muted">
                    {formatDate(album.date)}
                  </p>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {album.photos.map((photo, i) => (
                  <div
                    key={i}
                    className="group overflow-hidden rounded-lg border border-border/50"
                  >
                    <img
                      src={photo.src}
                      alt={photo.alt}
                      width={photo.width}
                      height={photo.height}
                      className="aspect-[4/3] w-full object-cover transition-transform group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function isValidCategory(value: string): value is GalleryCategory | 'all' {
  return value === 'all' || value in categoryLabels;
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
