import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.split("Bearer ")[1];

  if (!adminAuth) {
    return NextResponse.json(
      { error: "Server misconfigured" },
      { status: 500 }
    );
  }

  try {
    await adminAuth.verifyIdToken(token);
    const body = await request.json();
    const { title, techStack, repoUrl, liveUrl } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Obtener README del repositorio si está disponible
    let readmeContent = "";
    if (repoUrl) {
      try {
        readmeContent = await fetchReadmeFromRepo(repoUrl);
      } catch (error) {
        console.error("Error fetching README:", error);
        // Continuar sin README si hay error
      }
    }

    // Construir el prompt para Gemini
    let prompt = `Generate a professional, concise project description (2-3 sentences) for a portfolio website based on the following information:\n\n`;
    prompt += `Project Title: ${title}\n`;

    if (techStack && techStack.length > 0) {
      const techStackStr = Array.isArray(techStack)
        ? techStack.join(", ")
        : techStack;
      prompt += `Technologies: ${techStackStr}\n`;
    }

    if (repoUrl) {
      prompt += `Repository URL: ${repoUrl}\n`;
    }

    if (liveUrl) {
      prompt += `Live URL: ${liveUrl}\n`;
    }

    if (readmeContent) {
      prompt += `\nRepository README:\n${readmeContent}\n`;
    }

    prompt += `\nBased on the information provided, generate a JSON object with the following structure:
{
  "title": "A better, more descriptive project title (not just the repo name)",
  "description": "A professional, concise project description (2-3 sentences) that highlights the project's purpose, key features, and technologies used. Write in English.",
  "techStack": ["technology1", "technology2", "technology3"],
  "liveUrl": "the live URL if mentioned in the README or project info, otherwise empty string"
}

Important:
- Extract technologies from the README, tech stack field, or repository topics
- Only include the liveUrl if it's explicitly mentioned
- The title should be descriptive and professional, not just the repository name
- Return ONLY valid JSON, no additional text or markdown formatting`;

    // Usar Vertex AI con cuenta de servicio
    return await generateWithVertexAI(prompt, title);
  } catch (error) {
    console.error("Error generating description:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Función usando Vertex AI con autenticación de cuenta de servicio
async function generateWithVertexAI(prompt: string, originalTitle: string) {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const location = process.env.GOOGLE_CLOUD_LOCATION || "us-central1";
  const model = "gemini-2.5-flash";

  if (!projectId) {
    return NextResponse.json(
      {
        error:
          "Google Cloud Project ID not configured. Please set GOOGLE_CLOUD_PROJECT_ID environment variable.",
      },
      { status: 500 }
    );
  }

  try {
    // Obtener token de acceso usando las credenciales de Firebase Admin
    const accessToken = await getAccessToken();

    if (!accessToken) {
      return NextResponse.json(
        { error: "Failed to authenticate with Google Cloud" },
        { status: 500 }
      );
    }

    // Llamar a Vertex AI API usando el endpoint generateContent para Gemini
    const vertexAiUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:generateContent`;

    const response = await fetch(vertexAiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2000,
          topP: 0.95,
          topK: 40,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Vertex AI Error:", errorText);
      return NextResponse.json(
        { error: "Failed to generate description" },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Extraer la descripción generada (formato de Vertex AI Gemini)
    let description = "";
    const candidate = data.candidates?.[0];

    if (candidate?.content?.parts) {
      // Concatenar todas las partes del contenido (por si hay múltiples partes)
      description = candidate.content.parts
        .map((part: { text?: string }) => part.text || "")
        .join("");
    } else {
      console.error(
        "Unexpected Vertex AI response format:",
        JSON.stringify(data, null, 2)
      );
      return NextResponse.json(
        { error: "Unexpected response format from Vertex AI" },
        { status: 500 }
      );
    }

    // Verificar si la respuesta fue truncada
    const finishReason = candidate?.finishReason;
    if (finishReason === "MAX_TOKENS") {
      console.warn(
        "La respuesta fue truncada por límite de tokens. Descripción recibida:",
        description
      );
    }

    console.log("Respuesta completa de la IA:", {
      length: description.length,
      preview:
        description.substring(0, 200) + (description.length > 200 ? "..." : ""),
      finishReason,
      fullResponse: description,
    });

    if (!description || description.trim().length === 0) {
      return NextResponse.json(
        { error: "Empty response generated" },
        { status: 500 }
      );
    }

    // Intentar parsear la respuesta como JSON
    try {
      // Limpiar la respuesta de posibles markdown code blocks
      let cleanedResponse = description.trim();
      if (cleanedResponse.startsWith("```json")) {
        cleanedResponse = cleanedResponse
          .replace(/^```json\s*/, "")
          .replace(/\s*```$/, "");
      } else if (cleanedResponse.startsWith("```")) {
        cleanedResponse = cleanedResponse
          .replace(/^```\s*/, "")
          .replace(/\s*```$/, "");
      }

      const parsed = JSON.parse(cleanedResponse);

      // Validar y retornar los datos estructurados
      return NextResponse.json({
        title: parsed.title || originalTitle, // Fallback al título original si no se genera uno mejor
        description: parsed.description || "",
        techStack: Array.isArray(parsed.techStack) ? parsed.techStack : [],
        liveUrl: parsed.liveUrl || "",
      });
    } catch (parseError) {
      console.error("Error parsing AI response as JSON:", parseError);
      console.log("Response was:", description);

      // Fallback: retornar solo la descripción si no se puede parsear como JSON
      return NextResponse.json({
        title: originalTitle, // Usar el título original
        description: description.trim(),
        techStack: [],
        liveUrl: "",
      });
    }
  } catch (error) {
    console.error("Vertex AI Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Función para obtener el README de un repositorio de GitHub
async function fetchReadmeFromRepo(repoUrl: string): Promise<string> {
  try {
    // Extraer owner y repo del URL de GitHub
    // Formatos soportados: https://github.com/owner/repo o https://github.com/owner/repo/
    const githubRegex = /github\.com\/([^/]+)\/([^/]+)/;
    const githubMatch = githubRegex.exec(repoUrl);
    if (!githubMatch) {
      return "";
    }

    const owner = githubMatch[1];
    const repo = githubMatch[2].replace(/\.git$/, "").replace(/\/$/, "");

    // Intentar obtener README.md desde la API de GitHub
    const readmeUrl = `https://api.github.com/repos/${owner}/${repo}/readme`;

    const response = await fetch(readmeUrl, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        // GitHub permite requests sin autenticación para repos públicos
        // Si necesitas repos privados, agrega: Authorization: `token ${process.env.GITHUB_TOKEN}`
      },
    });

    if (!response.ok) {
      // Si no se encuentra README.md, intentar con README (sin extensión)
      if (response.status === 404) {
        console.log("README no encontrado para:", {
          url: repoUrl,
          owner,
          repo,
        });
        return "";
      }
      console.error(`GitHub API error para ${repoUrl}:`, response.status);
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = await response.json();

    // Decodificar el contenido base64
    if (data.content && data.encoding === "base64") {
      const content = Buffer.from(data.content, "base64").toString("utf-8");

      // Limitar el tamaño del README para no exceder límites del prompt
      // Mantener solo las primeras 2000 palabras aproximadamente
      const words = content.split(/\s+/);
      const maxWords = 2000;
      const truncatedContent =
        words.length > maxWords
          ? words.slice(0, maxWords).join(" ") + "..."
          : content;

      console.log("README obtenido del repositorio:", {
        url: repoUrl,
        owner,
        repo,
        originalLength: content.length,
        truncatedLength: truncatedContent.length,
        preview: truncatedContent.substring(0, 200) + "...",
      });

      return truncatedContent;
    }

    console.log("README no disponible (sin contenido base64) para:", {
      url: repoUrl,
      owner,
      repo,
    });
    return "";
  } catch (error) {
    console.error("Error fetching README from GitHub:", {
      url: repoUrl,
      error: error instanceof Error ? error.message : String(error),
    });
    return "";
  }
}

// Función para obtener token de acceso usando las credenciales de Vertex AI
async function getAccessToken(): Promise<string | null> {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const clientEmail = process.env.GOOGLE_CLOUD_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_CLOUD_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.error(
      "Missing Vertex AI credentials. Please set GOOGLE_CLOUD_PROJECT_ID, GOOGLE_CLOUD_CLIENT_EMAIL, and GOOGLE_CLOUD_PRIVATE_KEY environment variables."
    );
    return null;
  }

  try {
    // Usar google-auth-library para obtener el token
    const { GoogleAuth } = await import("google-auth-library");

    const auth = new GoogleAuth({
      credentials: {
        project_id: projectId,
        client_email: clientEmail,
        private_key: privateKey.replaceAll("\\n", "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });

    const client = await auth.getClient();
    const accessTokenResponse = await client.getAccessToken();

    return accessTokenResponse?.token || null;
  } catch (error) {
    console.error("Error getting access token:", error);
    return null;
  }
}
