import React, { createContext, useContext, useMemo, useState, ReactNode } from 'react';
import {
  emptyProfileContent,
  filledOwnProfile,
  ownProfileUser,
  ProfileContent,
  ProfileEducation,
  ProfileExperience,
  ProfileCertification,
  ProfileLanguage,
  PortfolioProject,
  ProfileService,
} from '../data/mock/myProfile';
import { User } from '../data/types';

/**
 * Signed-in user's editable profile (bio, portfolio, services, etc.).
 * Service create/edit/delete from AddProfileServiceScreen / ServiceDetailScreen
 * mutate `content.services` here; visitor profiles stay in mock helpers.
 */

interface ProfileContextValue {
  user: User;
  content: ProfileContent;
  /** demo helper: start empty or switch to filled seed */
  useEmptyProfile: () => void;
  useFilledProfile: () => void;
  updateProfileBasics: (patch: {
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
  addService: (service: ProfileService) => void;
  updateService: (serviceId: string, service: ProfileService) => void;
  removeService: (serviceId: string) => void;
}

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  // Own profile starts filled to match Figma Profile Setup Full screenshots
  const [content, setContent] = useState<ProfileContent>(filledOwnProfile);
  const [user, setUser] = useState<User>(ownProfileUser);

  const value = useMemo<ProfileContextValue>(
    () => ({
      user,
      content,
      useEmptyProfile: () => setContent(emptyProfileContent),
      useFilledProfile: () => setContent(filledOwnProfile),
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
      addService: (service) =>
        setContent((prev) => ({ ...prev, services: [service, ...prev.services] })),
      /** Full replacement by id — wizard republishes the whole ProfileService object. */
      updateService: (serviceId, service) =>
        setContent((prev) => ({
          ...prev,
          services: prev.services.map((s) => (s.id === serviceId ? service : s)),
        })),
      /** Used by ServiceDetail delete confirm; removes from the owner's list only. */
      removeService: (serviceId) =>
        setContent((prev) => ({
          ...prev,
          services: prev.services.filter((s) => s.id !== serviceId),
        })),
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
