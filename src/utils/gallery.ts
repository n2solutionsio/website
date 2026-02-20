import { getImage } from 'astro:assets';
import type { Album, GalleryCategory, Photo } from '../data/gallery';
import { categoryLabels } from '../data/gallery';

// Glob all images under src/assets/photos/ at build time
const imageModules = import.meta.glob<{ default: ImageMetadata }>(
  '../assets/photos/**/*.{jpg,jpeg,png,webp}',
  { eager: true },
);

const VALID_CATEGORIES = new Set(Object.keys(categoryLabels));

/** Parse an album slug like "2025-09-07-cowboys" → { date, title } */
function parseAlbumSlug(slug: string): { date?: string; title: string } {
  const dateMatch = slug.match(/^(\d{4}-\d{2}-\d{2})-(.+)$/);
  if (dateMatch) {
    return { date: dateMatch[1], title: formatSlugTitle(dateMatch[2]) };
  }
  return { title: formatSlugTitle(slug) };
}

/** Convert "stadium-tour" → "Stadium Tour" */
function formatSlugTitle(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** Generate alt text from filename: "game-day-2026.jpg" → "Game Day 2026" */
function fileToAlt(filename: string): string {
  const name = filename.replace(/\.[^.]+$/, '');
  return formatSlugTitle(name);
}

/**
 * Discover all photos from the file system and optimize them.
 * Returns a flat array of Photo objects with optimized src URLs.
 */
export async function discoverPhotos(): Promise<Photo[]> {
  const photos: Photo[] = [];

  for (const [path, mod] of Object.entries(imageModules)) {
    // path looks like: ../assets/photos/sailing/sailing-philly.jpg
    // or: ../assets/photos/eagles/2025-09-07-cowboys/photo.jpg
    const segments = path.split('/');
    const photosIdx = segments.indexOf('photos');
    if (photosIdx === -1) continue;

    const afterPhotos = segments.slice(photosIdx + 1);
    // afterPhotos: ["sailing", "sailing-philly.jpg"]
    // or: ["eagles", "2025-09-07-cowboys", "photo.jpg"]

    if (afterPhotos.length < 2) continue;

    const category = afterPhotos[0];
    if (!VALID_CATEGORIES.has(category)) continue;

    const filename = afterPhotos[afterPhotos.length - 1];
    // Skip hidden files
    if (filename.startsWith('.')) continue;

    const original = mod.default;
    const optimized = await getImage({
      src: original,
      width: 800,
      format: 'webp',
    });

    const photo: Photo = {
      src: optimized.src,
      alt: fileToAlt(filename),
      category: category as GalleryCategory,
      width: (optimized.attributes.width as number) ?? 800,
      height: (optimized.attributes.height as number) ?? 600,
    };

    // Check if this is inside an album subfolder
    if (afterPhotos.length >= 3) {
      const albumSlug = afterPhotos[1];
      const parsed = parseAlbumSlug(albumSlug);
      photo.albumSlug = albumSlug;
      photo.albumTitle = parsed.title;
      photo.albumDate = parsed.date;
    }

    photos.push(photo);
  }

  return photos;
}

/**
 * Group a flat list of photos into albums, sorted newest-first.
 * Loose photos (no album folder) are grouped under a default album.
 */
export function groupPhotosByAlbum(photos: Photo[]): Album[] {
  const albumMap = new Map<string, Album>();

  for (const photo of photos) {
    const key = photo.albumSlug
      ? `${photo.category}/${photo.albumSlug}`
      : `${photo.category}/_loose`;

    if (!albumMap.has(key)) {
      albumMap.set(key, {
        slug: photo.albumSlug ?? `${photo.category}-photos`,
        title: photo.albumTitle ?? categoryLabels[photo.category],
        date: photo.albumDate,
        category: photo.category,
        photos: [],
      });
    }

    albumMap.get(key)!.photos.push(photo);
  }

  const albums = Array.from(albumMap.values());

  // Sort: dated albums newest-first, then undated alphabetically
  albums.sort((a, b) => {
    if (a.date && b.date) return b.date.localeCompare(a.date);
    if (a.date) return -1;
    if (b.date) return 1;
    return a.title.localeCompare(b.title);
  });

  return albums;
}
