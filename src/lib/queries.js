import { useQuery, useInfiniteQuery, keepPreviousData } from '@tanstack/react-query';
import { api } from './api';

export const JOBS_PAGE_SIZE = 12;

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

// Reference data: practically never changes, cache aggressively
export const useIslands = () =>
    useQuery({ queryKey: ['islands'], queryFn: api.islands, staleTime: 6 * HOUR });

export const useCategories = () =>
    useQuery({ queryKey: ['categories'], queryFn: api.categories, staleTime: 6 * HOUR });

export const useEmploymentTypes = () =>
    useQuery({ queryKey: ['employment-types'], queryFn: api.employmentTypes, staleTime: 6 * HOUR });

export const useVenueTypes = () =>
    useQuery({ queryKey: ['venue-types'], queryFn: api.venueTypes, staleTime: 6 * HOUR });

// Paginated job listings: the server filters/searches and returns one page at a
// time; React Query stitches the pages together for infinite scroll.
export const useInfiniteJobs = (filters = {}) =>
    useInfiniteQuery({
        queryKey: ['jobs', filters],
        queryFn: ({ pageParam = 1 }) => api.getJobs({ ...filters, page: pageParam, limit: JOBS_PAGE_SIZE }),
        initialPageParam: 1,
        getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
        staleTime: 1 * MINUTE,
        placeholderData: keepPreviousData,
    });

// Distinct venue names with active jobs — options for the "Venue name" filter.
export const useVenueNames = () =>
    useQuery({ queryKey: ['venue-names'], queryFn: api.getVenueNames, staleTime: 5 * MINUTE });

// Aggregate counts (total + per island) for the home page, computed server-side.
export const useJobStats = () =>
    useQuery({ queryKey: ['job-stats'], queryFn: api.getJobStats, staleTime: 1 * MINUTE });

// The hotel account's own venues (shops/properties). Cached briefly so the
// PostJob selector and the Profile manager stay in sync after edits.
export const useMyVenues = (enabled = true) =>
    useQuery({ queryKey: ['my-venues'], queryFn: api.getMyVenues, staleTime: 1 * MINUTE, enabled });

// Job seeker's favourited venue/job ref_ids — drives heart toggle state.
export const useUserFavoriteIds = (enabled = true) =>
    useQuery({
        queryKey: ['user-favorite-ids'],
        queryFn: api.getUserFavoriteIds,
        staleTime: 1 * MINUTE,
        enabled,
    });
