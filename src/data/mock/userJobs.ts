import { UserJob } from '../types/userJobs';

/**
 * Marketplace applications/engagements come from Nest. Seed intentionally empty.
 */
export const userJobs: UserJob[] = [];

export const getUserJobById = (id: string) => userJobs.find((j) => j.id === id);
