export type GalleryItem = {
  src: string;
  alt: string;
  orientation: 'landscape' | 'portrait' | 'square';
  width: number;
  height: number;
};

type RawGalleryItem = Omit<GalleryItem, 'width' | 'height'>;

const rawGalleryItems: RawGalleryItem[] = [
  {
    src: '/images/gallery/gallery-01.jpg',
    alt: 'Go Kyrgyzstan Travel photo 01',
    orientation: 'landscape',
  },
  {
    src: '/images/gallery/gallery-02.jpg',
    alt: 'Go Kyrgyzstan Travel photo 02',
    orientation: 'landscape',
  },
  {
    src: '/images/gallery/gallery-03.jpg',
    alt: 'Go Kyrgyzstan Travel photo 03',
    orientation: 'landscape',
  },
  {
    src: '/images/gallery/gallery-04.jpg',
    alt: 'Go Kyrgyzstan Travel photo 04',
    orientation: 'landscape',
  },
  {
    src: '/images/gallery/gallery-05.jpg',
    alt: 'Go Kyrgyzstan Travel photo 05',
    orientation: 'landscape',
  },
  {
    src: '/images/gallery/gallery-06.jpg',
    alt: 'Go Kyrgyzstan Travel photo 06',
    orientation: 'landscape',
  },
  {
    src: '/images/gallery/gallery-07.jpg',
    alt: 'Go Kyrgyzstan Travel photo 07',
    orientation: 'landscape',
  },
  {
    src: '/images/gallery/gallery-08.jpg',
    alt: 'Go Kyrgyzstan Travel photo 08',
    orientation: 'landscape',
  },
  {
    src: '/images/gallery/gallery-09.jpg',
    alt: 'Go Kyrgyzstan Travel photo 09',
    orientation: 'landscape',
  },
  {
    src: '/images/gallery/gallery-10.jpg',
    alt: 'Go Kyrgyzstan Travel photo 10',
    orientation: 'landscape',
  },
  {
    src: '/images/gallery/gallery-11.jpg',
    alt: 'Go Kyrgyzstan Travel photo 11',
    orientation: 'landscape',
  },
  {
    src: '/images/gallery/gallery-12.jpg',
    alt: 'Go Kyrgyzstan Travel photo 12',
    orientation: 'landscape',
  },
  {
    src: '/images/gallery/gallery-13.jpg',
    alt: 'Go Kyrgyzstan Travel photo 13',
    orientation: 'portrait',
  },
  {
    src: '/images/gallery/gallery-14.jpg',
    alt: 'Go Kyrgyzstan Travel photo 14',
    orientation: 'portrait',
  },
  {
    src: '/images/gallery/gallery-15.jpg',
    alt: 'Go Kyrgyzstan Travel photo 15',
    orientation: 'portrait',
  },
  {
    src: '/images/gallery/gallery-16.jpg',
    alt: 'Go Kyrgyzstan Travel photo 16',
    orientation: 'portrait',
  },
  {
    src: '/images/gallery/gallery-17.jpg',
    alt: 'Go Kyrgyzstan Travel photo 17',
    orientation: 'portrait',
  },
  {
    src: '/images/gallery/gallery-18.jpg',
    alt: 'Go Kyrgyzstan Travel photo 18',
    orientation: 'portrait',
  },
  {
    src: '/images/gallery/gallery-19.jpg',
    alt: 'Go Kyrgyzstan Travel photo 19',
    orientation: 'portrait',
  },
  {
    src: '/images/gallery/gallery-20.jpg',
    alt: 'Go Kyrgyzstan Travel photo 20',
    orientation: 'portrait',
  },
  {
    src: '/images/gallery/gallery-21.jpg',
    alt: 'Go Kyrgyzstan Travel photo 21',
    orientation: 'portrait',
  },
  {
    src: '/images/gallery/gallery-22.jpg',
    alt: 'Go Kyrgyzstan Travel photo 22',
    orientation: 'portrait',
  },
  {
    src: '/images/gallery/gallery-23.jpg',
    alt: 'Go Kyrgyzstan Travel photo 23',
    orientation: 'portrait',
  },
  {
    src: '/images/gallery/gallery-24.jpg',
    alt: 'Go Kyrgyzstan Travel photo 24',
    orientation: 'portrait',
  },
  {
    src: '/images/gallery/gallery-25.jpg',
    alt: 'Go Kyrgyzstan Travel photo 25',
    orientation: 'landscape',
  },
  {
    src: '/images/gallery/gallery-26.jpg',
    alt: 'Go Kyrgyzstan Travel photo 26',
    orientation: 'portrait',
  },
  {
    src: '/images/gallery/gallery-27.jpg',
    alt: 'Go Kyrgyzstan Travel photo 27',
    orientation: 'portrait',
  },
  {
    src: '/images/gallery/gallery-28.jpg',
    alt: 'Go Kyrgyzstan Travel photo 28',
    orientation: 'portrait',
  },
  {
    src: '/images/gallery/gallery-29.jpg',
    alt: 'Go Kyrgyzstan Travel photo 29',
    orientation: 'portrait',
  },
  {
    src: '/images/gallery/gallery-30.jpg',
    alt: 'Go Kyrgyzstan Travel photo 30',
    orientation: 'portrait',
  },
  {
    src: '/images/gallery/gallery-31.jpg',
    alt: 'Go Kyrgyzstan Travel photo 31',
    orientation: 'portrait',
  },
  {
    src: '/images/gallery/gallery-32.jpg',
    alt: 'Go Kyrgyzstan Travel photo 32',
    orientation: 'portrait',
  },
  {
    src: '/images/gallery/gallery-33.jpg',
    alt: 'Go Kyrgyzstan Travel photo 33',
    orientation: 'landscape',
  },
  {
    src: '/images/gallery/gallery-34.jpg',
    alt: 'Go Kyrgyzstan Travel photo 34',
    orientation: 'landscape',
  },
  {
    src: '/images/gallery/gallery-35.jpg',
    alt: 'Go Kyrgyzstan Travel photo 35',
    orientation: 'landscape',
  },
  {
    src: '/images/gallery/gallery-36.jpg',
    alt: 'Go Kyrgyzstan Travel photo 36',
    orientation: 'landscape',
  },
  {
    src: '/images/gallery/gallery-37.jpg',
    alt: 'Go Kyrgyzstan Travel photo 37',
    orientation: 'landscape',
  },
  {
    src: '/images/gallery/gallery-38.jpg',
    alt: 'Go Kyrgyzstan Travel photo 38',
    orientation: 'landscape',
  },
  {
    src: '/images/gallery/gallery-39.jpg',
    alt: 'Go Kyrgyzstan Travel photo 39',
    orientation: 'portrait',
  },
  {
    src: '/images/gallery/gallery-40.jpg',
    alt: 'Go Kyrgyzstan Travel photo 40',
    orientation: 'portrait',
  },
  {
    src: '/images/gallery/gallery-41.jpg',
    alt: 'Go Kyrgyzstan Travel photo 41',
    orientation: 'landscape',
  },
  {
    src: '/images/gallery/gallery-42.jpg',
    alt: 'Go Kyrgyzstan Travel photo 42',
    orientation: 'landscape',
  },
  {
    src: '/images/gallery/gallery-43.jpg',
    alt: 'Go Kyrgyzstan Travel photo 43',
    orientation: 'landscape',
  },
  {
    src: '/images/gallery/gallery-44.jpg',
    alt: 'Go Kyrgyzstan Travel photo 44',
    orientation: 'portrait',
  },
];

