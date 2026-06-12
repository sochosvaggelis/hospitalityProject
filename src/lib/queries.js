import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { api } from './api';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

// Reference data: practically never changes, cache aggressively
export const useIslands = () =>
    useQuery({ queryKey: ['islands'], queryFn: api.islands, staleTime: 6 * HOUR });

export const useCategories = () =>
    useQuery({ queryKey: ['categories'], queryFn: api.categories, staleTime: 6 * HOUR });

export const useEmploymentTypes = () =>
    useQuery({ queryKey: ['employment-types'], queryFn: api.employmentTypes, staleTime: 6 * HOUR });

// Job listings: short cache + background refresh; previous results stay
// visible while a filter change fetches, so the grid never flashes empty
export const useJobs = (filters = {}) =>
    useQuery({
        queryKey: ['jobs', filters],
        queryFn: () => api.getJobs(filters),
        staleTime: 1 * MINUTE,
        placeholderData: keepPreviousData,
    });
