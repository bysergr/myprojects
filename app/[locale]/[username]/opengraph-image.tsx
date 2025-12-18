import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";

export const runtime = "edge";

export const alt = "User Profile";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      name: true,
      username: true,
      bio: true,
      _count: {
        select: { projects: true },
      },
    },
  });

  if (!user) {
    return new ImageResponse(
      (
        <div
          style={{
            fontSize: 48,
            background: "black",
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
          }}
        >
          User Not Found
        </div>
      ),
      { ...size }
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 48,
          background: "linear-gradient(to bottom right, #1e293b, #0f172a)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px",
          color: "white",
        }}
      >
        <div style={{ fontSize: 72, fontWeight: "bold", marginBottom: "20px" }}>
          {user.name || user.username}
        </div>
        <div style={{ fontSize: 32, opacity: 0.8, marginBottom: "20px" }}>
          @{user.username}
        </div>
        {user.bio && (
          <div
            style={{
              fontSize: 24,
              opacity: 0.7,
              maxWidth: "800px",
              textAlign: "center",
              marginBottom: "30px",
            }}
          >
            {user.bio}
          </div>
        )}
        <div style={{ fontSize: 20, opacity: 0.6 }}>
          {user._count.projects} {user._count.projects === 1 ? "Project" : "Projects"}
        </div>
      </div>
    ),
    { ...size }
  );
}
