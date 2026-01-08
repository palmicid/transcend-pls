import { getSession } from "@/lib/auth/auth-session";
import LobbyContent from "./LobbyContent";

export default async function LobbyPage() {
  const session = await getSession();
  if (!session) {
    // This shouldn't happen due to middleware, but just in case
    throw new Error("Unauthorized");
  }
  return <LobbyContent userId={session.userId as string} />;
}
