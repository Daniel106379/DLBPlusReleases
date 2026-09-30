/**
 * DLBPlus NetMirror provider
 * Based on the NetMirror provider supplied by DLBPlus.
 * DLBPlus-pinned version: 1.0.1
 *
 * TV fix:
 *   Always resolve the requested season through the dedicated episodes endpoint
 *   before falling back to post.episodes. This prevents SxE2+ resolving to E1
 *   when NetMirror's post response contains summary/incomplete episode data.
 */

const TMDB_API_KEY = "1865f43a0549ca50d341dd9ab8b29f49";

const PLATFORM_MAP = {
  netflix: {
    ott: "nf",
    search: "/mobile/search.php",
    post: "/mobile/post.php",
    episodes: "/mobile/episodes.php",
    playlist: "/mobile/playlist.php"
  },
  primevideo: {
    ott: "pv",
    search: "/mobile/pv/search.php",
    post: "/mobile/pv/post.php",
    episodes: "/mobile/pv/episodes.php",
    playlist: "/mobile/pv/playlist.php"
  },
  hotstar: {
    ott: "hs",
    search: "/mobile/hs/search.php",
    post: "/mobile/hs/post.php",
    episodes: "/mobile/hs/episodes.php",
    playlist: "/mobile/hs/playlist.php"
  },
  disney: {
    ott: "hs",
    search: "/mobile/hs/search.php",
    post: "/mobile/hs/post.php",
    episodes: "/mobile/hs/episodes.php",
    playlist: "/mobile/hs/playlist.php"
  }
};

const BASE = "https://net52.cc";
const COOKIE_TTL = 54e6;
const VERIFY_ATTEMPTS = 7;
const VERIFY_DELAY = 1e4;
const APP_USER_AGENT =
  "Mozilla/5.0 (Linux; Android 12; RMX2117 Build/SP1A.210812.016; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/147.0.7727.55 Mobile Safari/537.36 /OS.Gatu v3.0";

const BASE_HEADERS = {
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
  "Accept-Language": "en-IN,en-US;q=0.9,en;q=0.8",
  "Cache-Control": "max-age=0",
  "User-Agent":
    "Mozilla/5.0 (Linux; Android 13; Pixel 5 Build/TQ3A.230901.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/144.0.7559.132 Safari/537.36 /OS.Gatu v3.0",
  "X-Requested-With": "XMLHttpRequest"
};

let cookieValue = "";
let cookieTimestamp = 0;
let cookieJar = [];

function setCookieValues(headers) {
  if (!headers) return [];
  if (typeof headers.getSetCookie === "function") {
    try {
      return headers.getSetCookie();
    } catch (_) {}
  }
  const raw =
    (typeof headers.get === "function" &&
      (headers.get("set-cookie") || headers.get("Set-Cookie"))) ||
    "";
  return raw
    .split(/,(?=\s*[^;,\s]+=)/g)
    .map((v) => v.trim())
    .filter(Boolean);
}

function rememberResponseCookies(headers, responseUrl) {
  let host;
  try {
    host = new URL(responseUrl).hostname.toLowerCase();
  } catch (_) {
    return;
  }

  for (const raw of setCookieValues(headers)) {
    const pair = raw.split(";", 1)[0];
    const equals = pair.indexOf("=");
    if (equals <= 0) continue;

    const name = pair.slice(0, equals).trim();
    const value = pair.slice(equals + 1).trim();
    const domainMatch = raw.match(/(?:^|;)\s*domain=([^;]+)/i);
    const domain = (domainMatch ? domainMatch[1] : host)
      .trim()
      .replace(/^\./, "")
      .toLowerCase();

    const index = cookieJar.findIndex(
      (c) => c.name === name && c.domain === domain
    );

    if (/max-age\s*=\s*0/i.test(raw) || !value) {
      if (index >= 0) cookieJar.splice(index, 1);
      continue;
    }

    const cookie = { name, value, domain };
    if (index >= 0) cookieJar[index] = cookie;
    else cookieJar.push(cookie);
  }
}

function cookieHeaderFor(url) {
  let host;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch (_) {
    return "";
  }

  return cookieJar
    .filter(
      (c) => host === c.domain || host.endsWith(`.${c.domain}`)
    )
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
}

async function request(url, options = {}) {
  const headers = { ...(options.headers || {}) };
  const cookieHeader = cookieHeaderFor(url);
  if (cookieHeader) headers.Cookie = cookieHeader;

  const response = await fetch(url, { ...options, headers });
  rememberResponseCookies(response.headers, response.url || url);
  return response;
}

