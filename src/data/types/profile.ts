/**
 * Own-profile / visitor profile domain types.
 * Catalog explore services use `Service` (CatalogService alias) in index.ts;
 * profile offerings use `ServiceOffering` (ProfileService alias).
 */

export type ProfileTab = 'About' | 'Portfolio' | 'Services' | 'Posts';

export interface ProfileLanguage {
  id: string;
  name: string;
  level: string;
  flag: string;
}

export interface ProfileEducation {
  id: string;
  school: string;
  degree: string;
  field: string;
  years: string;
  gpa?: string;
  description?: string;
  logoColor?: string;
}

export interface ProfileExperience {
  id: string;
  title: string;
  company: string;
  type: string;
  years: string;
  description: string;
  logoColor?: string;
  logoInitials?: string;
}

export interface ProfileCertification {
  id: string;
  name: string;
  org: string;
  year: string;
}

export interface PortfolioProject {
  id: string;
  title: string;
  description: string;
  images: string[];
  /** Backend media asset ids aligned with `images` order when known */
  mediaAssetIds?: string[];
  hasVideo?: boolean;
  videoIndex?: number;
}

export interface ServicePackage {
  name: 'Basic' | 'Standard' | 'Premium';
  priceLabel: string;
  delivery: string;
  includes: string[];
}

export interface ServiceAddon {
  id: string;
  title: string;
  priceLabel: string;
}

/** Profile tab service offering (packages/addons). Prefer over catalog `Service`. */
export interface ServiceOffering {
  id: string;
  title: string;
  description: string;
  rating: number;
  reviewCount: number;
  images: string[];
  /** Backend media asset ids aligned with `images` order when known */
  mediaAssetIds?: string[];
  packages: ServicePackage[];
  addons?: ServiceAddon[];
}

/** @deprecated Prefer ServiceOffering — kept for existing imports */
export type ProfileService = ServiceOffering;

export interface ProfileContent {
  bio: string;
  languages: ProfileLanguage[];
  talents: string[];
  education: ProfileEducation[];
  experience: ProfileExperience[];
  certifications: ProfileCertification[];
  portfolio: PortfolioProject[];
  services: ServiceOffering[];
  postIds: string[];
}

export const ABOUT_SECTION_KEYS = [
  'bio',
  'languages',
  'talents',
  'education',
  'experience',
  'certifications',
] as const;

export type AboutSectionKey = (typeof ABOUT_SECTION_KEYS)[number];

export const ABOUT_SECTION_LABELS: Record<AboutSectionKey, string> = {
  bio: 'Bio',
  languages: 'Languages',
  talents: 'Talents',
  education: 'Education',
  experience: 'Experience',
  certifications: 'Certifications',
};

export const ABOUT_SECTION_ADD_LABELS: Record<AboutSectionKey, string> = {
  bio: 'Add a bio',
  languages: 'Add languages',
  talents: 'Add talents',
  education: 'Add education',
  experience: 'Add experience',
  certifications: 'Add certifications',
};

export function isAboutSectionFilled(content: ProfileContent, key: AboutSectionKey) {
  if (key === 'bio') return content.bio.trim().length > 0;
  return (content[key] as unknown[]).length > 0;
}

export const TALENT_CHIP_STYLES = [
  { bg: '#FCE7F3', text: '#BE185D' },
  { bg: '#DCFCE7', text: '#15803D' },
  { bg: '#FEF3C7', text: '#A16207' },
  { bg: '#DBEAFE', text: '#1D4ED8' },
  { bg: '#FCE7F3', text: '#BE185D' },
  { bg: '#DCFCE7', text: '#15803D' },
  { bg: '#FEF3C7', text: '#A16207' },
];
