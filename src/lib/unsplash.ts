if (!process.env.UNSPLASH_ACCESS_KEY) {
  throw new Error("Add UNSPLASH_ACCESS_KEY to your .env file");
}

const ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

interface UnsplashPhoto {
  urls: { regular: string };
  links: { download_location: string };
  user: { name: string; links: { html: string } };
}

interface UnsplashSearchResponse {
  results: UnsplashPhoto[];
}

export interface DestinationCoverImage {
  url: string;
  photographerName: string;
  photographerProfileUrl: string;
}

export async function findDestinationCoverImage(
  destination: string,
): Promise<DestinationCoverImage | null> {
  const res = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(destination)}&per_page=1&orientation=landscape`,
    { headers: { Authorization: `Client-ID ${ACCESS_KEY}` } },
  );

  if (!res.ok) {
    throw new Error(`Unsplash search failed with status ${res.status}`);
  }

  const data = (await res.json()) as UnsplashSearchResponse;
  const photo = data.results[0];
  if (!photo) return null;

  // Unsplash API guidelines require pinging download_location whenever a
  // photo is used, even for hotlink-and-rehost flows like ours.
  void fetch(`${photo.links.download_location}?client_id=${ACCESS_KEY}`).catch(() => {});

  return {
    url: photo.urls.regular,
    photographerName: photo.user.name,
    photographerProfileUrl: photo.user.links.html,
  };
}
