import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";

export const runtime = "edge";

export const alt = "Project";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image({ 
  params 
}: { 
  params: Promise<{ username: string; slug: string }> 
}) {
  const { username, slug } = await params;

  const project = await prisma.project.findFirst({
    where: {
      slug,
      published: true,
      user: { username },
    },
    select: {
      title: true,
      description: true,
      techStack: true,
      user: {
        select: {
          name: true,
          username: true,
        },
      },
    },
  });

  if (!project) {
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
          Project Not Found
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
          alignItems: "flex-start",
          justifyContent: "space-between",
          padding: "60px",
          color: "white",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 64, fontWeight: "bold", marginBottom: "20px" }}>
            {project.title}
          </div>
          {project.description && (
            <div
              style={{
                fontSize: 28,
                opacity: 0.8,
                maxWidth: "900px",
                marginBottom: "30px",
              }}
            >
              {project.description.substring(0, 120)}
              {project.description.length > 120 ? "..." : ""}
            </div>
          )}
          {project.techStack.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              {project.techStack.slice(0, 5).map((tech) => (
                <div
                  key={tech}
                  style={{
                    background: "rgba(255, 255, 255, 0.1)",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    fontSize: 20,
                  }}
                >
                  {tech}
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ fontSize: 24, opacity: 0.6 }}>
          by {project.user.name || project.user.username}
        </div>
      </div>
    ),
    { ...size }
  );
}
