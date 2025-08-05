const fetch = require('node-fetch');

async function fetchWithRetry(url, options = {}, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fetch(url, options);
    }
    catch (err) {
      if (attempt === retries - 1)
        throw err;
      
      await new Promise(r => setTimeout(r, 1000)); // wait before retry
    }
  }
}

async function tryParseAdditionalChannelData(url) {
  const response = await fetch(url);
  const responseText = await response.text();
  const channelFeedMatches = [...responseText.matchAll(/https:\/\/www\.youtube\.com\/feeds\/videos\.xml\?channel_id=(UC|UU|PL|LL|FL)[\w-]{10,}/g)];

  const channelInfo = {};

  if (channelFeedMatches.length > 0 && channelFeedMatches[0][0]) {
    channelInfo.playlist_id = channelFeedMatches[0][0].match(/(UC|UU|PL|LL|FL)[\w-]{10,}/)[0].replace(/^UC/, 'UU');
  }

  // Also grep the channel thumbnail from the HTML source code (which could also be done for description, etc in the future)
  const channelThumbnailMatch = /"avatarViewModel":{"image":{"sources":(?<avatar_array>\[[^\]]+\])/.exec(responseText);
  if (channelThumbnailMatch) {
    const avatarArray = JSON.parse(channelThumbnailMatch.groups.avatar_array);
    channelInfo.thumbnail = avatarArray.find(a => a.width === 160)?.url ?? avatarArray[0].url;
  }

  const channelBannerMatch = /"imageBannerViewModel":{"image":{"sources":(?<banner_array>\[[^\]]+\])/.exec(responseText);
  if (channelBannerMatch) {
    const bannerArray = JSON.parse(channelBannerMatch.groups.banner_array);
    channelInfo.banner = bannerArray.find(b => b.height === 424)?.url ?? bannerArray[0].url;
  }

  return channelInfo;
}

module.exports = { fetchWithRetry, tryParseAdditionalChannelData }