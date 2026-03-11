import prisma from "@/lib/prisma";
import { getGameHistory, getPlayerStats } from "@/lib/game/getGameHistory";
import type { GameHistoryEntry } from "@/lib/game/getGameHistory";
import type { ProfileUser } from "@/types/profile";
import { z } from 'zod';

export const userUpdateSchema = z.object({
    email: z.string().email("Invalid email format").optional(),
    display_name: z
        .string()
        .min(1, {message: "display_name must be at least 1 character"})
        .max(16, {message: "display_name must be less than 17 characters"}),
    password: z
        .string()
        .min(4, {message: "password must be at least 4 characters"})
        .regex(/^[\x21-\x7E]+$/, "Password contains invalid characters"),
});

export const userService = {
    async getUserById(userId: number){
        console.log("getuserbyid");
        return await prisma.user.findUnique({ 
            where: {id: userId},
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
    async getAllUsers(){
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
        const [user, recentGames, stats] = await Promise.all([
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
            getGameHistory(userId, { limit: 5 }),
            getPlayerStats(userId),
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
}
