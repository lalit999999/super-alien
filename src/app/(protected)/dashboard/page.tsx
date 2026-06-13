import { getCurrentUser } from "@/lib/test-auth";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  return (
    <div>
      <pre>{JSON.stringify(user, null, 2)}</pre>
    </div>
  );
}