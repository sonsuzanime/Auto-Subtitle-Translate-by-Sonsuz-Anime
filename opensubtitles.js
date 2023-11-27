const axios = require('axios');
const connection = require("./connection");
const fs = require('fs').promises;

const opensubtitlesbaseurl = 'https://opensubtitles-v3.strem.io/subtitles/';

const downloadSubtitles = async (subtitles,imdbid,season = null,episode = null,oldisocode) => {
  let uniqueTempFolder = null;
  if (season && episode){
    await fs.mkdir(`subtitles/${oldisocode}/${imdbid}/season${season}`, { recursive: true });
    uniqueTempFolder = `subtitles/${oldisocode}/${imdbid}/season${season}`;
  }
  else{
    await fs.mkdir(`subtitles/${oldisocode}/${imdbid}`, { recursive: true });
    uniqueTempFolder = `subtitles/${oldisocode}/${imdbid}`;
  }
  
  let filepaths = [];

  for (let i = 0; i < subtitles.length; i++) {
    const url = subtitles[i];
    try {
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      let filePath = null;
      if(episode)
      {
        filePath = `${uniqueTempFolder}/${imdbid}-subtitle_${episode}-${i + 1}.srt`;
      }
      else{
        filePath = `${uniqueTempFolder}/${imdbid}-subtitle-${i + 1}.srt`;
      }
      console.log(filePath);
      await fs.writeFile(filePath, response.data);
      console.log(`Subtitles downloaded and saved: ${filePath}`);
      filepaths.push(filePath);
    } catch (error) {
      console.error(`Subtitle download error: ${error.message}`);
    }
  }
  return filepaths;
};

const getsubtitles = async (type, imdbid, season = null, episode = null,newisocode) => {
  let url = opensubtitlesbaseurl;

  if (type === 'series') {
    url = url.concat(type, '/', imdbid, ':', season, ':', episode, '.json');
  } else {
    url = url.concat(type,'/' ,imdbid, '.json');
  }

  console.log(url);

  try {
    const response = await axios.get(url);
    if (response.data.subtitles.length>0) {
      if(response.data.subtitles.filter(subtitle => subtitle.lang === newisocode).length > 0)
      {
        return null;
      }
      else{
        let subtitles = response.data.subtitles
        .filter(subtitle => subtitle.lang === 'eng')
        .map(subtitle => subtitle.url);
        if(subtitles.length === 0){
          subtitles = [response.data.subtitles[0].url]
          
        }
        return subtitles.slice(0, 1);
        
      }  
    }
    else{
      return null;
    }
    
  } catch (error) {
    console.error('Subs url error:', error);
    return null;
  }
};




module.exports = { getsubtitles, downloadSubtitles};
