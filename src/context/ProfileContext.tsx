import React, { createContext, useContext, useMemo, useState, ReactNode } from 'react';
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

/**
 * Signed-in user's editable profile (bio, portfolio, services, etc.).
 * Seeded via profileService → mock profile repository.
 */

interface ProfileContextValue {
  user: User;
  content: ProfileContent;
  /** demo helper: start empty or switch to filled seed */
  useEmptyProfile: () => void;
  useFilledProfile: () => void;
  /** After basic signup — empty content with name/city, ready for MainTabs */
  applySignupProfile: (basics: { name: string; location: string }) => void;
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
  /** Remove a post from the owner's profile list (by id). */
  removePostId: (postId: string) => void;
  /** Append a newly created post id to the owner's profile list. */
  addPostId: (postId: string) => void;
  resetToSeed: () => void;
}

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

const seedUser = () => profileService.getSeedUser();
const seedFilled = () => profileService.getFilledContent();
const seedEmpty = () => profileService.getEmptyContent();

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<ProfileContent>(seedFilled);
  const [user, setUser] = useState<User>(seedUser);

  const value = useMemo<ProfileContextValue>(
    () => ({
      user,
      content,
      useEmptyProfile: () => setContent(seedEmpty()),
      useFilledProfile: () => {
        setContent(seedFilled());
        setUser(seedUser());
      },
      applySignupProfile: ({ name, location }) => {
        setContent(seedEmpty());
        setUser({
          ...seedUser(),
          name,
          location,
          title: '',
          bio: '',
          rating: 0,
          reviewCount: 0,
          followers: 0,
          following: 0,
          posts: 0,
        });
      },
      updateProfileBasics: (patch) =>
        setUser((prev) => ({
          ...prev,
          ...patch,
        })),
      setBio: (bio) => setContent((prev) => ({ ...prev, bio })),
      setLanguages: (languages) => setContent((prev) => ({ ...prev, languages })),
      setTalents: (talents) => setContent((prev) => ({ ...prev, talents })),
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
      resetToSeed: () => {
        setContent(seedFilled());
        setUser(seedUser());
      },
    }),
    [content, user]
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useMyProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useMyProfile must be used within ProfileProvider');
  return ctx;
}
