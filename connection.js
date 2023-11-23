var mysql = require('mysql');
const util = require('util');
require('dotenv').config(); 

var con = mysql.createConnection({
    host: process.env.DATABASEHOST,
    user: process.env.DATABASEUSER,
    password: process.env.DATABASEPASSWORD,
    database: process.env.DATABASE
  });

try {
    con.connect(function(err) {
        if (err) throw err;
        console.log("Connected!");
    });
} catch (error) {
    console.log("Database connection failed: " + error.message);
}

setInterval(function(){ 
    if (con.state == false) {
        con.connect(function(err) {
            if (err) throw err;
            console.log("Connected!");
          });
    }
},60000)

const query = util.promisify(con.query).bind(con);

async function addToTranslationQueue(imdbid,season = null,episode = null,count,langcode) {
    try {
      if(season && episode){
        await query(`INSERT INTO translation_queue (series_imdbid,series_seasonno,series_episodeno,subcount,langcode) VALUES (?,?,?,?,?)`, [imdbid,season,episode,count,langcode]);
      }
      else{
        await query(`INSERT INTO translation_queue (series_imdbid,subcount,langcode) VALUES (?,?,?)`, [imdbid,count,langcode]);
      }
    } catch (error) {
      console.error('Add to translation queue error:', error.message);
    }
}

async function deletetranslationQueue(imdbid,season = null,episode = null,langcode) {
    try {
      if(season && episode){
        await query(
            `DELETE FROM translation_queue WHERE series_imdbid = ? AND series_seasonno = ? AND series_episodeno = ? AND langcode = ?`, [imdbid,season,episode,langcode]);
      }
      else{
        await query(
            `DELETE FROM translation_queue WHERE series_imdbid = ? AND langcode = ?`, [imdbid,langcode]);
      }
    } catch (error) {
      console.error('Delete translation queue error:', error.message);
    }
}

async function checkForTranslation(imdbid,season = null,episode = null,langcode){
    try {
        const result = await query('SELECT COUNT(*) AS count,subcount FROM translation_queue WHERE series_imdbid =? AND series_seasonno = ? AND series_episodeno = ? AND langcode = ?', [imdbid,season,episode,langcode]);
        const count = result[0].count;
        const subcount = result[0].subcount;

        if (count > 0) {
            return subcount;
        } else {
            return false;
        }
    }
    catch (error) {
        console.error('Check for translation error:', error.message);
    }
}

async function checkseries(imdbid){
    try {
        const result = await query('SELECT COUNT(*) AS count FROM series WHERE series_imdbid = ?', [imdbid]);
        const count = result[0].count;

        if (count > 0) {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.error('Checkseries error:', error);
    }
}

async function addseries(imdbid,type){
    try {
        let seriestype;
        if (type === 'series') {
            seriestype = 0;
        }
        else{
            seriestype = 1;
        }
        await query('INSERT INTO series(series_imdbid,series_type) VALUES (?,?)',[imdbid,seriestype]);
    } catch (error) {
        console.error('Add series error:', error);
    }
}

//CHECK SUBS 
async function getSubCount(imdbid,season,episode,langcode) {
    try {
        let count;
        if(season && episode){
            count = await query(`SELECT COUNT(*) AS count FROM subtitle WHERE series_imdbid = ? AND subtitle_seasonno = ? AND subtitle_episodeno = ? AND subtitle_langcode = ?`,[imdbid,season,episode,langcode]);
        }
        else{
            count = await query(`SELECT COUNT(*) AS count FROM subtitle WHERE series_imdbid = ? AND subtitle_langcode = ?`,[imdbid,langcode]);
        }
        return count[0].count;

    } catch (error) {
        console.error('Get sub count error:', error.message);
    }
}

async function addsubtitle(imdbid,type,season = null,episode = null,path,langcode){
    try {
        let seriestype;
        if (type === 'series') {
            seriestype = 0;
        }
        else{
            seriestype = 1;
        }
        await query('INSERT INTO subtitle(series_imdbid,subtitle_type,subtitle_seasonno,subtitle_episodeno,subtitle_langcode,subtitle_path) VALUES (?,?,?,?,?,?)',[imdbid,seriestype,season,episode,langcode,path]);
    } catch (error) {
        console.error('Add subtitle error:', error);
    }
}

async function getsubtitles(imdbid,season = null,episode = null,langcode){
    try {
        if(episode && season){
            const rows = await query(`SELECT subtitle_path FROM subtitle WHERE series_imdbid = ? AND subtitle_seasonno = ? AND subtitle_episodeno = ? AND subtitle_langcode = ?`,[imdbid,season,episode,langcode]);
            const paths = rows.map(row => row.subtitle_path);
            return paths;
        }
        else{
            const rows = await query(`SELECT subtitle_path FROM subtitle WHERE series_imdbid = ? AND subtitle_langcode = ?`,[imdbid,langcode]);
            const paths = rows.map(row => row.subtitle_path);
            return paths;
        }
    } catch (error) {
        console.error('Get subtitles error:', error.message);
    }
}

async function checksubtitle(imdbid,season = null,episode = null,subtitlepath,langcode){
    try {
        const result = await query('SELECT COUNT(*) AS count FROM subtitle WHERE series_imdbid = ? AND subtitle_seasonno = ? AND subtitle_episodeno = ? AND subtitle_path = ? AND subtitle_langcode = ?', [imdbid,season,episode,subtitlepath,langcode]);
        const count = result[0].count;

        if (count > 0) {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.error('Checkseries error:', error);
    }
}



module.exports = {addToTranslationQueue,deletetranslationQueue,getSubCount,checkseries,addseries,addsubtitle,getsubtitles,checkForTranslation,checksubtitle};