/**
 * Mock seed data for the signed-in user's profile content.
 * Domain types live in src/data/types/profile.ts — re-exported here for compatibility.
 */
import { User, ProfileContent } from '../types';
import { currentUser, ownProfileUser, users } from './users';

export type {
  ProfileTab,
  ProfileLanguage,
  ProfileEducation,
  ProfileExperience,
  ProfileCertification,
  PortfolioProject,
  ServicePackage,
  ServiceAddon,
  ServiceOffering,
  ProfileService,
  ProfileContent,
  AboutSectionKey,
} from '../types/profile';

export {
  ABOUT_SECTION_KEYS,
  ABOUT_SECTION_LABELS,
  ABOUT_SECTION_ADD_LABELS,
  isAboutSectionFilled,
  TALENT_CHIP_STYLES,
} from '../types/profile';

export { ownProfileUser };

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
      title: 'Design Dashboard',
      description: 'Custom dashboard UI for data visualization',
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
          priceLabel: '1500',
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
        { id: 'a1', title: 'Logo Design', priceLabel: '+ 1000' },
        { id: 'a2', title: 'Social Media Content', priceLabel: '+ 1500' },
      ],
    },
    {
      id: 'ps2',
      title: 'Logo Design',
      description: 'Clean, scalable logo tailored to your brand',
      rating: 4.8,
      reviewCount: 420,
      images: [
        'https://images.unsplash.com/photo-1626785774573-4b7993143456?w=800&h=500&fit=crop',
      ],
      packages: [
        {
          name: 'Basic',
          priceLabel: '800',
          delivery: '2 days delivery',
          includes: ['1 logo concept', '2 revisions', 'PNG & JPG files'],
        },
        {
          name: 'Standard',
          priceLabel: '1500',
          delivery: '4 days delivery',
          includes: ['3 concepts', 'Source files', 'Social kit'],
        },
        {
          name: 'Premium',
          priceLabel: '2500',
          delivery: '7 days delivery',
          includes: ['Full brand mark system', 'Unlimited revisions'],
        },
      ],
      addons: [
        { id: 'a3', title: 'Business Card Design', priceLabel: '+ 400' },
        { id: 'a4', title: 'Brand Guidelines PDF', priceLabel: '+ 600' },
      ],
    },
    {
      id: 'ps3',
      title: 'Event Photography',
      description: 'Full event coverage with editing included',
      rating: 4.9,
      reviewCount: 210,
      images: [
        'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&h=500&fit=crop',
      ],
      packages: [
        {
          name: 'Basic',
          priceLabel: '1200',
          delivery: '5 days delivery',
          includes: ['2 hours coverage', '50 edited photos'],
        },
        {
          name: 'Standard',
          priceLabel: '2200',
          delivery: '7 days delivery',
          includes: ['4 hours coverage', '150 edited photos'],
        },
        {
          name: 'Premium',
          priceLabel: '4000',
          delivery: '10 days delivery',
          includes: ['Full day', 'Highlights reel', 'Online gallery'],
        },
      ],
      addons: [
        { id: 'a5', title: 'Same-day Preview', priceLabel: '+ 500' },
        { id: 'a6', title: 'Printed Album', priceLabel: '+ 900' },
      ],
    },
    {
      id: 'ps4',
      title: 'Social Media Posts',
      description: 'Templates for engaging social media content',
      rating: 4.6,
      reviewCount: 156,
      images: [
        'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=800&h=500&fit=crop',
      ],
      packages: [
        {
          name: 'Basic',
          priceLabel: '600',
          delivery: '3 days delivery',
          includes: ['5 post templates', '1 platform'],
        },
        {
          name: 'Standard',
          priceLabel: '1200',
          delivery: '5 days delivery',
          includes: ['15 templates', '2 platforms', 'Captions'],
        },
        {
          name: 'Premium',
          priceLabel: '2000',
          delivery: '7 days delivery',
          includes: ['30 templates', 'All platforms', 'Story set'],
        },
      ],
      addons: [
        { id: 'a7', title: 'Reel Cover Pack', priceLabel: '+ 350' },
      ],
    },
    {
      id: 'ps5',
      title: 'Branding Kit',
      description: 'Fonts, colors, and assets to define your brand',
      rating: 4.7,
      reviewCount: 98,
      images: [
        'https://images.unsplash.com/photo-1634942537034-2531766767d1?w=800&h=500&fit=crop',
      ],
      packages: [
        {
          name: 'Basic',
          priceLabel: '1000',
          delivery: '5 days delivery',
          includes: ['Logo lockups', 'Color palette', 'Type pairing'],
        },
        {
          name: 'Standard',
          priceLabel: '2000',
          delivery: '8 days delivery',
          includes: ['Everything in Basic', 'Social templates', 'Icon set'],
        },
        {
          name: 'Premium',
          priceLabel: '3500',
          delivery: '12 days delivery',
          includes: ['Full brand book', 'Presentation deck'],
        },
      ],
      addons: [
        { id: 'a8', title: 'Motion Logo', priceLabel: '+ 800' },
      ],
    },
  ],
  postIds: ['p-own-1', 'p-own-2', 'p-own-3'],
};

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

/** @deprecated Use currentUser / ownProfileUser from users — kept for seed identity checks */
export function getSeedProfileUser(): User {
  return currentUser;
}