const galleryAltText = [
  'Hiker entering a forested mountain gorge in Kyrgyzstan',
  'Red sandstone canyon formations under a blue Kyrgyzstan sky',
  'Traveler sitting at a panoramic red canyon viewpoint in Kyrgyzstan',
  'Layered red mountain ridge and green valley in Kyrgyzstan',
  'Traveler standing beside a wide alpine lake in Kyrgyzstan',
  'Traditional Kyrgyz yurt at a high mountain camp',
  'Traveler walking through a red sandstone canyon in Kyrgyzstan',
  'Camper beside a conifer valley and mountain camp in Kyrgyzstan',
  'Striped canyon landscape at sunset in Kyrgyzstan',
  'Sunlit canyon beneath dramatic storm clouds in Kyrgyzstan',
  'Mountain badlands and rain clouds in Kyrgyzstan',
  'Storm light over a layered canyon landscape in Kyrgyzstan',
  'Milky Way above a traditional yurt camp in Kyrgyzstan',
  'Sunrise behind yurts in a mountain valley in Kyrgyzstan',
  'Wooden cabin in a conifer forest in Kyrgyzstan',
  'Mountain river and bridge beneath snow-capped Kyrgyz peaks',
  'Hiker on a dry canyon ridge in Kyrgyzstan',
  'Off-road expedition van on a pine forest track in Kyrgyzstan',
  'Yurt camp beside a high-altitude lake in Kyrgyzstan',
  'Sun breaking through clouds above a Kyrgyz mountain lake',
  'Traditional yurts overlooking an alpine lake in Kyrgyzstan',
  'Local guide beside an orange off-road vehicle in Kyrgyzstan',
  'Kyrgyz eagle hunter holding a golden eagle',
  'Traveler preparing for a horse ride at a Kyrgyz village camp',
  'International tour group taking a mountain selfie in Kyrgyzstan',
  'Traveler overlooking a turquoise lake inside a rocky gorge',
  'Group of hikers on a forest trail in the Kyrgyz mountains',
  'Hiker descending through a broad mountain valley in Kyrgyzstan',
  'Turquoise alpine lake between steep mountain cliffs in Kyrgyzstan',
  'Mountain lake framed by tall pine trees in Kyrgyzstan',
  'Clear alpine lake below forested Kyrgyz mountains',
  'Horseback travel through a mountain valley in Kyrgyzstan',
  'Two horseback riders on a green Kyrgyz mountain pasture',
  'Horseback rider approaching a rocky mountain pass in Kyrgyzstan',
  'Yurt camp at sunset in a remote Kyrgyz valley',
  'Highland yurt camp beneath snow-covered Kyrgyz peaks',
  'Expedition vehicle on a remote mountain road in Kyrgyzstan',
  'Traditional yurts on a high-altitude plateau in Kyrgyzstan',
  'Traveler at a red canyon viewpoint in Kyrgyzstan',
  'Milky Way and stars above illuminated Kyrgyz yurts',
  'Winding river through a colorful canyon valley in Kyrgyzstan',
  'Panoramic multicolored mountain landscape in Kyrgyzstan',
  'Yurt camp beneath a sunlit mountain range in Kyrgyzstan',
  'Horse riders beneath a rainbow on an open Kyrgyz pasture',
];

