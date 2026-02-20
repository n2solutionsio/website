export interface Photo {
  src: string;
  alt: string;
  category: GalleryCategory;
  width: number;
  height: number;
  albumSlug?: string;
  albumTitle?: string;
  albumDate?: string;
}

export interface Album {
  slug: string;
  title: string;
  date?: string;
  category: GalleryCategory;
  photos: Photo[];
}

export type GalleryCategory =
  | 'eagles'
  | 'phillies'
  | 'sailing'
  | 'motorcycles'
  | 'pets'
  | 'events';

export const categoryLabels: Record<GalleryCategory, string> = {
  eagles: 'Eagles',
  phillies: 'Phillies',
  sailing: 'Sailing',
  motorcycles: 'Motorcycles',
  pets: 'Pets',
  events: 'Events',
};
