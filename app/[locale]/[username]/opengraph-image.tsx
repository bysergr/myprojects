import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

// Cambiar a nodejs runtime porque Prisma no funciona en edge runtime
export const runtime = "nodejs";

export const alt = "User Profile";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  try {
    const { username } = await params;

    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        projects: {
          where: { published: true },
          take: 3,
          orderBy: { createdAt: "desc" },
          include: {
            _count: {
              select: { likes: true, comments: true },
            },
          },
        },
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
              background: "#FAFAFA", // bg-background - tema claro
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#262626", // text-foreground - tema claro
            }}
          >
            User Not Found
          </div>
        ),
        { ...size }
      );
    }

    // Obtener la URL base del sitio
    const headersList = await headers();
    const host = headersList.get("host");
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
    const baseUrl = `${protocol}://${host}`;

    // Construir URLs de imágenes
    const badgeUrl = user.badgeUrl
      ? user.badgeUrl.includes("storage.googleapis.com") ||
        user.badgeUrl.includes("firebasestorage")
        ? `${baseUrl}/api/image?url=${encodeURIComponent(user.badgeUrl)}`
        : user.badgeUrl.startsWith("/")
        ? `${baseUrl}${user.badgeUrl}`
        : user.badgeUrl
      : null;

    const avatarUrl = user.avatarUrl
      ? user.avatarUrl.includes("storage.googleapis.com") ||
        user.avatarUrl.includes("firebasestorage")
        ? `${baseUrl}/api/image?url=${encodeURIComponent(user.avatarUrl)}`
        : user.avatarUrl.startsWith("/")
        ? `${baseUrl}${user.avatarUrl}`
        : user.avatarUrl
      : null;

    // Limpiar la bio de caracteres especiales
    const cleanBio = user.bio
      ? user.bio
          .replace(/[^\w\s.,!?\-()]/g, "")
          .substring(0, 100)
          .trim()
      : null;

    // Procesar custom links (puede no estar disponible en el tipo, así que lo manejamos de forma segura)
    const customLinks: Array<{ label: string; url: string }> = [];
    const hasSocialLinks = !!(
      user.githubUrl ||
      user.linkedinUrl ||
      user.twitterUrl ||
      user.websiteUrl ||
      customLinks.length > 0
    );

    // Obtener URLs de proyectos con toda la información
    const projectsData = user.projects.map(
      (project: {
        title: string;
        description: string | null;
        imageUrl: string | null;
        techStack: string[];
        views: number;
        _count: { likes: number; comments: number };
      }) => {
        let imageUrl = null;
        if (project.imageUrl) {
          if (
            project.imageUrl.includes("storage.googleapis.com") ||
            project.imageUrl.includes("firebasestorage")
          ) {
            imageUrl = `${baseUrl}/api/image?url=${encodeURIComponent(
              project.imageUrl
            )}`;
          } else if (project.imageUrl.startsWith("/")) {
            imageUrl = `${baseUrl}${project.imageUrl}`;
          } else {
            imageUrl = project.imageUrl;
          }
        }

        const cleanDescription = project.description
          ? project.description
              .replace(/[^\w\s.,!?\-()]/g, "")
              .substring(0, 80)
              .trim() + "..."
          : null;

        return {
          title: project.title,
          description: cleanDescription,
          imageUrl,
          techStack: project.techStack || [],
          likes: project._count.likes,
          views: project.views,
          comments: project._count.comments,
        };
      }
    );

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            background: "#FAFAFA", // bg-background: oklch(0.98 0.005 160) - tema claro
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          {/* Banner Section */}
          <div
            style={{
              width: "100%",
              height: "192px", // h-48 = 12rem = 192px
              display: "flex",
              position: "relative",
              background: "#F0F0F0", // bg-muted: oklch(0.94 0.02 160) - tema claro
            }}
          >
            {badgeUrl && (
              <img
                src={badgeUrl}
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            )}
          </div>

          {/* Content Container */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              padding: "32px 48px", // px-8 = 32px
              background: "#FAFAFA", // bg-background: oklch(0.98 0.005 160) - tema claro
            }}
          >
            {/* Profile Header */}
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "flex-start",
                gap: "24px",
                marginTop: "-128px", // -mt-16 ajustado para avatar más grande
                marginBottom: "24px",
              }}
            >
              {/* Avatar */}
              <div
                style={{
                  width: "144px", // h-36 = 9rem = 144px
                  height: "144px",
                  borderRadius: "50%",
                  border: "4px solid #FAFAFA", // border-background - tema claro
                  display: "flex",
                  overflow: "hidden",
                  background: "#F0F0F0", // bg-muted - tema claro
                  flexShrink: 0,
                }}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "64px",
                      fontWeight: "bold",
                      color: "#808080", // text-muted-foreground - tema claro
                    }}
                  >
                    {(
                      user.name?.[0] ||
                      user.username?.[0] ||
                      "U"
                    ).toUpperCase()}
                  </div>
                )}
              </div>

              {/* User Info */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  flex: 1,
                  paddingTop: "80px", // pt-20 = 5rem = 80px
                }}
              >
                <div
                  style={{
                    fontSize: "36px", // text-4xl
                    fontWeight: "bold",
                    marginBottom: "8px",
                    display: "flex",
                    color: "#262626", // text-foreground: oklch(0.15 0.02 160) - tema claro
                  }}
                >
                  {user.name || user.username}
                </div>
                {user.name && (
                  <div
                    style={{
                      fontSize: "16px",
                      color: "#808080", // text-muted-foreground: oklch(0.50 0.02 160) - tema claro
                      marginBottom: "16px",
                      display: "flex",
                    }}
                  >
                    @{user.username}
                  </div>
                )}
                {cleanBio && (
                  <div
                    style={{
                      fontSize: "16px",
                      color: "#262626", // text-foreground - tema claro
                      maxWidth: "600px",
                      lineHeight: "1.5",
                      display: "flex",
                      marginBottom: "16px",
                    }}
                  >
                    {cleanBio}
                  </div>
                )}

                {/* Social Links */}
                {hasSocialLinks && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      flexWrap: "wrap",
                      gap: "12px",
                      marginTop: "16px",
                    }}
                  >
                    {user.githubUrl && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "8px 16px",
                          borderRadius: "9999px",
                          background: "#F0F0F0", // bg-muted: oklch(0.94 0.02 160) - tema claro
                          fontSize: "14px",
                          color: "#262626", // text-foreground - tema claro
                        }}
                      >
                        <span>GitHub</span>
                      </div>
                    )}
                    {user.websiteUrl && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "8px 16px",
                          borderRadius: "9999px",
                          background: "#F0F0F0", // bg-muted - tema claro
                          fontSize: "14px",
                          color: "#262626", // text-foreground - tema claro
                        }}
                      >
                        <span>Website</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Projects Grid */}
            {projectsData.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  gap: "24px",
                  marginTop: "48px",
                }}
              >
                {projectsData.slice(0, 3).map((project, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      width: "320px",
                      background: "#FFFFFF", // bg-card: oklch(1 0 0) - tema claro
                      borderRadius: "8px",
                      overflow: "hidden",
                      border: "1px solid #E0E0E0", // border-border: oklch(0.88 0.03 160) - tema claro
                    }}
                  >
                    {/* Project Image */}
                    <div
                      style={{
                        width: "100%",
                        height: "160px", // h-40 = 10rem = 160px
                        display: "flex",
                        background: "#F0F0F0", // bg-muted - tema claro
                        overflow: "hidden",
                      }}
                    >
                      {project.imageUrl ? (
                        <img
                          src={project.imageUrl}
                          alt={project.title}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "48px",
                            fontWeight: "bold",
                            color: "rgba(255, 255, 255, 0.2)",
                            background:
                              "linear-gradient(to bottom right, rgba(34, 197, 94, 0.2), rgba(34, 197, 94, 0.05))",
                          }}
                        >
                          {project.title.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Project Content */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        padding: "16px",
                        gap: "8px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "18px",
                          fontWeight: "600",
                          color: "#262626", // text-foreground - tema claro
                          display: "flex",
                        }}
                      >
                        {project.title}
                      </div>
                      {project.description && (
                        <div
                          style={{
                            fontSize: "14px",
                            color: "#808080", // text-muted-foreground - tema claro
                            display: "flex",
                            lineHeight: "1.4",
                          }}
                        >
                          {project.description}
                        </div>
                      )}
                      {project.techStack.length > 0 && (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "row",
                            flexWrap: "wrap",
                            gap: "6px",
                            marginTop: "8px",
                          }}
                        >
                          {project.techStack
                            .slice(0, 3)
                            .map((tech: string, techIndex: number) => (
                              <div
                                key={techIndex}
                                style={{
                                  fontSize: "12px",
                                  padding: "4px 8px",
                                  background: "rgba(34, 197, 94, 0.1)", // bg-primary/10
                                  color: "#22c55e", // text-primary
                                  borderRadius: "9999px",
                                  display: "flex",
                                }}
                              >
                                {tech}
                              </div>
                            ))}
                          {project.techStack.length > 3 && (
                            <div
                              style={{
                                fontSize: "12px",
                                padding: "4px 8px",
                                background: "#F0F0F0", // bg-muted - tema claro
                                color: "#808080", // text-muted-foreground - tema claro
                                borderRadius: "9999px",
                                display: "flex",
                              }}
                            >
                              +{project.techStack.length - 3}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
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
            background: "#FAFAFA", // bg-background - tema claro
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#262626", // text-foreground - tema claro
          }}
        >
          Error generating image
        </div>
      ),
      { ...size }
    );
  }
}
