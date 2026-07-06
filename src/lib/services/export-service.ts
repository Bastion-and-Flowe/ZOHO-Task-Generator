import { prisma } from "@/lib/prisma";
import { generateCsv, type TaskRowInput } from "@/lib/csv";
import { buildExportFilename } from "@/lib/utils";

export const exportService = {
  async listForUser(userId: string) {
    const rows = await prisma.exportHistory.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { id: true, filename: true, taskCount: true, createdAt: true },
    });
    return rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));
  },

  async create(
    userId: string,
    tasks: TaskRowInput[],
    user: { name: string; department: string; subDepartment: string }
  ) {
    const csv = generateCsv(tasks, user);
    const filename = buildExportFilename(new Date());

    const record = await prisma.exportHistory.create({
      data: {
        userId,
        filename,
        taskCount: tasks.length,
        csvData: csv,
      },
    });

    return record;
  },

  async duplicate(userId: string, exportId: string) {
    const original = await prisma.exportHistory.findFirst({ where: { id: exportId, userId } });
    if (!original) throw new Error("Export not found");

    return prisma.exportHistory.create({
      data: {
        userId,
        filename: buildExportFilename(new Date()),
        taskCount: original.taskCount,
        csvData: original.csvData,
      },
    });
  },

  async remove(userId: string, exportId: string) {
    const record = await prisma.exportHistory.findFirst({ where: { id: exportId, userId } });
    if (!record) throw new Error("Export not found");
    await prisma.exportHistory.delete({ where: { id: exportId } });
  },

  async getForDownload(userId: string, exportId: string) {
    const record = await prisma.exportHistory.findFirst({ where: { id: exportId, userId } });
    if (!record) throw new Error("Export not found");
    return record;
  },
};
