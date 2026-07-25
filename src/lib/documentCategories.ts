export const documentCategories = [
  "Brochure",
  "Master Plan",
  "Floor Plans",
  "Price List",
  "Factsheet",
  "NOC",
  "Other",
];

export function categorySlug(category: string) {
  return category.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}
