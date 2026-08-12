import { Job } from '../types';

/**
 * Marketplace job listings come from Nest. This seed file is intentionally empty.
 * Kept so any leftover import path does not resurrect fake listing IDs.
 */
export const jobs: Job[] = [];

export const getJobById = (id: string) => jobs.find((j) => j.id === id);
