const {
  addonBuilder,
  serveHTTP,
  publishToCentral,
} = require("stremio-addon-sdk");
const processfiles = require("./processfiles");
const opensubtitles = require("./opensubtitles");
var express = require("express");
const connection = require("./connection");
const languages = require("./languages");
const apikey = require("./apikey");

const builder = new addonBuilder({
  id: "org.autotranslate.sonsuzanime",
  version: "1.0.1",
  name: "Auto Subtitle Translate by SonsuzAnime",
  logo: "./subtitles/logo.png",
  configurable: true,
  behaviorHints: {
    configurable: true,
    configurationRequired: true,
  },
  config: [
    {
      key: "translateto",
      title: "Translate to",
      type: "select",
      required: true,
      options: languages.getAllValues(),
    },
    {
      key: "apikey",
      title: "RapidAPI Microsoft Translate API Key",
      type: "text",
      required: true,
    },
  ],
  description:
    "This addon takes subtitles from OpenSubtitlesV3 then translates into desired language.For donations: https://www.buymeacoffee.com/sonsuzosman Bug report: infinity@sonsuzanime.com",
  types: ["series", "movie"],
  catalogs: [],
  resources: ["subtitles"],
});

builder.defineSubtitlesHandler(async function (args) {
  const { id, config } = args;
  const oldisocode = languages.getKeyFromValue(config.translateto);
  let iso692 = languages.getnewisocode(oldisocode);
  if (iso692 === undefined) {
    iso692 = oldisocode;
  }
  let imdbid = null;
  if (id !== null && id.startsWith("tt")) {
    const parts = id.split(":");
    if (parts.length >= 1) {
      imdbid = parts[0];
    } else {
      console.log("Invalid ID format.");
    }
  } else {
    imdbid = null;
  }
  const { type, season = null, episode = null } = parseId(id);
  const apikeyremaining = await apikey.checkapikey(config.apikey);
  console.log(
    "Api key:",
    config.apikey,
    "Api key remaining:",
    apikeyremaining,
    "oldisocode:",
    oldisocode,
    "iso692:",
    iso692
  );
  if (config.apikey !== undefined && apikeyremaining !== false) {
    if (imdbid !== null) {
      //if episode is not in translation queue
      const translatecheck = await connection.checkForTranslation(
        imdbid,
        season,
        episode,
        oldisocode
      );
      if (translatecheck === false) {
        const paths = await connection.getsubtitles(
          imdbid,
          season,
          episode,
          oldisocode
        ); //array may be empty,may be null
        if (await connection.checkseries(imdbid)) {
          if (paths !== null && paths.length > 0) {
            const subtitle = await fetchSubtitles(
              imdbid,
              season,
              episode,
              paths.length,
              type,
              iso692
            );
            console.log(
              "Incoming episode:",
              imdbid,
              "Type:",
              type,
              "Season:",
              season,
              "Episode:",
              episode,
              "Sub count:",
              paths.length
            );

            if (subtitle.length > 0 && subtitle !== null) {
              console.log("Sent subtitle:", subtitle);
              return Promise.resolve({ subtitles: subtitle });
            } else {
              console.log("Subtitle fetch error:");

              return Promise.resolve({ subtitles: [] });
            }
          }
          //if subtitle is not on the database
          else {
            const subs = await opensubtitles.getsubtitles(
              type,
              imdbid,
              season,
              episode,
              iso692
            );
            console.log(
              "Incoming episode:",
              imdbid,
              "Type:",
              type,
              "Season:",
              season,
              "Episode:",
              episode
            );
            if (subs !== null && subs.length > 0) {
              console.log(
                "No subs at database, opensubtitles sub found: ",
                subs
              );
              if (
                !(await processfiles.checkremainingapi(
                  subs,
                  imdbid,
                  season,
                  episode,
                  oldisocode,
                  config.apikey,
                  apikeyremaining
                ))
              ) {
                let subtitles = [];
                const subtitle = {
                  id: `Apikey error`,
                  url: `https://stremioaddon.sonsuzanime.com/subtitles/apikeyerror.srt`,
                  lang: iso692,
                };
                subtitles.push(subtitle);
                console.log(
                  "Remaining api key is not enough for translate: ",
                  subtitles
                );
                return Promise.resolve({ subtitles: subtitles });
              } else {
                let subtitles = [];
                const subtitle = {
                  id: `Information`,
                  url: `https://stremioaddon.sonsuzanime.com/subtitles/information.srt`,
                  lang: iso692,
                };
                subtitles.push(subtitle);
                let translatedsubs = await fetchSubtitles(
                  imdbid,
                  season,
                  episode,
                  subs.length,
                  type,
                  iso692
                );
                translatedsubs.forEach((sub) => {
                  subtitles.push(sub);
                });
                console.log(
                  "Sent subtitles(In subtitle not found on database and process has started.)",
                  subtitles
                );
                return Promise.resolve({ subtitles: subtitles });
              }
            } else {
              console.log(
                "No subtitles at database, opensubtitles sub not found or original sub found."
              );
              const subtitle = [
                {
                  id: `Not found`,
                  url: `https://stremioaddon.sonsuzanime.com/subtitles/notfound.srt`,
                  lang: iso692,
                },
              ];
              return Promise.resolve({ subtitles: subtitle });
            }
          }
        }
        //if serie/movie is not on the database
        else {
          //subtitle process will begin
          console.log("Serie/movie is not in database");
          console.log(
            "Incoming episode:",
            imdbid,
            "Type:",
            type,
            "Season:",
            season,
            "Episode:",
            episode
          );
          const subs = await opensubtitles.getsubtitles(
            type,
            imdbid,
            season,
            episode,
            iso692
          );
          if (subs !== null && subs.length > 0) {
            console.log(
              "No serie/movie at database, opensubtitles sub found: ",
              subs
            );
            if (
              !(await processfiles.checkremainingapi(
                subs,
                imdbid,
                season,
                episode,
                oldisocode,
                config.apikey,
                apikeyremaining
              ))
            ) {
              let subtitles = [];
              const subtitle = {
                id: `Apikey error`,
                url: `https://stremioaddon.sonsuzanime.com/subtitles/apikeyerror.srt`,
                lang: iso692,
              };
              subtitles.push(subtitle);
              console.log(
                "Remaining api key is not enough for translate: ",
                subtitles
              );
              return Promise.resolve({ subtitles: subtitles });
            } else {
              let subtitles = [];
              const subtitle = {
                id: `Information`,
                url: `https://stremioaddon.sonsuzanime.com/subtitles/information.srt`,
                lang: iso692,
              };
              subtitles.push(subtitle);
              let translatedsubs = await fetchSubtitles(
                imdbid,
                season,
                episode,
                subs.length,
                type,
                iso692
              );
              translatedsubs.forEach((sub) => {
                subtitles.push(sub);
              });
              console.log(
                "Sent subtitles(In serie/movie not found on database and process has started.)",
                subtitles
              );
              return Promise.resolve({ subtitles: subtitles });
            }
          } else {
            console.log(
              "No series/movie at database, opensubtitles sub not found or original sub found."
            );
            const subtitle = [
              {
                id: `Not found`,
                url: `https://stremioaddon.sonsuzanime.com/subtitles/notfound.srt`,
                lang: iso692,
              },
            ];
            return Promise.resolve({ subtitles: subtitle });
          }
        }
      } else {
        let subtitles = [];
        const subtitle = {
          id: `Information`,
          url: `https://stremioaddon.sonsuzanime.com/subtitles/information.srt`,
          lang: iso692,
        };
        subtitles.push(subtitle);
        let translatedsubs = await fetchSubtitles(
          imdbid,
          season,
          episode,
          translatecheck.length,
          type,
          iso692
        );
        translatedsubs.forEach((sub) => {
          subtitles.push(sub);
        });
        console.log(
          "Translation begin by someone else sent subtitles:",
          subtitles
        );
        return Promise.resolve({ subtitles: subtitles });
      }
    } else {
      console.log("Invalid id");

      return Promise.resolve({ subtitles: [] });
    }
  } else {
    console.log("Invalid apikey: ", config.apikey);
    let subtitles = [];
    const subtitle = {
      id: `Apikey error`,
      url: `https://stremioaddon.sonsuzanime.com/subtitles/apikeyerror.srt`,
      lang: iso692,
    };
    subtitles.push(subtitle);
    console.log("Invalid apikey apikeyerror returned: ", subtitles);
    return Promise.resolve({ subtitles: subtitles });
  }
});

