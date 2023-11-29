const opensubtitles = require("./opensubtitles");
const connection = require("./connection");
const axios = require('axios');
const fs = require('fs').promises;

let subcounts = [];
let timecodes = [];
let texts = [];
let translatedSubtitle = [];

async function translatebatch(subtitleBatch, apikey,oldisocode) {
  let myObjectArray = subtitleBatch.map(text => ({ Text: text }));
  const options = {
    method: 'POST',
    url: 'https://microsoft-translator-text.p.rapidapi.com/translate',
    params: {
      'to[0]': oldisocode,
      'api-version': '3.0',
      profanityAction: 'NoAction',
      textType: 'plain'
    },
    headers: {
      'Accept-Encoding': 'zlib',
      'content-type': 'application/json',
      'X-RapidAPI-Key': apikey,
      'X-RapidAPI-Host': 'microsoft-translator-text.p.rapidapi.com'
    },
    data: JSON.stringify(myObjectArray)
  };
  try {
    const response = await axios.request(options);
    response.data.forEach(entry => {
      const translatedText = entry.translations[0].text;
      translatedSubtitle.push(translatedText);
    });
    console.log("Batch translated");
  } catch (error) {
    console.error("Batch translate error:", error.message);
    throw error;
  }
}

async function savetranslatedsubs(count, imdbid, season = null, episode = null,oldisocode) {
  let newSubtitleFilePath = null;
  let type = null;
  if (season && episode) {
    newSubtitleFilePath = `subtitles/${oldisocode}/${imdbid}/season${season}/${imdbid}-translated-${episode}-${count}.srt`;
    type = 'series';
  } else {
    newSubtitleFilePath = `subtitles/${oldisocode}/${imdbid}/${imdbid}-translated-${count}.srt`;
    type = 'movie';
  }
  const output = [];

  for (let i = 0; i < subcounts.length; i++) {
    output.push(subcounts[i]);
    output.push(timecodes[i]);
    output.push(translatedSubtitle[i]);
    output.push('');
  }

  try {
    await fs.appendFile(newSubtitleFilePath, output.join('\n'), { flag: 'a' });
    if (!(await connection.checkseries(imdbid))) {
      await connection.addseries(imdbid, type);
    }
    if (!(await connection.checksubtitle(imdbid, season, episode, newSubtitleFilePath,oldisocode))) {
      await connection.addsubtitle(imdbid, type, season, episode, newSubtitleFilePath,oldisocode);
    }
    console.log(`Subtitles translated and saved: ${newSubtitleFilePath}`);
  } catch (error) {
    console.error('Error writing to file:', error.message);
  }
}

async function checkremainingapi(subtitles, imdbid, season = null, episode = null, oldisocode, apikey, apikeyremaining) {
  let filepaths = await opensubtitles.downloadSubtitles(subtitles, imdbid, season, episode, oldisocode);
  console.log(filepaths);
  let totalCharacterCount = 0;
  for (let index = 0; index < filepaths.length; index++) {
    const originalSubtitleFilePath = filepaths[index];
    try {
      const originalSubtitleContent = await fs.readFile(originalSubtitleFilePath, { encoding: 'utf-8' });
      const lines = originalSubtitleContent.split('\n');
      let iscount = true;
      let istimecode = false;
      let istext = false;
      let characters = [];
      let textcount = 0;
      let count = 0;
      for (let line of lines) {
          count++;
          if (line.trim() === '') {
            iscount = true;
            istimecode = false;
            istext = false;
            textcount = 0;
          } else if (iscount === true) {
            iscount = false;
            istimecode = true;
          } else if (istimecode === true) {
            istimecode = false;
            istext = true;
          } else if (istext === true) {
            if (textcount === 0) {
              characters.push(line);
            } else {
              characters[characters.length - 1] += " \n"+ line;
            }
            textcount++;
          }
      }
      characters.forEach(character => {
        totalCharacterCount += character.length;
      });
    } catch (error) {
      console.log("Check remaining api error", error.message);
    }
  }
  console.log(totalCharacterCount);
  if (apikeyremaining > totalCharacterCount) {
    main(imdbid, season, episode, oldisocode, apikey, filepaths);
    return true;
  } else {
    return false;
  }
}

async function processsubtitles(filepath, imdbid, season = null, episode = null,oldisocode,apikey) {
  const totalsubcount = await connection.getSubCount(imdbid, season, episode,oldisocode);
  for (let index = 0; index < filepath.length; index++) {
    const originalSubtitleFilePath = filepath[index];
    try {
      const originalSubtitleContent = await fs.readFile(originalSubtitleFilePath, { encoding: 'utf-8' });
      const lines = originalSubtitleContent.split('\n');

      const batchSize = 25;
      let subtitleBatch = [];
      let iscount = true;
      let istimecode = false;
      let istext = false;
      let textcount = 0;
      let count = 0;
      for (const line of lines) {
        count++;
        if (line.trim() === '') {
          iscount = true;
          istimecode = false;
          istext = false;
          textcount = 0;
          subtitleBatch.push(texts[texts.length - 1]);
          if (subtitleBatch.length === batchSize) {
            try {
              await translatebatch(subtitleBatch, apikey,oldisocode);
              subtitleBatch = [];
            } catch (error) {
              console.error("Translate batch error: ",error);
              subcounts = [];
              timecodes = [];
              texts = [];
              translatedSubtitle = [];
              subtitleBatch = [];
              return false;
            }
          }
        } else if (iscount === true) {
          subcounts.push(line);
          iscount = false;
          istimecode = true;
        } else if (istimecode === true) {
          timecodes.push(line);
          istimecode = false;
          istext = true;
        } else if (istext === true) {
          if (textcount === 0) {
            texts.push(line);
          } else {
            texts[texts.length - 1] += " \n"+ line;
          }
          textcount++;
        }
      }
      if (subtitleBatch.length !== 0) {
        try {
          subtitleBatch.push(texts[texts.length - 1]);
          await translatebatch(subtitleBatch, apikey,oldisocode);
          subtitleBatch = [];
        } catch (error) {
          console.log("Subtitle batch error: ",error);
          subcounts = [];
          timecodes = [];
          texts = [];
          translatedSubtitle = [];
          subtitleBatch = [];
          return false;
        }
      }
      try {
        let currentCount = 0;
        if(totalsubcount !== null && totalsubcount !== 0) {
          currentCount = index + totalsubcount + 1;
        }
        else{
          currentCount = index + 1;

        }
        console.log("Current count: " + currentCount);
        if (currentCount !== 0) {
          await savetranslatedsubs(currentCount, imdbid, season, episode, oldisocode);
          console.log("current count: " + currentCount);
        }
      } catch (error) {
        console.error("Translate batch error: ",error);
      }

      subcounts = [];
      timecodes = [];
      texts = [];
      translatedSubtitle = [];
      
    } catch (error) {
      console.error('Error:', error.message);
    }
  }
}

async function main(imdbid, season = null, episode = null, oldisocode, apikey, filepaths) {
  try {
    if (filepaths) {
      await connection.addToTranslationQueue(imdbid, season, episode, filepaths.length,oldisocode);

      try {
        await processsubtitles(filepaths, imdbid, season, episode, oldisocode, apikey);
      } catch (error) {
        await connection.deletetranslationQueue(imdbid, season, episode,oldisocode);
        console.error("Error on processing subtitles:", error.message);
      }

      await connection.deletetranslationQueue(imdbid, season, episode,oldisocode);
    } else {
      console.log('No subtitles found');
    }
  } catch (error) {
    console.error("Error on processing subtitles:", error.message);
  }
}

module.exports = { checkremainingapi };
