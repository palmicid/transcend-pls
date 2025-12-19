import { getUserId } from "@/lib/auth";
import LobbyContent from "./LobbyContent";

export default async function LobbyPage() {
  const userId = await getUserId();

  if (!userId) {
    // This shouldn't happen due to middleware, but just in case
    throw new Error("Unauthorized");
  }

  return <LobbyContent userId={userId} />;
}
