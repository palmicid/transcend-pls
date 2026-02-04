import prisma from "@/lib/prisma";

export const userService = {
    async getUserById(userId: number){
        return await prisma.user.findUnique({ where: {id: userId} });
    },
    async getAllUsers(){
        return await prisma.user.findMany();
    },
}