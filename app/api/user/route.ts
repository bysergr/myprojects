import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { prisma } from "@/lib/prisma";

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

    let user = await prisma.user.findUnique({
      where: { id: uid },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          id: uid,
          email: decodedToken.email!,
          name: decodedToken.name || decodedToken.email?.split("@")[0],
          avatarUrl: decodedToken.picture,
        },
      });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error verifying token:", error);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PUT(request: NextRequest) {
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

    // Check username uniqueness if provided
    if (body.username) {
      const existing = await prisma.user.findUnique({ where: { username: body.username } });
      if (existing && existing.id !== uid) {
        return NextResponse.json({ error: "Username taken" }, { status: 400 });
      }
    }

    const updateData: any = {};
    if (body.username !== undefined) updateData.username = body.username;
    if (body.name !== undefined) updateData.name = body.name;
    if (body.bio !== undefined) updateData.bio = body.bio;
    if (body.avatarUrl !== undefined) {
      updateData.avatarUrl = body.avatarUrl;
      console.log("Updating avatarUrl to:", body.avatarUrl);
    }
    if (body.badgeUrl !== undefined) {
      updateData.badgeUrl = body.badgeUrl;
      console.log("Updating badgeUrl to:", body.badgeUrl);
    }
    // Social links
    if (body.githubUrl !== undefined) updateData.githubUrl = body.githubUrl || null;
    if (body.linkedinUrl !== undefined) updateData.linkedinUrl = body.linkedinUrl || null;
    if (body.twitterUrl !== undefined) updateData.twitterUrl = body.twitterUrl || null;
    if (body.websiteUrl !== undefined) updateData.websiteUrl = body.websiteUrl || null;
    // Custom links (max 6)
    if (body.customLinks !== undefined) {
      const customLinks = Array.isArray(body.customLinks) ? body.customLinks.slice(0, 6) : [];
      updateData.customLinks = customLinks;
    }

    const user = await prisma.user.update({
      where: { id: uid },
      data: updateData,
    });

    console.log("User updated, avatarUrl:", user.avatarUrl);
    return NextResponse.json(user);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
