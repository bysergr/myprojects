import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

// Cambiar a nodejs runtime porque Prisma no funciona en edge runtime
export const runtime = "nodejs";

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
  try {
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
        imageUrl: true,
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

    // Si hay una imagen del proyecto, usarla directamente
    if (project.imageUrl) {
      try {
        // Obtener la URL base del sitio
        const headersList = await headers();
        const host = headersList.get("host");
        const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
        const baseUrl = `${protocol}://${host}`;

        // Construir la URL de la imagen
        let imageUrl = project.imageUrl;
        
        // Si es una URL de Firebase Storage, usar el proxy
        if (imageUrl.includes("storage.googleapis.com") || imageUrl.includes("firebasestorage")) {
          imageUrl = `${baseUrl}/api/image?url=${encodeURIComponent(imageUrl)}`;
        } else if (imageUrl.startsWith("/")) {
          // Si es una ruta relativa, hacerla absoluta
          imageUrl = `${baseUrl}${imageUrl}`;
        } else if (!imageUrl.startsWith("http")) {
          // Si no tiene protocolo, asumir que es relativa
          imageUrl = `${baseUrl}/${imageUrl}`;
        }

        return new ImageResponse(
          (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                position: "relative",
              }}
            >
              <img
                src={imageUrl}
                alt={project.title}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </div>
          ),
          { ...size }
        );
      } catch (error) {
        console.error("Error loading project image:", error);
        // Si falla, continuar con el diseño de texto
      }
    }

    // Si no hay imagen, usar el diseño con texto
    // Limpiar la descripción de caracteres especiales y limitar longitud
    const cleanDescription = project.description
      ? project.description
          .replace(/[^\w\s.,!?\-()]/g, "")
          .substring(0, 120)
          .trim() + (project.description.length > 120 ? "..." : "")
      : "";

    const techStackItems = project.techStack && project.techStack.length > 0 
      ? project.techStack.slice(0, 5) 
      : [];

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
            <div style={{ fontSize: 64, fontWeight: "bold", marginBottom: "20px", display: "flex" }}>
              {project.title}
            </div>
            {cleanDescription && (
              <div
                style={{
                  fontSize: 28,
                  opacity: 0.8,
                  maxWidth: "900px",
                  marginBottom: "30px",
                  display: "flex",
                }}
              >
                {cleanDescription}
              </div>
            )}
            {techStackItems.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                {techStackItems.map((tech) => (
                  <div
                    key={tech}
                    style={{
                      background: "rgba(255, 255, 255, 0.1)",
                      padding: "8px 16px",
                      borderRadius: "8px",
                      fontSize: 20,
                      display: "flex",
                    }}
                  >
                    {tech}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ fontSize: 24, opacity: 0.6, display: "flex" }}>
            by {project.user.name || project.user.username}
          </div>
        </div>
      ),
      { ...size }
    );
  } catch (error) {
    console.error("Error generating Open Graph image:", error);
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
          Error generating image
        </div>
      ),
      { ...size }
    );
  }
}
