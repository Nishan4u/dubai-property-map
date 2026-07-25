import { BookingsTableClient } from "@/components/dashboard/BookingsTableClient";
import { getBookingsForDeveloper, requireDeveloperProfile } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function DeveloperBookingsPage() {
  const profile = await requireDeveloperProfile();
  const bookings = await getBookingsForDeveloper(profile.developer_id);

  return <BookingsTableClient bookings={bookings} />;
}
