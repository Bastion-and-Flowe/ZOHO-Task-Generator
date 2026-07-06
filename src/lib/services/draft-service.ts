import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export interface DraftTaskInput {
  taskName: string;
  dueDate: string; // ISO date
}

/**
 * Repository/service layer for Drafts. Keeps Prisma calls out of route
 * handlers so the persistence strategy can change (e.g. swap ORM, add
 * caching) without touching API routes.
 */
export const draftService = {
  async listForUser(userId: string) {
    const drafts = await prisma.draft.findMany({
      where: { userId },
      include: { _count: { select: { tasks: true } } },
      orderBy: { updatedAt: "desc" },
    });
    return drafts.map((d) => ({
      id: d.id,
      title: d.title,
      taskCount: d._count.tasks,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
    }));
  },

  async getWithTasks(userId: string, draftId: string) {
    const draft = await prisma.draft.findFirst({
      where: { id: draftId, userId },
      include: { tasks: { orderBy: { order: "asc" } } },
    });
    return draft;
  },

  async create(userId: string, title: string, tasks: DraftTaskInput[]) {
    const taskData: Prisma.TaskCreateWithoutDraftInput[] = tasks.map((t, idx) => ({
      taskName: t.taskName.trim() || null,
      dueDate: t.dueDate.trim() ? new Date(t.dueDate) : null,
      order: idx,
    }));

    return prisma.draft.create({
      data: {
        userId,
        title,
        tasks: {
          create: taskData,
        },
      },
      include: { tasks: true },
    });
  },

  async replaceTasks(userId: string, draftId: string, title: string, tasks: DraftTaskInput[]) {
    const draft = await prisma.draft.findFirst({ where: { id: draftId, userId } });
    if (!draft) throw new Error("Draft not found");

    const taskData: Prisma.TaskCreateWithoutDraftInput[] = tasks.map((t, idx) => ({
      taskName: t.taskName.trim() || null,
      dueDate: t.dueDate.trim() ? new Date(t.dueDate) : null,
      order: idx,
    }));

    await prisma.$transaction([
      prisma.task.deleteMany({ where: { draftId } }),
      prisma.draft.update({
        where: { id: draftId },
        data: {
          title,
          tasks: {
            create: taskData,
          },
        },
      }),
    ]);

    return draftService.getWithTasks(userId, draftId);
  },

  async remove(userId: string, draftId: string) {
    const draft = await prisma.draft.findFirst({ where: { id: draftId, userId } });
    if (!draft) throw new Error("Draft not found");
    await prisma.draft.delete({ where: { id: draftId } });
  },
};
