import { getCurrentUser } from "@/lib/test-auth";
export default async function DashboardPage() {
  const user = await getCurrentUser();
  return (
    <div>
      <h1 className="text-2xl font-bold">Welcome to your dashboard!</h1>

      {/* i have to print whole user object  */}
      <p className="mt-4">Your user is: {JSON.stringify(user)}</p>
    </div>
  );
}