const galleryDimensions = [
  [1080, 608], [1080, 608], [1080, 608], [1007, 566],
  [1080, 608], [1080, 608], [1080, 608], [1080, 608],
  [720, 480], [720, 480], [720, 480], [720, 480],
  [1080, 1191], [576, 1234], [720, 1280], [721, 1280],
  [721, 1280], [721, 1280], [960, 1280], [960, 1280],
  [960, 1280], [960, 1280], [900, 1600], [960, 1280],
  [1280, 960], [960, 1280], [960, 1280], [960, 1280],
  [576, 1280], [720, 1280], [720, 1280], [576, 1234],
  [1280, 960], [1080, 957], [1078, 812], [1080, 964],
  [1080, 948], [1080, 948], [771, 1024], [1080, 1240],
  [720, 480], [720, 480], [1080, 719], [1080, 1347],
] as const;

const legacyGalleryItems: GalleryItem[] = rawGalleryItems.map((item, index) => ({
  ...item,
  alt: galleryAltText[index] || item.alt,
  width: galleryDimensions[index]?.[0] || 1200,
  height: galleryDimensions[index]?.[1] || 800,
}));

const previewIndices = [7, 11, 14, 15, 18, 22, 24, 32, 43];

const legacyGalleryPreviewItems = previewIndices
  .map((index) => legacyGalleryItems[index])
  .filter((item): item is GalleryItem => Boolean(item));

export const galleryVideo = {
  src: '/videos/kyrgyz-night-sky.mp4',
  poster: '/images/gallery/video-poster.jpg',
  title: 'Night sky timelapse in Kyrgyzstan',
};

// Generated from the original photo library. The legacy list stays here only
// to preserve the source history; the public gallery uses the de-duplicated set.
export {
  generatedGalleryItems as galleryItems,
  generatedGalleryPreviewItems as galleryPreviewItems,
} from './gallery.generated';
