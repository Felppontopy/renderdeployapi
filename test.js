const { getSubtitles } = require('youtube-captions-scraper');

getSubtitles({ videoID: 'tNpoc86cHrQ', lang: 'en' }) // Tente 'en' ou 'pt'
  .then(captions => {
    // console.log(captions);
    const transcriptText = captions.map(entry => entry.text).join(' ');
    console.log(transcriptText); 
  })
  .catch(error => {
    console.error("Erro com youtube-captions-scraper:", error); 
  });