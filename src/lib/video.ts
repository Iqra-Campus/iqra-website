// Accepts a YouTube link in any common form and returns a privacy-friendly embed URL, or null.
export function youtubeEmbed(input: string | undefined): string | null {
  if (!input) return null;
  try {
    const u = new URL(input.trim());
    const host = u.hostname.replace(/^www\.|^m\./, "");
    let id = "";
    if (host === "youtu.be") id = u.pathname.slice(1).split("/")[0];
    else if (host === "youtube.com" || host === "youtube-nocookie.com") {
      if (u.pathname === "/watch") id = u.searchParams.get("v") ?? "";
      else { const m = u.pathname.match(/^\/(?:shorts|embed|live)\/([^/?]+)/); id = m?.[1] ?? ""; }
    }
    return /^[A-Za-z0-9_-]{11}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  } catch { return null; }
}
