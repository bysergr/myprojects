import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminStorage } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.split("Bearer ")[1];

  if (!adminAuth || !adminStorage) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  try {
    // Verify user authentication
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const path = formData.get("path") as string;

    if (!file || !path) {
      return NextResponse.json(
        { error: "File and path are required" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are allowed" },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 10MB" },
        { status: 400 }
      );
    }

    // Get storage bucket - specify bucket name explicitly
    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    if (!bucketName) {
      return NextResponse.json(
        { error: "Storage bucket not configured" },
        { status: 500 }
      );
    }
    const bucket = adminStorage.bucket(bucketName);
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Upload file
    const fileRef = bucket.file(path);
    await fileRef.save(fileBuffer, {
      metadata: {
        contentType: file.type,
        metadata: {
          uploadedBy: uid,
        },
      },
    });

    // Try to make file publicly accessible (may fail if bucket rules don't allow it)
    try {
      await fileRef.makePublic();
    } catch (publicError) {
      console.warn("Could not make file public, using signed URL instead:", publicError);
    }

    // Get URL - try public URL first, fallback to signed URL
    let url: string;
    try {
      // Check if file is public by trying to get public URL
      // Encode the path properly for URL
      const encodedPath = encodeURIComponent(path).replace(/%2F/g, '/');
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${encodedPath}`;
      
      // Try to verify if file is accessible (we'll use signed URL as fallback if needed)
      try {
        // Generate signed URL (valid for 1 year) - more reliable
        const [signedUrl] = await fileRef.getSignedUrl({
          action: "read",
          expires: "03-09-2491", // Far future date
        });
        url = signedUrl;
      } catch (signError) {
        // If signed URL fails, try public URL
        url = publicUrl;
      }
    } catch (urlError) {
      console.error("Error generating URL:", urlError);
      // Final fallback: construct public URL
      const encodedPath = encodeURIComponent(path).replace(/%2F/g, '/');
      url = `https://storage.googleapis.com/${bucket.name}/${encodedPath}`;
    }

    console.log("Upload successful, URL:", url);
    return NextResponse.json({ url });
  } catch (error) {
    console.error("Upload error:", error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

