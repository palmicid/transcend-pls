import prisma from "@/lib/prisma";
import { getGameHistory, getPlayerStats } from "@/lib/game/getGameHistory";
import type { GameHistoryEntry } from "@/lib/game/getGameHistory";
import type { ProfileUser } from "@/types/profile";

import { getXPInfo } from "@/lib/game/xpService";
import { getUserAchievements } from "@/lib/game/achievementService";

export const userService = {
    async getUserById(userId: number){
        return await prisma.user.findUnique({ where: {id: userId} });
    },
    async getAllUsers(){
        return await prisma.user.findMany();
    },
    async getProfileById(userId: number): Promise<ProfileUser | null> {
        const [user, recentGames, stats, xpInfo, achievements] = await Promise.all([
            prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    email: true,
                    display_name: true,
                    avatar_url: true,
                    online_status: true,
                    created_at: true,
                    is_verified: true,
                    use2FA: true,
                },
            }),
            getGameHistory(userId, { limit: 50 }),
            getPlayerStats(userId),
            getXPInfo(userId),
            getUserAchievements(userId),
        ]);

        if (!user) {
            return null;
        }

        return {
            id: user.id,
            email: user.email,
            displayName: user.display_name,
            avatarUrl: user.avatar_url,
            online: user.online_status,
            createdAt: user.created_at.toISOString(),
            isVerified: user.is_verified,
            use2FA: user.use2FA,
            xp: xpInfo,
            achievements,
            stats: {
                ...stats,
            },
            recentGames: recentGames.map((game: GameHistoryEntry) => ({
                ...game,
                startedAt: game.startedAt.toISOString(),
                endedAt: game.endedAt.toISOString(),
            })),
        };
    },
};
