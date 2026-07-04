import { defaultTitle, detectPlatform, ytThumb } from "@reelparty/shared";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const IG_UA =
  "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)";

export interface VideoMeta {
  title: string;
  creator: string;
  thumbnail: string;
  url?: string;
}

function decodeHtml(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(Number(num)));
}

function ogTag(html: string, prop: string): string {
  const m =
    html.match(new RegExp(`property="${prop}" content="([^"]+)"`, "i")) ||
    html.match(new RegExp(`name="${prop}" content="([^"]+)"`, "i"));
  return m ? decodeHtml(m[1]!) : "";
}

function parseInstagramCreator(title: string): string {
  const m = title.match(/^(.+?) on Instagram:/);
  return m ? m[1]!.trim() : "";
}

async function resolveUrl(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      headers: { "User-Agent": UA },
    });
    return res.url || url;
  } catch {
    return url;
  }
}

interface OembedResponse {
  title?: string;
  author_name?: string;
  thumbnail_url?: string;
  error?: unknown;
  code?: unknown;
}

async function fetchOembed(
  endpoint: string,
  url: string,
): Promise<OembedResponse | null> {
  const res = await fetch(`${endpoint}${encodeURIComponent(url)}`, {
    headers: { "User-Agent": UA, Accept: "application/json" },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as OembedResponse;
  if (data?.error || data?.code) return null;
  return data;
}

async function scrapeOg(
  url: string,
  userAgent = UA,
): Promise<VideoMeta | null> {
  const res = await fetch(url, {
    redirect: "follow",
    headers: { "User-Agent": userAgent },
  });
  if (!res.ok) return null;
  const html = await res.text();
  const thumbnail = ogTag(html, "og:image") || ogTag(html, "twitter:image");
  if (!thumbnail) return null;
  const title = ogTag(html, "og:title") || ogTag(html, "twitter:title");
  return { title, thumbnail, creator: "" };
}

/** Best-effort title/creator/thumbnail for a supported short-video URL. */
export async function fetchMeta(rawUrl: string): Promise<VideoMeta> {
  const url = (rawUrl || "").trim();
  const det = detectPlatform(url);
  if (!det) return { title: "Video", creator: "", thumbnail: "" };

  const { platform, videoId } = det;

  if (platform === "youtube") {
    const oembed = await fetchOembed("https://www.youtube.com/oembed?url=", url);
    if (oembed) {
      return {
        title: oembed.title || defaultTitle(platform),
        creator: oembed.author_name || "",
        thumbnail:
          oembed.thumbnail_url || (videoId ? ytThumb(videoId) : ""),
      };
    }
    return {
      title: defaultTitle(platform),
      creator: "",
      thumbnail: videoId ? ytThumb(videoId) : "",
    };
  }

  if (platform === "tiktok") {
    const resolved = await resolveUrl(url);
    const oembed = await fetchOembed(
      "https://www.tiktok.com/oembed?url=",
      resolved,
    );
    if (oembed?.thumbnail_url) {
      return {
        title: oembed.title || defaultTitle(platform),
        creator: oembed.author_name || "",
        thumbnail: oembed.thumbnail_url,
        url: resolved,
      };
    }
    const og = await scrapeOg(resolved);
    if (og) {
      return {
        title: og.title || defaultTitle(platform),
        creator: og.creator,
        thumbnail: og.thumbnail,
        url: resolved,
      };
    }
    return {
      title: defaultTitle(platform),
      creator: "",
      thumbnail: "",
      url: resolved,
    };
  }

  if (platform === "facebook") {
    const resolved = await resolveUrl(url);
    const oembed = await fetchOembed(
      "https://www.facebook.com/plugins/video/oembed.json/?url=",
      resolved,
    );
    if (oembed?.thumbnail_url) {
      return {
        title: oembed.title || defaultTitle(platform),
        creator: oembed.author_name || "",
        thumbnail: oembed.thumbnail_url,
        url: resolved,
      };
    }
    const og = await scrapeOg(resolved, IG_UA);
    if (og) {
      return {
        title: og.title || defaultTitle(platform),
        creator: og.creator,
        thumbnail: og.thumbnail,
        url: resolved,
      };
    }
    return {
      title: defaultTitle(platform),
      creator: "",
      thumbnail: "",
      url: resolved,
    };
  }

  // instagram
  const og = await scrapeOg(url, IG_UA);
  if (og) {
    return {
      title: og.title || defaultTitle(platform),
      creator: parseInstagramCreator(og.title),
      thumbnail: og.thumbnail,
    };
  }
  return { title: defaultTitle(platform), creator: "", thumbnail: "" };
}
