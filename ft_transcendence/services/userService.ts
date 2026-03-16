import prisma from "@/lib/prisma";
import { getGameHistory, getPlayerStats } from "@/lib/game/getGameHistory";
import type { GameHistoryEntry } from "@/lib/game/getGameHistory";
import type { ProfileUser } from "@/types/profile";
import { z } from 'zod';
import { isUserOnline } from "@/lib/onlineStatus";

export const userUpdateSchema = z.object({
    email: z.string().email("Invalid email format").optional(),
    display_name: z
        .string()
        .min(1, { message: "display_name must be at least 1 character" })
        .max(16, { message: "display_name must be less than 17 characters" })
        .optional(),
    password: z
        .string()
        .min(8, { message: "Password must be at least 8 characters long" })
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter")
        .regex(/[0-9]/, "Password must contain at least one number")
        .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character")
        .optional(),
    online_status: z.boolean("Invalid online_status value").optional(),
    is_verified: z.boolean("Invalid is_verified value").optional(),
    use2FA: z.boolean("Invalid use2FA value").optional(),

});

import { getXPInfo } from "@/lib/game/xpService";
import { getUserAchievements } from "@/lib/game/achievementService";

export const userService = {
    async getUserById(userId: number) {
        return await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                display_name: true,
                avatar_url: true,
                online_status: true,
                last_active_at: true,
                created_at: true,
                is_verified: true,
                use2FA: true,
            }
        });
    },
    async getAllUsers() {
        return await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                display_name: true,
                avatar_url: true,
                online_status: true,
                created_at: true,
                is_verified: true,
                use2FA: true,
            }
        });
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
                    last_active_at: true,
                    created_at: true,
                    is_verified: true,
                    use2FA: true,
                },
            }),
            getGameHistory(userId, { limit: 5 }),
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
