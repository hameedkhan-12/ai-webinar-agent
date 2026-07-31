import type { Attendee } from "@/generated/prisma/client"
import { create } from "zustand"
import { persist } from "zustand/middleware"

type StoredAttendee = Attendee & { webinarId: string }

type AttendeeStore = {
  attendee: StoredAttendee | null
  setAttendee: (attendee: Attendee, webinarId: string) => void
  clearAttendee: () => void
}

// Create the Zustand store with persistence
export const useAttendeeStore = create<AttendeeStore>()(
  persist(
    (set) => ({
      attendee: null,
      // Store which webinar this attendee record belongs to, so a
      // registration for one webinar doesn't leak into another webinar's
      // page (which would otherwise skip the registration form and send
      // the user to a call for a webinar they never actually registered
      // for, ending in an attendee-not-found redirect loop).
      setAttendee: (attendee, webinarId) =>
        set({ attendee: { ...attendee, webinarId } }),
      clearAttendee: () => set({ attendee: null }),
    }),
    {
      name: "attendee-storage", // unique name for localStorage
    },
  ),
)