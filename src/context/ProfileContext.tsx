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
import {
  locationDisplayFields,
  normalizeCountryCode,
  type CountryCode,
} from '../data/location/geo';

/**
 * Signed-in user's editable profile.
 * Identity + portfolio/services hydrate from Nest only (no mock fallback).
 * About list sections (education/experience/…) remain local until a later API.
 */

/** Real empty about shell — not a mock “filled” demo profile. */
export const emptyProfileContent = (): ProfileContent => ({
  bio: '',
  languages: [],
  talents: [],
  education: [],
  experience: [],
  certifications: [],
  portfolio: [],
  services: [],
  postIds: [],
});

const emptyUser = (): User => ({
  id: '',
  name: '',
  username: '',
  avatar: '',
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
  applySignupProfile: (basics: {
    name: string;
    location: string;
    countryCode?: CountryCode | null;
    locationCode?: string | null;
  }) => void;
  hydrateFromApiUser: (apiUser: ApiUser) => void;
  clearLocalProfile: () => void;
  updateProfileBasics: (patch: {
    name?: string;
    title?: string;
    location?: string;
    countryCode?: CountryCode | null;
    locationCode?: string | null;
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

/** Split a legacy "City, Country" label into API fields. */
export function splitLocationFromLabel(location?: string): {
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

function locationPartsFromPatch(patch: {
  location?: string;
  countryCode?: CountryCode | null;
  locationCode?: string | null;
}): Pick<
  UpdateMePayload,
  'locationCity' | 'locationCountry' | 'countryCode' | 'locationCode'
> {
  const countryCode = normalizeCountryCode(patch.countryCode);
  const locationCode =
    typeof patch.locationCode === 'string' && patch.locationCode.trim()
      ? patch.locationCode.trim().toLowerCase()
      : null;

  if (countryCode && locationCode) {
    const fields = locationDisplayFields(countryCode, locationCode);
    if (fields) {
      return {
        countryCode: fields.countryCode,
        locationCode: fields.locationCode,
        locationCity: fields.locationCity,
        locationCountry: fields.locationCountry,
      };
    }
  }

  // Codes must be sent together; partial clears are allowed as null pairs.
  if (patch.countryCode !== undefined || patch.locationCode !== undefined) {
    if (!countryCode || !locationCode) {
      return {
        countryCode: null,
        locationCode: null,
        ...splitLocationFromLabel(
          typeof patch.location === 'string' ? patch.location : undefined,
        ),
      };
    }
  }

  if (typeof patch.location === 'string') {
    return splitLocationFromLabel(patch.location);
  }

  return {};
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { apiUser, mappedUser, isSignedIn, accessToken } = useAuth();
  const [content, setContent] = useState<ProfileContent>(emptyProfileContent);
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
      languages:
        next.about?.languages?.map((l) => ({
          ...l,
          flag: l.flag ?? '',
        })) ?? prev.languages,
      education: next.about?.education ?? prev.education,
      experience: next.about?.experience ?? prev.experience,
      certifications: next.about?.certifications ?? prev.certifications,
    }));
  }, []);

  const clearLocalProfile = useCallback(() => {
    setContent(emptyProfileContent());
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
      applySignupProfile: ({ name, location, countryCode, locationCode }) => {
        setContent(emptyProfileContent());
        setUser({
          ...emptyUser(),
          name,
          location,
          countryCode: countryCode ?? null,
          locationCode: locationCode ?? null,
        });
      },
      hydrateFromApiUser,
      clearLocalProfile,
      updateProfileBasics: (patch) => {
        const locationPayload = locationPartsFromPatch(patch);
        const nextLocation =
          locationPayload.locationCity != null
            ? [locationPayload.locationCity, locationPayload.locationCountry]
                .filter(Boolean)
                .join(', ')
            : typeof patch.location === 'string'
              ? patch.location
              : undefined;
        setUser((prev) => ({
          ...prev,
          ...(patch.name !== undefined ? { name: patch.name } : {}),
          ...(patch.title !== undefined ? { title: patch.title } : {}),
          ...(patch.avatar !== undefined ? { avatar: patch.avatar } : {}),
          ...(nextLocation !== undefined ? { location: nextLocation } : {}),
          ...(locationPayload.countryCode !== undefined
            ? { countryCode: locationPayload.countryCode }
            : {}),
          ...(locationPayload.locationCode !== undefined
            ? { locationCode: locationPayload.locationCode }
            : {}),
        }));
        void persistMe({
          displayName: patch.name,
          title: typeof patch.title === 'string' ? patch.title : undefined,
          ...locationPayload,
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
