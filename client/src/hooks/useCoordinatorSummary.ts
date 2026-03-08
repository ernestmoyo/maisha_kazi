import { useQuery } from '@tanstack/react-query';
import type { CoordinatorSummary } from '@/api/reports';
import * as reportsApi from '@/api/reports';

export const coordinatorSummaryKeys = {
  all: ['coordinator-summary'] as const,
};

export function useCoordinatorSummary() {
  return useQuery({
    queryKey: coordinatorSummaryKeys.all,
    queryFn: async (): Promise<CoordinatorSummary> => {
      const res = await reportsApi.getCoordinatorSummary();
      return (res.data as unknown as { data: CoordinatorSummary }).data;
    },
  });
}
