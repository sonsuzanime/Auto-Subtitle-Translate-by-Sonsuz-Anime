# ytssubs
A Node.js API for yifysubtitles.com

[![NPM](https://nodei.co/npm/ytssubs.png)](https://www.npmjs.com/package/ytssubs)

## Installation
* `npm install ytssubs`

## Usage

Get subtitles list by IMDB id

```javascript
const ytssubs = require('ytssubs')

ytssubs.getSubs('tt1192628', (err, results) => { // also works without 'tt'
  console.log(results)
})

/*
{ langs:
   [ 'Arabic', 'Brazilian Portuguese', 'Chinese', 'Dutch', 'English', 'Farsi/Persian', 'Finnish', 'French', 'Greek', 'Hebrew', 'Indonesian', 'Italian', 'Korean', 'Malay', 'Norwegian', 'Romanian', 'Serbian', 'Spanish' ],
  subs_count: 25,
  subs:
   [ { lang: 'English',
       name: 'Rango',
       url: 'http://www.yifysubtitles.com/subtitle/rango-english-yify-1787.zip',
       uploader: 'sub',
       rating: '6' },
     { lang: 'Arabic',
       name: 'Rango',
       url: 'http://www.yifysubtitles.com/subtitle/rango-arabic-yify-1786.zip',
       uploader: 'sub',
       rating: '3' } ...etc
   ]
}
*/
```

Download subtitles by URL

```javascript
const ytssubs = require('ytssubs')

ytssubs.downloadSubs('http://www.yifysubtitles.com/subtitle/rango-english-yify-1787.zip', `${__dirname}/subs`}, () => {
  console.log('Your subtitle has been downloaded')
})

/*
You have to provide a file path
The subtitle is downloaded as .srt.
*/
```

## Packages
* [request](https://github.com/request/request)
* [cheerio](https://github.com/cheeriojs/cheerio)
* [extract-zip](https://github.com/maxogden/extract-zip)

## License
This project is licensed under The MIT License (MIT). Which means that you can use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the software. But you always need to state that Mike Kokkolios is the original author of this template.

Project is developed and maintained by [Mike Kokkolios](https://www.linkedin.com/in/michael-kokkolios).
