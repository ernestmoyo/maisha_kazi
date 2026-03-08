import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Job, JobParams, CreateJobData } from '@/api/jobs';
import * as jobsApi from '@/api/jobs';

export const jobKeys = {
  all: ['jobs'] as const,
  lists: () => [...jobKeys.all, 'list'] as const,
  list: (params?: JobParams) => [...jobKeys.lists(), params] as const,
  details: () => [...jobKeys.all, 'detail'] as const,
  detail: (id: string) => [...jobKeys.details(), id] as const,
};

interface JobsData {
  jobs: Job[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  total: number;
}

export function useJobs(params?: JobParams) {
  return useQuery({
    queryKey: jobKeys.list(params),
    queryFn: async (): Promise<JobsData> => {
      const res = await jobsApi.getJobs(params);
      const d = (res.data as unknown as { data: { jobs: Job[]; pagination: JobsData['pagination'] } }).data;
      return { jobs: d.jobs ?? [], pagination: d.pagination, total: d.pagination?.total ?? 0 };
    },
  });
}

export function useJob(id: string) {
  return useQuery({
    queryKey: jobKeys.detail(id),
    queryFn: async (): Promise<Job> => {
      const res = await jobsApi.getJob(id);
      return (res.data as unknown as { data: Job }).data;
    },
    enabled: !!id,
  });
}

export function useCreateJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateJobData) =>
      jobsApi.createJob(data).then((res) => (res.data as unknown as { data: Job }).data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
    },
  });
}

export function useAssignJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, youthId }: { id: string; youthId: string }) =>
      jobsApi.assignJob(id, youthId).then((res) => (res.data as unknown as { data: Job }).data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: jobKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
    },
  });
}

export function useUpdateJobStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      jobsApi.updateJobStatus(id, status).then((res) => (res.data as unknown as { data: Job }).data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: jobKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
    },
  });
}

export function useConfirmJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      jobsApi.confirmJob(id).then((res) => (res.data as unknown as { data: Job }).data),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: jobKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
    },
  });
}

export function useUploadProof() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      jobsApi.uploadProof(id, file).then((res) => (res.data as unknown as { data: { url: string } }).data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: jobKeys.detail(variables.id) });
    },
  });
}
