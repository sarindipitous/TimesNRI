/**
 * Client-side hook that fetches aggregated stats and recent
 * wait-list submissions for the admin dashboard.
 *
 * Other components can import:
 *   import { useDashboardData } from '@/hooks/use-dashboard-data'
 */
"use client"

import useSWR from "swr"

interface WaitlistSubmission {
  id: number
  email: string
  name: string | null
  location: string | null
  parent_location: string | null
  care_needs: string | null
  care_plan: string | null
  created_at: string
  referred_by: string | null
}

export interface DashboardData {
  totalSubmissions: number
  last7Days: number
  recentSubmissions: WaitlistSubmission[]
}

const fetcher = async (url: string): Promise<DashboardData> =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch dashboard data")
    return res.json()
  })

export function useDashboardData() {
  const {
    data,
    error,
    isLoading,
    mutate: refresh,
  } = useSWR<DashboardData>("/api/dashboard-data", fetcher, {
    refreshInterval: 60_000, // auto-refresh once a minute
  })

  return {
    data,
    error,
    isLoading,
    refresh,
  }
}
