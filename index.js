const express = require('express');
// Remove: const { YoutubeTranscript } = require('youtube-transcript');
const { getSubtitles } = require('youtube-captions-scraper'); // Apenas esta biblioteca
const app = express();
const port = process.env.PORT || 8080;

app.get('/transcrever', async (req, res) => {
    const videoId = req.query.id;

    if (!videoId) {
        return res.status(400).json({ erro: "O parâmetro 'id' é obrigatório." });
    }

    let fetchedLang = ''; // Para saber qual língua funcionou

    try { // Bloco try principal

        // --- TENTATIVA 1: youtube-captions-scraper (en) ---
        try {
            console.log(`[Scraper] Tentando buscar legenda (en) para ${videoId}...`);
            const captionsEn = await getSubtitles({ videoID: videoId, lang: 'en' });

            // Verifica se obteve legendas e se não estão vazias
            if (captionsEn && captionsEn.length > 0) {
                const fullText = captionsEn.map(entry => entry.text).join(' ').trim();
                // Verifica se o texto concatenado não está vazio
                if (fullText) {
                    console.log(`[Scraper] Sucesso ao buscar legenda (en) para ${videoId}.`);
                    fetchedLang = 'en';
                    // Envia a resposta e PARA a execução da função aqui
                    return res.json({ transcricao: fullText, lang: fetchedLang });
                } else {
                    // Encontrou a legenda mas ela veio vazia (raro, mas possível)
                    console.warn(`[Scraper] Legenda (en) encontrada para ${videoId}, mas o texto está vazio. Tentando Português (pt)...`);
                    // Não retorna, continua para tentar 'pt'
                }
            } else {
                // Não encontrou legendas em inglês
                console.warn(`[Scraper] Nenhuma legenda (en) encontrada para ${videoId}. Tentando Português (pt)...`);
                 // Não retorna, continua para tentar 'pt'
            }
        } catch (scraperEnError) {
            // Erro ao tentar buscar em inglês
            console.warn(`[Scraper] Falha ao buscar legenda (en) para ${videoId}: ${scraperEnError.message}. Tentando Português (pt)...`);
             // Não retorna, continua para tentar 'pt'
        }


        // --- TENTATIVA 2: youtube-captions-scraper (pt) ---
        // Só chega aqui se a tentativa em Inglês falhou, retornou vazio ou deu erro
        try {
            console.log(`[Scraper] Tentando buscar legenda (pt) para ${videoId}...`);
            const captionsPt = await getSubtitles({ videoID: videoId, lang: 'pt' });

            // Verifica se obteve legendas e se não estão vazias
            if (captionsPt && captionsPt.length > 0) {
                const fullText = captionsPt.map(entry => entry.text).join(' ').trim();
                 // Verifica se o texto concatenado não está vazio
                if (fullText) {
                    console.log(`[Scraper] Sucesso ao buscar legenda (pt) para ${videoId}.`);
                    fetchedLang = 'pt';
                     // Envia a resposta e PARA a execução da função aqui
                    return res.json({ transcricao: fullText, lang: fetchedLang });
                } else {
                     // Encontrou a legenda mas ela veio vazia
                    console.warn(`[Scraper] Legenda (pt) encontrada para ${videoId}, mas o texto está vazio.`);
                     // Ambas as tentativas (en/pt) falharam ou retornaram vazio. Lança erro.
                    throw new Error(`Nenhuma transcrição válida encontrada ou retornada vazia (en/pt) para ${videoId}.`);
                }
            } else {
                // Não encontrou legendas em português
                console.warn(`[Scraper] Nenhuma legenda (pt) encontrada para ${videoId}.`);
                 // Ambas as tentativas (en/pt) falharam. Lança erro.
                throw new Error(`Nenhuma transcrição encontrada (en/pt) para ${videoId}.`);
            }
        } catch (scraperPtError) {
            // Erro ao tentar buscar em português (após falha em inglês)
            console.error(`[Scraper] Falha ao buscar legenda (pt) também para ${videoId}: ${scraperPtError.message}`);
             // Ambas as tentativas falharam. Lança erro final.
            throw new Error(`Falha ao buscar legendas (en/pt). Último erro (pt): ${scraperPtError.message}`);
        }

    } catch (error) { // Bloco CATCH principal
        // Captura qualquer erro lançado durante as tentativas
        console.error(`Erro final no processamento de ${videoId}: ${error.message}`);
        res.status(500).json({ erro: `Erro ao obter a transcrição: ${error.message}` });
    }
});

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
    console.log(`Acesse a API em http://localhost:${port}/transcrever?id=VIDEO_ID_AQUI`);
});