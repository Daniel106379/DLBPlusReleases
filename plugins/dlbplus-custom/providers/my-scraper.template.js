/**
 * DLBPlus / Nuvio plugin scraper template — see DLBPlusFrontend plugins/dlbplus-custom/providers/my-scraper.template.js
 * Copy to my-scraper.js and implement getStreams().
 */
async function getStreams(tmdbId, mediaType, season, episode) {
  console.log('[my-scraper] template — implement me', tmdbId, mediaType, season, episode);
  return [];
}
module.exports = { getStreams };
