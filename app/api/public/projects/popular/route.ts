import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      where: {
        published: true,
      },
      orderBy: [
        { views: "desc" },
        { createdAt: "desc" },
      ],
      take: 10,
      include: {
        user: {
          select: {
            name: true,
            username: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: { likes: true },
        },
      },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Error fetching popular projects:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

