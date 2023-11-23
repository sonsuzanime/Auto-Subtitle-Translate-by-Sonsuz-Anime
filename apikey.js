const axios = require('axios');

async function checkapikey(apikey){
    const options = {
        method: 'POST',
        url: 'https://microsoft-translator-text.p.rapidapi.com/translate',
        params: {
        'to[0]': 'tr',
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
        data: [{Text: ''}]
    };

    try {
        const response = await axios.request(options);
        const remainingCharacters = response.headers['x-ratelimit-characters-remaining'];

        return remainingCharacters !== undefined ? remainingCharacters : 0;
    } catch (error) {
        if (error.response && error.response.status === 429) {
            return 0;
        } else {
            return false;
        }
    }
}

module.exports = { checkapikey };