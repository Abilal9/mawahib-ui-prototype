import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import {
  ProfileContent,
  ProfileEducation,
  ProfileExperience,
  ProfileCertification,
  ProfileLanguage,
  PortfolioProject,
  ProfileService,
  User,
} from '../data/types';
import { profileService } from '../services';
import { useAuth } from './AuthContext';
import {
  authApi,
  mapApiUserToUser,
  type ApiUser,
  type UpdateMePayload,
} from '../services/authApi';
import {
  mapPortfolioProject,
  portfolioApi,
} from '../services/portfolioApi';
import {
  mapServiceOffering,
  servicesApi,
} from '../services/servicesApi';

/**
 * Signed-in user's editable profile.
 * Identity/basics + portfolio/services hydrate from Nest when authenticated.
 * About list sections remain local until a later phase.
 */

const FALLBACK_AVATAR =
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop';

const emptyUser = (): User => ({
  id: '',
  name: '',
  username: '',
  avatar: FALLBACK_AVATAR,
  bio: '',
  skills: [],
  followers: 0,
  following: 0,
  posts: 0,
  isVerified: false,
  title: '',
  rating: 0,
  reviewCount: 0,
});

interface ProfileContextValue {
  user: User;
  content: ProfileContent;
  profileLoading: boolean;
  profileError: string | null;
  refreshProfessionalProfile: () => Promise<void>;
  useEmptyProfile: () => void;
  useFilledProfile: () => void;
  applySignupProfile: (basics: { name: string; location: string }) => void;
  hydrateFromApiUser: (apiUser: ApiUser) => void;
  clearLocalProfile: () => void;
  updateProfileBasics: (patch: {
    name?: string;
    title?: string;
    location?: string;
    avatar?: string | number;
  }) => void;
  setBio: (bio: string) => void;
  setLanguages: (languages: ProfileLanguage[]) => void;
  setTalents: (talents: string[]) => void;
  setEducation: (education: ProfileEducation[]) => void;
  setExperience: (experience: ProfileExperience[]) => void;
  setCertifications: (certifications: ProfileCertification[]) => void;
  addPortfolioProject: (input: {
    title: string;
    description: string;
    mediaAssetIds: string[];
  }) => Promise<PortfolioProject>;
  setPortfolio: (portfolio: PortfolioProject[]) => Promise<void>;
  updatePortfolioProject: (
    projectId: string,
    input: {
      title: string;
      description: string;
      mediaAssetIds: string[];
    },
  ) => Promise<PortfolioProject>;
  removePortfolioProject: (projectId: string) => Promise<void>;
  addService: (input: {
    title: string;
    description: string;
    mediaAssetIds: string[];
    packages: Array<{
      name: 'Basic' | 'Standard' | 'Premium';
      price: number;
      deliveryLabel: string;
      includes: string[];
    }>;
    addons?: Array<{ title: string; price: number }>;
  }) => Promise<ProfileService>;
  setServices: (services: ProfileService[]) => Promise<void>;
  updateService: (
    serviceId: string,
    input: {
      title: string;
      description: string;
      mediaAssetIds: string[];
      packages: Array<{
        name: 'Basic' | 'Standard' | 'Premium';
        price: number;
        deliveryLabel: string;
        includes: string[];
      }>;
      addons?: Array<{ title: string; price: number }>;
    },
  ) => Promise<ProfileService>;
  removeService: (serviceId: string) => Promise<void>;
  removePostId: (postId: string) => void;
  addPostId: (postId: string) => void;
}

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

const seedFilled = () => profileService.getFilledContent();
const seedEmpty = () => profileService.getEmptyContent();

