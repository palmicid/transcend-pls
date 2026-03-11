import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/auth-session";
import { getSession } from "@/lib/auth/auth-session";
import prisma from "@/lib/prisma";
import { MainLayout } from "@/components/layout/MainLayout";
import LobbyContent from "./LobbyContent";

export default async function Connect4Page() {
	let userId: number;
	try {
		userId = await requireAuth();
	} catch {
		redirect("/login");
	}

	const session = await getSession();
	if (!session) {
		redirect("/login");
	}

	const user = await prisma.user.findUnique({
		where: { id: session.userId },
		select: { display_name: true },
	});

	const displayName = user?.display_name ?? session.userId.toString();

	return (
		<MainLayout showNav={true}>
			<LobbyContent
				userId={session.userId.toString()}
				displayName={displayName}
			/>
		</MainLayout>
	);
}
