THE PROJECT HAS BEEN DEPRECATED BECAUSE OF THE API THAT I WAS USING IS NOT WORKING ANYMORE. CHECK OUT MY NEW DEEPL AUTO SUBTITLE TRANSLATE ADDON! 

https://github.com/osmansonsuz/Auto-Subtitle-Translate-by-SonsuzAnime-DeepL



# Addon Link
https://stremioaddon.sonsuzanime.com

# Auto-Subtitle-Translate-by-Sonsuz-Anime
This is an auto subtitle translate addon for Stremio application using RapidAPI Microsoft Translator API.

# How the addon works ?
It searchs OpensubtitlesV3 addon for your language.If desired language subtitle exists it returns a sub exists subfile.
If there is no subs for desired language it looks up my database to see if that language exists in my database.If it exists in my database it gives you that translated subfile.
If it doesn't exists it starts to translate 1 subfile with your api key then store it in my server.If you are the first one to translate that subfile you will be given 2 sub choice;
1: Information sub file which is this;
Your subtitle is now being translated. It will take about 30 seconds.
After about 30 seconds, if you select the subtitle, it will appear.
2: After you waited about 30 seconds if you choose this sub it will be your translated sub.

# How to get RapidAPI-Key ?
https://stremioaddon.sonsuzanime.com/subtitles/how-to-get-api-key.pdf

# Usage
You have to configure addon to use. After you get your RapidAPI-Key paste it in configuration page then select your desired language.

# Errors

## Apikey error.Make sure that you are subscribed to the API.And make sure that you havent exceeded your monthly quota.
This means that your apikey is wrong or your 500.000 CHARACTER quota exceeded.

## No subtitles were found or the original subtitles are available in the OpenSubtitlesV3 addon.
This means that no subtitles found in my database or no subtitles were found on OpenSubtitlesV3 addon.