function locationParts(location?: string): {
  locationCity?: string | null;
  locationCountry?: string | null;
} {
  if (!location?.trim()) return { locationCity: null, locationCountry: null };
  const [city, ...rest] = location.split(',').map((p) => p.trim());
  return {
    locationCity: city || null,
    locationCountry: rest.length ? rest.join(', ') : null,
  };
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { apiUser, mappedUser, isSignedIn, accessToken } = useAuth();
  const [content, setContent] = useState<ProfileContent>(seedEmpty);
  const [user, setUser] = useState<User>(emptyUser);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const hydrateFromApiUser = useCallback((next: ApiUser) => {
    const mapped = mapApiUserToUser(next);
    setUser(mapped);
    setContent((prev) => ({
      ...prev,
      bio: next.bio ?? '',
      talents: next.skills ?? prev.talents,
    }));
  }, []);

  const clearLocalProfile = useCallback(() => {
    setContent(seedEmpty());
    setUser(emptyUser());
    setProfileError(null);
  }, []);

  const refreshProfessionalProfile = useCallback(async () => {
    if (!isSignedIn || !accessToken) return;
    setProfileLoading(true);
    setProfileError(null);
    try {
      const [portfolio, services] = await Promise.all([
        portfolioApi.listMine(),
        servicesApi.listMine(),
      ]);
      setContent((prev) => ({
        ...prev,
        portfolio: portfolio.map(mapPortfolioProject),
        services: services.map(mapServiceOffering),
      }));
    } catch (err) {
      setProfileError(
        err instanceof Error ? err.message : 'Failed to load portfolio/services',
      );
    } finally {
      setProfileLoading(false);
    }
  }, [accessToken, isSignedIn]);

  useEffect(() => {
    if (!isSignedIn || !apiUser) {
      clearLocalProfile();
      return;
    }
    hydrateFromApiUser(apiUser);
    void refreshProfessionalProfile();
  }, [
    apiUser,
    isSignedIn,
    hydrateFromApiUser,
    clearLocalProfile,
    refreshProfessionalProfile,
  ]);

  const persistMe = useCallback(
    async (payload: UpdateMePayload) => {
      if (!accessToken || !isSignedIn) return;
      const updated = await authApi.updateMe(payload);
      hydrateFromApiUser(updated);
    },
    [accessToken, hydrateFromApiUser, isSignedIn],
  );

  const value = useMemo<ProfileContextValue>(
    () => ({
      user: mappedUser ?? user,
      content,
      profileLoading,
      profileError,
      refreshProfessionalProfile,
      useEmptyProfile: () =>
        setContent((prev) => ({
          ...seedEmpty(),
          bio: prev.bio,
          talents: prev.talents,
          portfolio: prev.portfolio,
          services: prev.services,
        })),
      useFilledProfile: () => {
        const filled = seedFilled();
        setContent((prev) => ({
          ...filled,
          bio: prev.bio || filled.bio,
          talents: prev.talents.length ? prev.talents : filled.talents,
          portfolio: prev.portfolio,
          services: prev.services,
        }));
      },
      applySignupProfile: ({ name, location }) => {
        setContent(seedEmpty());
        setUser({
          ...emptyUser(),
          name,
          location,
        });
      },
      hydrateFromApiUser,
      clearLocalProfile,
      updateProfileBasics: (patch) => {
        setUser((prev) => ({ ...prev, ...patch }));
        void persistMe({
          displayName: patch.name,
          title: typeof patch.title === 'string' ? patch.title : undefined,
          ...locationParts(
            typeof patch.location === 'string' ? patch.location : undefined,
          ),
          avatarUrl: typeof patch.avatar === 'string' ? patch.avatar : undefined,
        });
      },
      setBio: (bio) => {
        setContent((prev) => ({ ...prev, bio }));
        void persistMe({ bio });
      },
      setLanguages: (languages) => setContent((prev) => ({ ...prev, languages })),
      setTalents: (talents) => {
        setContent((prev) => ({ ...prev, talents }));
        void persistMe({ skills: talents });
      },
      setEducation: (education) => setContent((prev) => ({ ...prev, education })),
      setExperience: (experience) => setContent((prev) => ({ ...prev, experience })),
      setCertifications: (certifications) =>
        setContent((prev) => ({ ...prev, certifications })),
      addPortfolioProject: async (input) => {
        const created = mapPortfolioProject(
          await portfolioApi.create({
            title: input.title,
            description: input.description,
            mediaAssetIds: input.mediaAssetIds,
          }),
        );
        setContent((prev) => ({
          ...prev,
          portfolio: [created, ...prev.portfolio],
        }));
        return created;
      },
      setPortfolio: async (portfolio) => {
        const ordered = await portfolioApi.reorder(portfolio.map((p) => p.id));
        setContent((prev) => ({
          ...prev,
          portfolio: ordered.map(mapPortfolioProject),
        }));
      },
      updatePortfolioProject: async (projectId, input) => {
        const updated = mapPortfolioProject(
          await portfolioApi.update(projectId, {
            title: input.title,
            description: input.description,
            mediaAssetIds: input.mediaAssetIds,
          }),
        );
        setContent((prev) => ({
          ...prev,
          portfolio: prev.portfolio.map((p) =>
            p.id === projectId ? updated : p,
          ),
        }));
        return updated;
      },
      removePortfolioProject: async (projectId) => {
        await portfolioApi.remove(projectId);
        setContent((prev) => ({
          ...prev,
          portfolio: prev.portfolio.filter((p) => p.id !== projectId),
        }));
      },
      addService: async (input) => {
        const created = mapServiceOffering(await servicesApi.create(input));
        setContent((prev) => ({
          ...prev,
          services: [created, ...prev.services],
        }));
        return created;
      },
      setServices: async (services) => {
        const ordered = await servicesApi.reorder(services.map((s) => s.id));
        setContent((prev) => ({
          ...prev,
          services: ordered.map(mapServiceOffering),
        }));
      },
      updateService: async (serviceId, input) => {
        const updated = mapServiceOffering(
          await servicesApi.update(serviceId, input),
        );
        setContent((prev) => ({
          ...prev,
          services: prev.services.map((s) =>
            s.id === serviceId ? updated : s,
          ),
        }));
        return updated;
      },
      removeService: async (serviceId) => {
        await servicesApi.remove(serviceId);
        setContent((prev) => ({
          ...prev,
          services: prev.services.filter((s) => s.id !== serviceId),
        }));
      },
      removePostId: (postId) =>
        setContent((prev) => ({
          ...prev,
          postIds: prev.postIds.filter((id) => id !== postId),
        })),
      addPostId: (postId) =>
        setContent((prev) => ({
          ...prev,
          postIds: [postId, ...prev.postIds],
        })),
    }),
    [
      content,
      user,
      mappedUser,
      profileLoading,
      profileError,
      refreshProfessionalProfile,
      hydrateFromApiUser,
      clearLocalProfile,
      persistMe,
    ],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useMyProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useMyProfile must be used within ProfileProvider');
  return ctx;
}