async function fetchSubtitles(
  imdbid,
  season = null,
  episode = null,
  count,
  type,
  langcode
) {
  const subtitles = [];
  let oldisocode = languages.getoldisocode(langcode);
  if (oldisocode === undefined) {
    oldisocode = langcode;
  }
  if (type === "movie") {
    for (let i = 1; i <= count; i++) {
      const subtitle = {
        id: `${imdbid}-subtitle-${i}`,
        url: `https://stremioaddon.sonsuzanime.com/subtitles/${oldisocode}/${imdbid}/${imdbid}-translated-${i}.srt`,
        lang: langcode,
      };
      subtitles.push(subtitle);
    }
  } else {
    for (let i = 1; i <= count; i++) {
      const subtitle = {
        id: `${imdbid}-${season}-${episode}subtitle-${i}`,
        url: `https://stremioaddon.sonsuzanime.com/subtitles/${oldisocode}/${imdbid}/season${season}/${imdbid}-translated-${episode}-${i}.srt`,
        lang: langcode,
      };
      subtitles.push(subtitle);
    }
  }

  return subtitles;
}

function parseId(id) {
  if (id.startsWith("tt")) {
    const match = id.match(/tt(\d+):(\d+):(\d+)/);
    if (match) {
      const [, , season, episode] = match;
      return {
        type: "series",
        season: Number(season),
        episode: Number(episode),
      };
    } else {
      return { type: "movie" };
    }
  } else {
    return { type: "unknown", season: 0, episode: 0 };
  }
}

publishToCentral("https://stremioaddon.sonsuzanime.com/manifest.json");

const port = process.env.PORT || 3000;
const address = process.env.ADDRESS || "0.0.0.0";

serveHTTP(builder.getInterface(), {
  cacheMaxAge: 10,
  port: port,
  address: address,
  static: "/subtitles",
});
