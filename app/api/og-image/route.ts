import { NextRequest, NextResponse } from "next/server";

/**
 * Extrae la imagen de Open Graph de una URL
 * Busca en las siguientes meta tags en orden de prioridad:
 * 1. og:image
 * 2. twitter:image
 * 3. image_src (rel="image_src")
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  // Validar que sea una URL válida
  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  try {
    // Hacer fetch del HTML de la página
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; OpenGraphBot/1.0)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      // Timeout de 10 segundos
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL: ${response.status}` },
        { status: response.status }
      );
    }

    const html = await response.text();

    // Buscar og:image
    const ogImageMatch = html.match(
      /<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i
    ) || html.match(
      /<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i
    );

    if (ogImageMatch && ogImageMatch[1]) {
      let imageUrl = ogImageMatch[1].trim();
      
      // Si la URL es relativa, convertirla a absoluta
      if (imageUrl.startsWith("//")) {
        imageUrl = new URL(url).protocol + imageUrl;
      } else if (imageUrl.startsWith("/")) {
        const baseUrl = new URL(url);
        imageUrl = `${baseUrl.protocol}//${baseUrl.host}${imageUrl}`;
      } else if (!imageUrl.startsWith("http")) {
        const baseUrl = new URL(url);
        imageUrl = `${baseUrl.protocol}//${baseUrl.host}/${imageUrl}`;
      }

      return NextResponse.json({ imageUrl });
    }

    // Buscar twitter:image como alternativa
    const twitterImageMatch = html.match(
      /<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i
    ) || html.match(
      /<meta\s+content=["']([^"']+)["']\s+name=["']twitter:image["']/i
    );

    if (twitterImageMatch && twitterImageMatch[1]) {
      let imageUrl = twitterImageMatch[1].trim();
      
      // Si la URL es relativa, convertirla a absoluta
      if (imageUrl.startsWith("//")) {
        imageUrl = new URL(url).protocol + imageUrl;
      } else if (imageUrl.startsWith("/")) {
        const baseUrl = new URL(url);
        imageUrl = `${baseUrl.protocol}//${baseUrl.host}${imageUrl}`;
      } else if (!imageUrl.startsWith("http")) {
        const baseUrl = new URL(url);
        imageUrl = `${baseUrl.protocol}//${baseUrl.host}/${imageUrl}`;
      }

      return NextResponse.json({ imageUrl });
    }

    // Buscar rel="image_src" como última opción
    const imageSrcMatch = html.match(
      /<link\s+rel=["']image_src["']\s+href=["']([^"']+)["']/i
    ) || html.match(
      /<link\s+href=["']([^"']+)["']\s+rel=["']image_src["']/i
    );

    if (imageSrcMatch && imageSrcMatch[1]) {
      let imageUrl = imageSrcMatch[1].trim();
      
      // Si la URL es relativa, convertirla a absoluta
      if (imageUrl.startsWith("//")) {
        imageUrl = new URL(url).protocol + imageUrl;
      } else if (imageUrl.startsWith("/")) {
        const baseUrl = new URL(url);
        imageUrl = `${baseUrl.protocol}//${baseUrl.host}${imageUrl}`;
      } else if (!imageUrl.startsWith("http")) {
        const baseUrl = new URL(url);
        imageUrl = `${baseUrl.protocol}//${baseUrl.host}/${imageUrl}`;
      }

      return NextResponse.json({ imageUrl });
    }

    // No se encontró ninguna imagen
    return NextResponse.json({ imageUrl: null });
  } catch (error) {
    console.error("Error extracting Open Graph image:", error);
    
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json(
        { error: "Request timeout" },
        { status: 408 }
      );
    }

    return NextResponse.json(
      { error: "Failed to extract image" },
      { status: 500 }
    );
  }
}

