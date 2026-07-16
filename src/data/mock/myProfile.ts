import { User } from '../types';
import { currentUser, users } from './users';

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

export interface ProfileService {
  id: string;
  title: string;
  description: string;
  rating: number;
  reviewCount: number;
  images: string[];
  packages: ServicePackage[];
  addons?: ServiceAddon[];
}

export interface ProfileContent {
  bio: string;
  languages: ProfileLanguage[];
  talents: string[];
  education: ProfileEducation[];
  experience: ProfileExperience[];
  certifications: ProfileCertification[];
  portfolio: PortfolioProject[];
  services: ProfileService[];
  postIds: string[];
}

export const emptyProfileContent: ProfileContent = {
  bio: '',
  languages: [],
  talents: [],
  education: [],
  experience: [],
  certifications: [],
  portfolio: [],
  services: [],
  postIds: [],
};

export const filledOwnProfile: ProfileContent = {
  bio: 'Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet sint. Velit officia consequat duis enim velit mollit. Exercitation veniam consequat sunt nostrud amet.',
  languages: [
    { id: 'l1', name: 'English', level: 'C1 Advanced', flag: '🇬🇧' },
    { id: 'l2', name: 'Arabic', level: 'C2', flag: '🇸🇦' },
  ],
  talents: [
    'Videography',
    'Visual Storytelling',
    'Studio Light',
    'Editing',
    'Photoshop',
    'Color Fixing',
    'Lightroom',
  ],
  education: [
    {
      id: 'ed1',
      school: 'King Saud University',
      degree: 'Bachelor in Information Technology',
      field: 'Information Technology',
      years: 'Jan 2020 - Aug 2023',
      gpa: '3.8/4.0',
      description:
        'Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet sint. Velit officia consequat duis enim velit mollit.',
      logoColor: '#3B82F6',
    },
    {
      id: 'ed2',
      school: 'King Saud University',
      degree: 'Bachelor in Information Technology',
      field: 'Information Technology',
      years: 'Jan 2020 - Aug 2023',
      gpa: '3.8/4.0',
      description:
        'Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet sint. Velit officia consequat duis enim velit mollit.',
      logoColor: '#3B82F6',
    },
  ],
  experience: [
    {
      id: 'ex1',
      title: 'Intern',
      company: 'Saudi Aramco',
      type: 'Internship',
      years: 'Mar 2020 - Aug 2023',
      description:
        'Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet sint. Velit officia consequat duis enim velit mollit.',
      logoColor: '#16A34A',
      logoInitials: 'SA',
    },
    {
      id: 'ex2',
      title: 'Intern',
      company: 'STC',
      type: 'Internship',
      years: 'Jun 2019 - Dec 2019',
      description:
        'Supporting digital product launches and creative campaigns across the network.',
      logoColor: '#7C3AED',
      logoInitials: 'stc',
    },
  ],
  certifications: [
    {
      id: 'c1',
      name: 'Adobe Certified Professional',
      org: 'Adobe',
      year: '2023',
    },
  ],
  portfolio: [
    {
      id: 'p1',
      title: 'E-commerce App Redesign',
      description:
        'Led end-to-end UX research, wireframing, and UI design for a multi-category shopping app. Improved conversion by clarifying the checkout flow and visual hierarchy.',
      images: [
        'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=400&h=400&fit=crop',
        'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=400&fit=crop',
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=400&fit=crop',
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=400&fit=crop',
        'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=400&fit=crop',
      ],
      hasVideo: true,
      videoIndex: 4,
    },
    {
      id: 'p2',
      title: 'Banking Dashboard Redesign',
      description:
        'Redesigned a fintech dashboard focused on data visualization, balances, and transfer clarity for everyday banking users.',
      images: [
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=400&fit=crop',
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=400&fit=crop',
        'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=400&h=400&fit=crop',
      ],
    },
  ],
  services: [
    {
      id: 'ps1',
      title: 'Designing Dashboards',
      description:
        'Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet sint. Velit officia consequat duis enim velit mollit.',
      rating: 4.0,
      reviewCount: 1880,
      images: [
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=500&fit=crop',
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=500&fit=crop',
        'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&h=500&fit=crop',
      ],
      packages: [
        {
          name: 'Basic',
          priceLabel: '1000',
          delivery: '3 days delivery',
          includes: [
            'Amet minim mollit non deserunt ullamco',
            'Velit officia consequat duis enim',
            'Exercitation veniam consequat sunt',
          ],
        },
        {
          name: 'Standard',
          priceLabel: '2000',
          delivery: '5 days delivery',
          includes: [
            'Everything in Basic',
            'Interactive prototype',
            '2 rounds of revisions',
          ],
        },
        {
          name: 'Premium',
          priceLabel: '3000',
          delivery: '10 days delivery',
          includes: [
            'Everything in Standard',
            'Design system foundations',
            'Unlimited revisions',
          ],
        },
      ],
      addons: [
        { id: 'a1', title: 'Export to Dev-ready Format', priceLabel: '+ 300' },
        { id: 'a2', title: 'Design System Kit', priceLabel: '+ 300' },
      ],
    },
  ],
  postIds: ['p-figma', 'p1'],
};

export const ownProfileUser: User = {
  ...currentUser,
  name: 'Olivia Rhye',
  title: 'Event Photographer',
  location: 'Riyadh, Saudi Arabia',
  rating: 4,
  reviewCount: 72,
  followers: 200,
  isVerified: true,
  avatar:
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
};

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

export function isAboutSectionFilled(content: ProfileContent, key: AboutSectionKey) {
  if (key === 'bio') return content.bio.trim().length > 0;
  return (content[key] as unknown[]).length > 0;
}

export function getVisitorProfileContent(userId: string): ProfileContent {
  const user = users.find((u) => u.id === userId);
  return {
    ...filledOwnProfile,
    bio:
      user?.bio ??
      'Passionate creative professional building impactful work across the region.',
    talents: user?.skills ?? filledOwnProfile.talents,
    postIds: [],
  };
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
