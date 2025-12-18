import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { prisma } from "@/lib/prisma";
import { generateSlug, ensureUniqueSlug } from "@/lib/slug";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.split("Bearer ")[1];

  if (!adminAuth) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;
    const { id } = await params;
    const body = await request.json();

    // Verify ownership
    const existing = await prisma.project.findUnique({
      where: { id },
      select: { userId: true, title: true, slug: true },
    });

    if (!existing || existing.userId !== uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Generate new slug if title changed
    let slug = existing.slug;
    if (body.title && body.title !== existing.title) {
      const baseSlug = generateSlug(body.title);
      const existingProjects = await prisma.project.findMany({
        where: { 
          userId: uid,
          NOT: { id },
        },
        select: { slug: true },
      });
      const existingSlugs = existingProjects.map((p: { slug: string }) => p.slug);
      slug = ensureUniqueSlug(baseSlug, existingSlugs);
    }

    const project = await prisma.project.update({
      where: { id },
      data: {
        ...(body.title && { title: body.title }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl }),
        ...(body.techStack !== undefined && { techStack: body.techStack }),
        ...(body.liveUrl !== undefined && { liveUrl: body.liveUrl }),
        ...(body.repoUrl !== undefined && { repoUrl: body.repoUrl }),
        ...(slug && { slug }),
      },
      include: {
        _count: {
          select: { likes: true },
        },
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

