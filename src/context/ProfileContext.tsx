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

/**
 * Signed-in user's editable profile.
 * Identity/basics hydrate from Nest `/users/me` when authenticated.
 * Portfolio/services/about sections remain local mock until later phases.
 */

const FALLBACK_AVATAR =
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop';

/** Neutral placeholder — never the mock seed identity. */
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
  addPortfolioProject: (project: PortfolioProject) => void;
  setPortfolio: (portfolio: PortfolioProject[]) => void;
  updatePortfolioProject: (projectId: string, project: PortfolioProject) => void;
  removePortfolioProject: (projectId: string) => void;
  addService: (service: ProfileService) => void;
  setServices: (services: ProfileService[]) => void;
  updateService: (serviceId: string, service: ProfileService) => void;
  removeService: (serviceId: string) => void;
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
  }, []);

  useEffect(() => {
    if (!isSignedIn || !apiUser) {
      clearLocalProfile();
      return;
    }
    hydrateFromApiUser(apiUser);
  }, [apiUser, isSignedIn, hydrateFromApiUser, clearLocalProfile]);

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
      useEmptyProfile: () => setContent(seedEmpty()),
      useFilledProfile: () => {
        // Demo content only — identity stays the authenticated API user.
        setContent(seedFilled());
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
      addPortfolioProject: (project) =>
        setContent((prev) => ({ ...prev, portfolio: [project, ...prev.portfolio] })),
      setPortfolio: (portfolio) => setContent((prev) => ({ ...prev, portfolio })),
      updatePortfolioProject: (projectId, project) =>
        setContent((prev) => ({
          ...prev,
          portfolio: prev.portfolio.map((p) => (p.id === projectId ? project : p)),
        })),
      removePortfolioProject: (projectId) =>
        setContent((prev) => ({
          ...prev,
          portfolio: prev.portfolio.filter((p) => p.id !== projectId),
        })),
      addService: (service) =>
        setContent((prev) => ({ ...prev, services: [service, ...prev.services] })),
      setServices: (services) => setContent((prev) => ({ ...prev, services })),
      updateService: (serviceId, service) =>
        setContent((prev) => ({
          ...prev,
          services: prev.services.map((s) => (s.id === serviceId ? service : s)),
        })),
      removeService: (serviceId) =>
        setContent((prev) => ({
          ...prev,
          services: prev.services.filter((s) => s.id !== serviceId),
        })),
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
    [content, user, mappedUser, hydrateFromApiUser, clearLocalProfile, persistMe],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useMyProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useMyProfile must be used within ProfileProvider');
  return ctx;
}