function getCookie(name) {
  return cookieJar.find((c) => c.name === name)?.value || "";
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function bypass(mainUrl) {
  if (cookieValue && Date.now() - cookieTimestamp < COOKIE_TTL)
    return cookieValue;

  const base = String(mainUrl || BASE).replace(/\/$/, "");
  const homeUrl = `${base}/mobile/home?app=1`;

  const appHeaders = {
    "User-Agent": APP_USER_AGENT,
    "X-Requested-With": "app.netmirror.netmirrornew"
  };

  try {
    console.log("[NetMirror] Starting mobile cookie verification...");
    cookieJar = [];

    const homeResponse = await request(homeUrl, { headers: appHeaders });
    const homeHtml = await homeResponse.text();

    if (!homeResponse.ok)
      throw new Error(`Mobile home returned HTTP ${homeResponse.status}`);

    const match = homeHtml.match(
      /data-addhash\s*=\s*["']([^"']+)["']/i
    );
    const addhash = match?.[1];

    if (!addhash)
      throw new Error("NetMirror mobile home did not provide data-addhash");

    const userverUrl =
      `https://userver.net52.cc/?hee5=${encodeURIComponent(addhash)}` +
      `&a=y&t=${Math.random()}`;

    const userverResponse = await request(userverUrl, {
      headers: appHeaders
    });
    await userverResponse.text();

    const verifyUrl = `${base}/mobile/verify2.php`;
    const verifyHeaders = {
      "User-Agent": APP_USER_AGENT,
      "X-Requested-With": "XMLHttpRequest",
      "Content-Type": "application/x-www-form-urlencoded"
    };

    for (let attempt = 1; attempt <= VERIFY_ATTEMPTS; attempt++) {
      await delay(VERIFY_DELAY);

      const response = await request(verifyUrl, {
        method: "POST",
        headers: verifyHeaders,
        body: `verify=${encodeURIComponent(addhash)}`
      });

      const text = await response.text();
      let allDone = text.includes('"statusup":"All Done"');

      if (!allDone) {
        try {
          allDone = JSON.parse(text).statusup === "All Done";
        } catch (_) {}
      }

      if (!allDone) {
        console.log(
          `[NetMirror] Cookie verification pending (attempt ${attempt}/${VERIFY_ATTEMPTS}).`
        );
        continue;
      }

      const verifiedCookie = getCookie("t_hash_t");
      if (!verifiedCookie)
        throw new Error("Verification completed without a t_hash_t cookie");

      cookieValue = verifiedCookie;
      cookieTimestamp = Date.now();
      console.log("[NetMirror] Mobile cookie verified.");
      return cookieValue;
    }

    throw new Error(
      "Mobile verification did not complete; NetMirror may be waiting for an ad click"
    );
  } catch (error) {
    cookieValue = "";
    cookieTimestamp = 0;
    console.error(
      "[NetMirror] Mobile cookie verification failed:",
      error?.message || error
    );
    return "";
  }
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function numericField(item, fields) {
  for (const field of fields) {
    const value = item?.[field];
    if (value === undefined || value === null || value === "") continue;
    const n = Number(String(value).replace(/\D/g, ""));
    if (Number.isFinite(n) && n > 0) return n;
  }
  return 0;
}

function findMobileEpisode(episodes, season, episode, fallbackSeason) {
  if (!Array.isArray(episodes)) return null;

  const wantedSeason = Number(season);
  const wantedEpisode = Number(episode);
  const fallback = Number(fallbackSeason) || 0;

  return (
    episodes.find((item) => {
      if (!item) return false;

      const epNumber = numericField(item, [
        "ep",
        "episode",
        "episode_number",
        "episodeNumber",
        "e",
        "number"
      ]);

      let seasonNumber = numericField(item, [
        "s",
        "sNum",
        "season",
        "season_number",
        "seasonNumber"
      ]);

      if (!seasonNumber) seasonNumber = fallback;

      return epNumber === wantedEpisode && seasonNumber === wantedSeason;
    }) || null
  );
}

function findSeason(post, wantedSeason) {
  if (!Array.isArray(post?.season)) return null;

  return (
    post.season.find((s) => {
      const value = numericField(s, [
        "s",
        "sNum",
        "season",
        "season_number",
        "seasonNumber",
        "number"
      ]);
      return value === Number(wantedSeason);
    }) || null
  );
}

async function getJson(url, headers, referer = `${BASE}/home`) {
  const response = await fetch(url, {
    headers: {
      ...headers,
      Referer: referer
    }
  });

  if (!response.ok)
    throw new Error(`NetMirror mobile returned HTTP ${response.status}`);

  return response.json();
}

/**
 * Resolve a TV episode from NetMirror.
 *
 * IMPORTANT:
 * We deliberately query the dedicated season endpoint first.
 * post.episodes is only a fallback. This avoids stale/incomplete
 * summary episode objects causing S1E2+ to resolve to E1.
 */
async function resolveTvEpisode(
  platform,
  headers,
  resultId,
  post,
  season,
  episode
) {
  const wantedSeason = Number(season);
  const wantedEpisode = Number(episode);

  const seasonEntry = findSeason(post, wantedSeason);

  if (seasonEntry?.id) {
    for (let page = 1; page <= 30; page++) {
      const url =
        `${BASE}${platform.episodes}` +
        `?s=${encodeURIComponent(seasonEntry.id)}` +
        `&series=${encodeURIComponent(resultId)}` +
        `&t=${Math.floor(Date.now() / 1000)}` +
        `&page=${page}`;

      const data = await getJson(url, headers, `${BASE}/mobile/home?app=1`);

      const episodeEntry = findMobileEpisode(
        data?.episodes,
        wantedSeason,
        wantedEpisode,
        wantedSeason
      );

      if (episodeEntry?.id) return episodeEntry;

      if (!data?.nextPageShow || Number(data.nextPageShow) === 0)
        break;
    }
  }

  // Fallback only if NetMirror did not give us a usable season endpoint.
  return findMobileEpisode(
    post?.episodes,
    wantedSeason,
    wantedEpisode,
    wantedSeason
  );
}

async function fetchFromPlatform(
  platformKey,
  platform,
  title,
  mediaType,
  season,
  episode
) {
  const cookie = await bypass(BASE);
  const settings = globalThis.SCRAPER_SETTINGS || {};

  const cookies = [];
  if (cookie) cookies.push(`t_hash_t=${cookie}`);
  cookies.push(`ott=${platform.ott}`);
  if (settings.forceHd !== false) cookies.push("hd=on");

  const headers = {
    ...BASE_HEADERS,
    Cookie: cookies.join("; ")
  };

  const search = await getJson(
    `${BASE}${platform.search}?s=${encodeURIComponent(title)}&t=${Math.floor(Date.now() / 1000)}`,
    headers
  );

  const results = Array.isArray(search?.searchResult)
    ? search.searchResult
    : [];

  if (!results.length) return null;

  const wanted = normalize(title);

  const rank = (item) => {
    const candidate = normalize(item?.t || item?.title);
    if (candidate === wanted) return 0;
    if (candidate.includes(wanted) || wanted.includes(candidate)) return 1;
    return 2;
  };

  results.sort((a, b) => rank(a) - rank(b));

  const wantedSeason = Number(season);
  const wantedEpisode = Number(episode);

  for (const result of results.slice(0, 8)) {
    if (!result?.id) continue;

    const post = await getJson(
      `${BASE}${platform.post}?id=${encodeURIComponent(result.id)}&t=${Math.floor(Date.now() / 1000)}`,
      headers
    );

    if (!post || (post.status === "n" && post.error)) continue;

    let targetId = result.id;

    if (mediaType === "tv") {
      if (post.type !== "t" && !Array.isArray(post.episodes))
        continue;

      const episodeEntry = await resolveTvEpisode(
        platform,
        headers,
        result.id,
        post,
        wantedSeason,
        wantedEpisode
      );

      if (!episodeEntry?.id) {
        console.log(
          `[NetMirror] Could not resolve S${wantedSeason}E${wantedEpisode} for ${title} on ${platformKey}`
        );
        continue;
      }

      console.log(
        `[NetMirror] Resolved ${title} S${wantedSeason}E${wantedEpisode} -> ${episodeEntry.id}`
      );

      targetId = episodeEntry.id;
    } else if (
      post.type === "t" ||
      Array.isArray(post.episodes) && post.episodes.some(Boolean)
    ) {
      continue;
    }

    const playlistUrl =
      `${BASE}${platform.playlist}` +
      `?id=${encodeURIComponent(targetId)}` +
      `&t=${encodeURIComponent(title)}` +
      `&tm=${Math.floor(Date.now() / 1000)}`;

    const playlist = await getJson(
      playlistUrl,
      {
        ...headers,
        "X-Requested-With": "app.netmirror.netmirrornew",
        Accept: "*/*",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors"
      },
      `${BASE}/mobile/home?app=1`
    );

    const entries = Array.isArray(playlist)
      ? playlist
      : playlist?.playlist || playlist?.data || [];

    const streams = [];

    for (const entry of entries) {
      for (const source of entry?.sources || []) {
        if (!source?.file) continue;

        const streamUrl = /^https?:\/\//i.test(source.file)
          ? source.file
          : source.file.startsWith("//")
            ? `https:${source.file}`
            : `${BASE}${source.file.startsWith("/") ? "" : "/"}${source.file}`;

        const label = source.label || "Auto";
        const quality =
          (String(label).match(/\d{3,4}p?/i) || [])[0] ||
          (/full\s*hd/i.test(label)
            ? "1080p"
            : /mid\s*hd/i.test(label)
              ? "720p"
              : /low\s*hd/i.test(label)
                ? "480p"
                : "Auto");

        const playbackHeaders = {
          Accept: "*/*",
          "Accept-Language": "en-IN,en-US;q=0.9,en;q=0.8",
          Connection: "keep-alive",
          Referer: `${BASE}/mobile/home?app=1`,
          "User-Agent":
            "Mozilla/5.0 (Linux; Android 13; Pixel 5 Build/TQ3A.230901.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/149.0.7827.91 Safari/537.36 /OS.Gatu v3.0",
          "X-Requested-With": "app.netmirror.netmirrornew"
        };

        if (settings.forceHd !== false)
          playbackHeaders.Cookie = "hd=on";

        streams.push({
          name: `NetMirror (${platformKey})`,
          title:
            mediaType === "tv"
              ? `${title} S${wantedSeason}E${wantedEpisode} - ${label}`
              : `${title} - ${label}`,
          url: streamUrl,
          quality,
          headers: playbackHeaders
        });
      }
    }

    if (streams.length) return streams;
  }

  return null;
}

async function getStreams(tmdbId, mediaType, season, episode) {
  try {
    const settings = globalThis.SCRAPER_SETTINGS || {};
    const preferred = settings.preferredPlatform || "all";
    const tmdbType = mediaType === "tv" ? "tv" : "movie";

    const tmdbResp = await fetch(
      `https://api.themoviedb.org/3/${tmdbType}/${tmdbId}?api_key=${TMDB_API_KEY}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/121.0.0.0 Safari/537.36",
          Accept: "application/json"
        }
      }
    );

    const tmdbData = await tmdbResp.json();
    const title = mediaType === "tv" ? tmdbData?.name : tmdbData?.title;

    if (!title) throw new Error("Could not fetch title from TMDB");

    let platforms = ["netflix", "primevideo", "hotstar", "disney"];

    if (preferred !== "all") {
      platforms = [
        preferred,
        ...platforms.filter((p) => p !== preferred)
      ];
    }

    for (const platformKey of platforms) {
      try {
        const streams = await fetchFromPlatform(
          platformKey,
          PLATFORM_MAP[platformKey],
          title,
          mediaType,
          season,
          episode
        );

        if (streams?.length) return streams;
      } catch (e) {
        console.error(
          `[NetMirror] ${platformKey} failed:`,
          e?.message || e
        );
      }
    }

    return [];
  } catch (error) {
    console.error("[NetMirror] getStreams failed:", error?.message || error);
    return [];
  }
}

async function onSettings() {
  return [
    { type: "header", label: "Source Selection" },
    {
      type: "select",
      key: "preferredPlatform",
      label: "Preferred Streaming Source",
      description:
        "Select which platform to try first. If content isn't found, others will be searched as fallback.",
      options: [
        { label: "All Sources (Ordered)", value: "all" },
        { label: "Netflix", value: "netflix" },
        { label: "Prime Video", value: "primevideo" },
        { label: "Hotstar / Disney+", value: "hotstar" }
      ],
      defaultValue: "all"
    },
    { type: "header", label: "Advanced" },
    {
      type: "toggle",
      key: "forceHd",
      label: "Force HD Quality",
      description:
        "Attempts to force the player into HD mode when possible.",
      defaultValue: true
    }
  ];
}

module.exports = { getStreams, onSettings };
