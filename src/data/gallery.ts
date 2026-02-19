export interface Photo {
  src: string;
  alt: string;
  category: GalleryCategory;
  date?: string;
  caption?: string;
}

export type GalleryCategory =
  | 'eagles'
  | 'phillies'
  | 'sailing'
  | 'motorcycles'
  | 'events';

export const categoryLabels: Record<GalleryCategory, string> = {
  eagles: 'Eagles',
  phillies: 'Phillies',
  sailing: 'Sailing',
  motorcycles: 'Motorcycles',
  events: 'Events',
};

// Photos will be added here as they are uploaded to src/assets/photos/
// Example entry:
// {
//   src: '/photos/eagles/game-day-2026.jpg',
//   alt: 'Eagles game day at Lincoln Financial Field',
//   category: 'eagles',
//   date: '2026-01-12',
//   caption: 'Divisional round vs Dallas',
// },
const photos: Photo[] = [];

export default photos;
