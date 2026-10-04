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
import { DEFAULT_PROFILE_TITLE } from '../constants/profile';

/**
 * Signed-in user's editable profile.
 * Identity + About + portfolio/services hydrate from Nest only (no mock fallback).
 * Edit Profile / Edit About mutate the DB only on explicit Save.
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
  title: DEFAULT_PROFILE_TITLE,
  rating: 0,
  reviewCount: 0,
});

interface ProfileContextValue {
  user: User;
  content: ProfileContent;
  /** True after Nest `/users/me` About fields have been applied at least once. */
  aboutHydrated: boolean;
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
  /** Persist profile basics after Edit Profile Save (not while drafting). */
  saveProfileBasics: (patch: {
    name?: string;
    title?: string | null;
    location?: string;
    countryCode?: CountryCode | null;
    locationCode?: string | null;
    avatarUrl?: string | null;
    coverUrl?: string | null;
  }) => Promise<void>;
  setBio: (bio: string) => Promise<void>;
  setLanguages: (languages: ProfileLanguage[]) => Promise<void>;
  setTalents: (talents: string[]) => Promise<void>;
  setEducation: (education: ProfileEducation[]) => Promise<void>;
  setExperience: (experience: ProfileExperience[]) => Promise<void>;
  setCertifications: (certifications: ProfileCertification[]) => Promise<void>;
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

function aboutPayloadFromContent(content: ProfileContent): NonNullable<UpdateMePayload['about']> {
  return {
    languages: content.languages.map((l) => ({
      id: l.id,
      name: l.name,
      level: l.level,
      ...(l.languageCode ? { languageCode: l.languageCode } : {}),
      ...(l.flag ? { flag: l.flag } : {}),
    })),
    education: content.education.map((e) => ({
      id: e.id,
      school: e.school,
      ...(e.degree ? { degree: e.degree } : {}),
      ...(e.field ? { field: e.field } : {}),
      ...(e.startMonth != null ? { startMonth: e.startMonth } : {}),
      ...(e.startYear != null ? { startYear: e.startYear } : {}),
      ...(e.endMonth != null ? { endMonth: e.endMonth } : {}),
      ...(e.endYear != null ? { endYear: e.endYear } : {}),
      currentlyStudying: Boolean(e.currentlyStudying),
      ...(e.grade ? { grade: e.grade } : e.gpa ? { grade: e.gpa } : {}),
      ...(e.description ? { description: e.description } : {}),
    })),
    experience: content.experience.map((e) => ({
      id: e.id,
      title: e.title,
      company: e.company,
      ...(e.employmentType ? { employmentType: e.employmentType } : {}),
      ...(e.location ? { location: e.location } : {}),
      ...(e.locationType ? { locationType: e.locationType } : {}),
      ...(e.startMonth != null ? { startMonth: e.startMonth } : {}),
      ...(e.startYear != null ? { startYear: e.startYear } : {}),
      ...(e.endMonth != null ? { endMonth: e.endMonth } : {}),
      ...(e.endYear != null ? { endYear: e.endYear } : {}),
      currentlyWorking: Boolean(e.currentlyWorking),
      ...(e.description ? { description: e.description } : {}),
    })),
    certifications: content.certifications.map((c) => ({
      id: c.id,
      name: c.name,
      issuingOrganization: c.issuingOrganization || c.org || '',
      ...(c.issueMonth != null ? { issueMonth: c.issueMonth } : {}),
      ...(c.issueYear != null ? { issueYear: c.issueYear } : {}),
      ...(c.expirationMonth != null ? { expirationMonth: c.expirationMonth } : {}),
      ...(c.expirationYear != null ? { expirationYear: c.expirationYear } : {}),
      doesNotExpire: Boolean(c.doesNotExpire),
      ...(c.credentialId ? { credentialId: c.credentialId } : {}),
      ...(c.credentialUrl ? { credentialUrl: c.credentialUrl } : {}),
    })),
  };
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { apiUser, mappedUser, isSignedIn, accessToken, refreshMe } = useAuth();
  const [content, setContent] = useState<ProfileContent>(emptyProfileContent);
  const [user, setUser] = useState<User>(emptyUser);
  const [aboutHydrated, setAboutHydrated] = useState(false);
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
    setAboutHydrated(true);
  }, []);

  const clearLocalProfile = useCallback(() => {
    setContent(emptyProfileContent());
    setUser(emptyUser());
    setAboutHydrated(false);
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
      await authApi.updateMe(payload);
      // Canonical hydrate from Nest so Auth + Profile stay aligned.
      const refreshed = await refreshMe();
      hydrateFromApiUser(refreshed);
    },
    [accessToken, hydrateFromApiUser, isSignedIn, refreshMe],
  );

  const persistAboutLists = useCallback(
    async (next: ProfileContent) => {
      await persistMe({ about: aboutPayloadFromContent(next) });
    },
    [persistMe],
  );

  const value = useMemo<ProfileContextValue>(
    () => ({
      user: mappedUser ?? user,
      content,
      aboutHydrated,
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
      saveProfileBasics: async (patch) => {
        const locationPayload = locationPartsFromPatch(patch);
        await persistMe({
          ...(patch.name !== undefined ? { displayName: patch.name } : {}),
          ...(patch.title !== undefined
            ? {
                title: patch.title?.trim()
                  ? patch.title.trim()
                  : DEFAULT_PROFILE_TITLE,
              }
            : {}),
          ...locationPayload,
          ...(patch.avatarUrl !== undefined ? { avatarUrl: patch.avatarUrl } : {}),
          ...(patch.coverUrl !== undefined ? { coverUrl: patch.coverUrl } : {}),
        });
      },
      setBio: async (bio) => {
        setContent((prev) => ({ ...prev, bio }));
        await persistMe({ bio });
      },
      setLanguages: async (languages) => {
        const next = { ...content, languages };
        setContent(next);
        await persistAboutLists(next);
      },
      setTalents: async (talents) => {
        setContent((prev) => ({ ...prev, talents }));
        await persistMe({ skills: talents });
      },
      setEducation: async (education) => {
        const next = { ...content, education };
        setContent(next);
        await persistAboutLists(next);
      },
      setExperience: async (experience) => {
        const next = { ...content, experience };
        setContent(next);
        await persistAboutLists(next);
      },
      setCertifications: async (certifications) => {
        const next = { ...content, certifications };
        setContent(next);
        await persistAboutLists(next);
      },
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
      aboutHydrated,
      profileLoading,
      profileError,
      refreshProfessionalProfile,
      hydrateFromApiUser,
      clearLocalProfile,
      persistMe,
      persistAboutLists,
    ],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useMyProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useMyProfile must be used within ProfileProvider');
  return ctx;
}
