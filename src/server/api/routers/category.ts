import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const categoryRouter = createTRPCRouter({
    getCategories: protectedProcedure.query(async ({ ctx }) => {

        const { db } = ctx;
        const categories = await db.category.findMany({
            select: {
                id: true,
                name: true,
                productCount: true,
            },
        });
        return categories;
    }),

    createCategory: protectedProcedure.input(z.object({
        name: z.string().min(3, "Minimum 3 character's"),
    })).mutation(async ({ ctx, input }) => {
        const { db } = ctx;
        const newCategory = await db.category.create({
            data: {
                name: input.name,
            },
        });
        return newCategory;
    }),


    deleteCategory: protectedProcedure.input(z.object({
        id: z.string(),
    })).mutation(async ({ ctx, input }) => {
        const { db } = ctx;
        await db.category.delete({
            where: { id: input.id },
        })
    }),

    updateCategory: protectedProcedure.input(z.object({
        id: z.string(),
        name: z.string().min(3, "Minimum 3 character's"),
    })).mutation(async ({ ctx, input }) => {
        const { db } = ctx;
        await db.category.update({
            where: { id: input.id },
            data: {
                name: input.name,
            },
        })
    })
})
