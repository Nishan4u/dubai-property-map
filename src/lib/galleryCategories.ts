export const exteriorGalleryCategories = [
  "Building",
  "Community",
  "Amenities",
  "Landscape",
  "Entrance",
  "Pool",
  "Outdoor",
];

export const interiorGalleryCategories = [
  "Living Room",
  "Bedroom",
  "Kitchen",
  "Bathroom",
  "Balcony",
  "Interior Amenities",
];

export function gallerySlug(category: string) {
  return category.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}
