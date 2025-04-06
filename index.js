const express = require('express');
const { YoutubeTranscript } = require('youtube-transcript');
const app = express();
const port = process.env.PORT || 8080; 

app.get('/transcrever', async (req, res) => { 
    const videoId = req.query.id; 

    if (!videoId) {
        return res.status(400).json({ erro: "O parâmetro 'id' é obrigatório." });
    }

    try {
        let transcriptData;
        let fetchedLang = '';

        try {
            console.log(`Attempting to fetch transcript for video ${videoId} in Portuguese (pt)...`);
            transcriptData = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'pt' });
            fetchedLang = 'pt';
            console.log(`Successfully fetched Portuguese transcript for ${videoId}.`);
        } catch (ptError) {
            console.warn(`Could not fetch Portuguese transcript for ${videoId}: ${ptError.message}. Trying English (en)...`);

            try {
                transcriptData = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' });
                fetchedLang = 'en';
                console.log(`Successfully fetched English transcript for ${videoId}.`);
            } catch (enError) {
                console.error(`Could not fetch English transcript either for ${videoId}: ${enError.message}`);
                if (ptError.message?.includes('Could not retrieve transcript') && enError.message?.includes('Could not retrieve transcript')) {
                     throw new Error(`Nenhuma transcrição encontrada para o vídeo ${videoId} em Português ou Inglês.`);
                } else {
                    throw enError;
                }
            }
        }

        if (!transcriptData || transcriptData.length === 0) {
             throw new Error(`Transcrição encontrada (${fetchedLang}), mas está vazia.`);
        }

        const fullText = transcriptData.map(segment => segment.text).join(' ').trim();

        console.log(`Sending transcript for ${videoId} (fetched as ${fetchedLang}).`);
        res.json({ transcricao: fullText });

    } catch (error) {
        console.error(`Erro geral ao processar ${videoId}: ${error.message}`);
        res.status(500).json({ erro: `Erro ao obter a transcrição: ${error.message}` });
    }
});

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
    console.log(`Acesse a API em http://localhost:${port}/transcrever?id=VIDEO_ID_AQUI`);
});