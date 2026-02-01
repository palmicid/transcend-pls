import prisma from "@/lib/prisma";

export const friendService = {
    async checkExistingRelation(userId: number, friendId: number) {
        const relation = await prisma.friendRelation.findFirst({
            where: {
                OR: [
                    {
                        user_id: userId,
                        friend_id: friendId,
                    },
                    {
                        user_id: friendId,
                        friend_id: userId,
                    },
                ],
            },
        });
        return relation;
    },
    async sendRequest(userId: number, friendId: number) {
        return await prisma.friendRelation.create({
            data: {
                user_id: userId,
                friend_id: friendId,
                is_accepted: false,
            },
        });
    },
    async acceptFriendRequest(userId: number, friendId: number) {
        return await prisma.friendRelation.update({
            where: {
                user_id_friend_id: {
                    user_id: userId,
                    friend_id: friendId
                }
            },
            data: {
                is_accepted: true,
            },
        });
    },
    async getAllFriendRelation() {
        return await prisma.friendRelation.findMany();
    },
    async getUserFriends(userId: number, filter: object={}) {
        return await prisma.friendRelation.findMany({
            where: {
                ...filter,
                OR: [
                    { user_id: userId },
                    { friend_id: userId },
                ],
            },
        });
    }
};