import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminStorage } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "URL parameter is required" }, { status: 400 });
  }

  // Verify authentication (optional - you can make this public if needed)
  const authHeader = request.headers.get("Authorization");
  let isAuthenticated = false;

  if (authHeader?.startsWith("Bearer ")) {
    try {
      const token = authHeader.split("Bearer ")[1];
      if (adminAuth) {
        await adminAuth.verifyIdToken(token);
        isAuthenticated = true;
      }
    } catch {
      // Not authenticated, but we'll still try to serve the image
    }
  }

  try {
    // Fetch the image from Firebase Storage
    const response = await fetch(url, {
      headers: {
        'Referer': 'https://firebase.google.com/',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch image" },
        { status: response.status }
      );
    }

    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "image/jpeg";

    // Return the image with proper CORS headers
    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
      },
    });
  } catch (error) {
    console.error("Error proxying image:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

