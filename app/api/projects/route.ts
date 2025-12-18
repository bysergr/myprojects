import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { prisma } from "@/lib/prisma";
import { generateSlug, ensureUniqueSlug } from "@/lib/slug";

export async function GET(request: NextRequest) {
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

    const projects = await prisma.project.findMany({
      where: { userId: uid },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { likes: true },
        },
      },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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
    const body = await request.json();

    // Generate slug from title
    const baseSlug = generateSlug(body.title);
    
    // Get existing slugs for this user
    const existingProjects = await prisma.project.findMany({
      where: { userId: uid },
      select: { slug: true },
    });
    const existingSlugs = existingProjects.map((p: { slug: string }) => p.slug);
    
    // Ensure unique slug
    const slug = ensureUniqueSlug(baseSlug, existingSlugs);

    const project = await prisma.project.create({
      data: {
        slug,
        title: body.title,
        description: body.description,
        imageUrl: body.imageUrl,
        techStack: body.techStack || [],
        liveUrl: body.liveUrl,
        repoUrl: body.repoUrl,
        published: body.published ?? false,
        userId: uid,
      },
      include: {
        _count: {
          select: { likes: true },
        },
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
