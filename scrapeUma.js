function scrapeUmaJSON() {
  const base = "https://gametora.com/umamusume/racetracks";
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  sheet.clear();
  sheet.appendRow(["Track", "Distance", "Spurt Start", "Last Corner Start", "Final Straight Start"]);

  // Step 1: Get build ID from main page
  const mainHtml = UrlFetchApp.fetch(base).getContentText();
  const buildMatch = mainHtml.match(/"buildId":"([^"]+)"/);
  if (!buildMatch) {
    Logger.log("Build ID not found.");
    return;
  }

  const buildId = buildMatch[1];

  // Step 2: Get track slugs
  const slugRegex = /\/umamusume\/racetracks\/([a-z0-9-]+)/g;
  let match;
  let tracks = new Set();

  while ((match = slugRegex.exec(mainHtml)) !== null) {
    tracks.add(match[1]);
  }

  // Step 3: Fetch JSON per track
  tracks.forEach(slug => {
    const jsonUrl = `https://gametora.com/_next/data/${buildId}/umamusume/racetracks/${slug}.json`;
    const response = UrlFetchApp.fetch(jsonUrl, { muteHttpExceptions: true });

    if (response.getResponseCode() !== 200) return;

    const data = JSON.parse(response.getContentText());

    const raceData = data.pageProps?.raceTrack;
    if (!raceData || !raceData.distances) return;

    raceData.distances.forEach(dist => {
      const distance = dist.distance + "m";

      const spurtStart = dist.spurt?.start ?? "";
      const finalStraightStart = dist.finalStraight?.start ?? "";

      let lastCornerStart = "";
      if (dist.corners && dist.corners.length > 0) {
        const lastCorner = dist.corners[dist.corners.length - 1];
        lastCornerStart = lastCorner.start;
      }

      sheet.appendRow([
        slug,
        distance,
        spurtStart,
        lastCornerStart,
        finalStraightStart
      ]);
    });
  });

  Logger.log("Done!");
}
