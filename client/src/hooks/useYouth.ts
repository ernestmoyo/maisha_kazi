import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Youth, YouthParams, YouthEarnings, UpdateYouthProfileData } from '@/api/youth';
import * as youthApi from '@/api/youth';

export const youthKeys = {
  all: ['youth'] as const,
  lists: () => [...youthKeys.all, 'list'] as const,
  list: (params?: YouthParams) => [...youthKeys.lists(), params] as const,
  details: () => [...youthKeys.all, 'detail'] as const,
  detail: (id: string) => [...youthKeys.details(), id] as const,
  earnings: (id: string) => [...youthKeys.all, 'earnings', id] as const,
};

interface YouthListData {
  youth: Youth[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  total: number;
}

// Flatten the backend's nested youthProfile into the flat Youth shape
function flattenYouth(raw: Record<string, unknown>): Youth {
  const p = (raw.youthProfile as Record<string, unknown>) ?? {};
  return {
    id: raw.id as string,
    name: raw.name as string,
    email: raw.email as string,
    phone: (raw.phone as string) ?? '',
    bio: (p.bio as string) ?? '',
    location: (p.location as string) ?? '',
    skills: (p.skills as string[]) ?? [],
    isVetted: (p.isVetted as boolean) ?? false,
    rating: (p.rating as number) ?? 0,
    completedJobs: (p.totalJobsCompleted as number) ?? 0,
    createdAt: raw.createdAt as string,
  };
}

export function useYouth(params?: YouthParams) {
  return useQuery({
    queryKey: youthKeys.list(params),
    queryFn: async (): Promise<YouthListData> => {
      const res = await youthApi.getYouth(params);
      const d = (res.data as unknown as { data: { youth: Record<string, unknown>[]; pagination: YouthListData['pagination'] } }).data;
      return {
        youth: (d.youth ?? []).map(flattenYouth),
        pagination: d.pagination,
        total: d.pagination?.total ?? 0,
      };
    },
  });
}

export function useYouthById(id: string) {
  return useQuery({
    queryKey: youthKeys.detail(id),
    queryFn: async (): Promise<Youth> => {
      const res = await youthApi.getYouthById(id);
      const raw = (res.data as unknown as { data: Record<string, unknown> }).data;
      return flattenYouth(raw);
    },
    enabled: !!id,
  });
}

export function useUpdateYouthProfile(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateYouthProfileData) =>
      youthApi.updateYouthProfile(id, data).then((res) => (res.data as unknown as { data: Youth }).data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: youthKeys.detail(id) });
    },
  });
}

export function useVetYouth() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      youthApi.vetYouth(id).then((res) => (res.data as unknown as { data: unknown }).data),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: youthKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: youthKeys.lists() });
    },
  });
}

// Backend /api/youth/:id/earnings returns { thisWeek, thisMonth, allTime, recentJobs }
// Earnings.tsx expects { totalEarnings, pendingEarnings, completedJobs, earnings[] }
// This hook transforms the backend shape into what the UI expects.
interface BackendEarnings {
  thisWeek: { earnings: number; jobCount: number };
  thisMonth: { earnings: number; jobCount: number };
  allTime: { earnings: number; jobCount: number };
  recentJobs: Array<{
    id: string;
    title: string;
    serviceType: string;
    fee: number;
    youthEarning: number | null;
    completedAt: string | null;
    client: { id: string; name: string } | null;
  }>;
}

export function useYouthEarnings(id: string) {
  return useQuery({
    queryKey: youthKeys.earnings(id),
    queryFn: async (): Promise<YouthEarnings> => {
      const res = await youthApi.getYouthEarnings(id);
      const d = (res.data as unknown as { data: BackendEarnings }).data;
      return {
        totalEarnings: Number(d.allTime?.earnings ?? 0),
        pendingEarnings: 0,
        completedJobs: d.allTime?.jobCount ?? 0,
        earnings: (d.recentJobs ?? []).map((j) => ({
          jobId: j.id,
          jobTitle: j.title,
          amount: Number(j.youthEarning ?? 0),
          date: j.completedAt ?? new Date().toISOString(),
          status: 'paid',
        })),
      };
    },
    enabled: !!id,
  });
}
