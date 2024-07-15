import { api } from "./api"

type Activity = {
  id: string
  occurs_at: string
  title: string
}

type ActivityCreate = Omit<Activity, "id"> & {
  tripId: string
}

export type Activities = {
  date: string
  activities: Activity[]
}

type ActivityResponse = {
  activities: Activities[]
}

async function create({ tripId, occurs_at, title }: ActivityCreate) {
  try {
    const { data } = await api.post<{ activityId: string }>(
      `/trip/${tripId}/activity`,
      { occurs_at, title }
    )

    return data.activityId
  } catch (error) {
    throw error
  }
}

async function getActivitiesByTripId(tripId: string) {
  try {
    const { data } = await api.get<ActivityResponse>(
      `/trip/${tripId}/activities`
    )
    return data.activities
  } catch (error) {
    throw error
  }
}

export const activitiesServer = { create, getActivitiesByTripId }