import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();
app.use(bodyParser.json());
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

// -------------------
// Fluxo da conversa
// -------------------
const conversationFlow = {
    "start": {
        "text": "Oi, tudo bem? 😊 Tô animada pra te conhecer e curtir um papo leve e divertido. Preparado pra começar?",
        "options": [
            { "title": "Tô dentro!", "next": "node1" },
            { "title": "Conta mais!", "next": "node1" }
        ]
    },
    "node1": {
        "text": "Que bom te ver por aqui! 😄 Como tá sendo seu dia? Tô a fim de um papo descontraído, talvez com uma pitada de ousadia... 😏 O que acha?",
        "options": [
            { "title": "Quero um papo ousado!", "next": "node2a" },
            { "title": "Vamos conversar mais", "next": "node2b" }
        ]
    },
    "node2a": {
        "text": "Amei essa energia! 😈 Quer apimentar um pouco? Tenho uma foto bem legal que posso compartilhar pra deixar o clima mais interessante. Topa?",
        "options": [
            { "title": "Manda a foto!", "next": "node_photo" },
            { "title": "Quero algo mais!", "next": "node3" }
        ]
    },
    "node2b": {
        "text": "Beleza, vamos no seu ritmo! 😊 Quer falar sobre algo divertido ou tá a fim de esquentar o papo com algo mais... especial? Quem sabe uma foto pra te animar?",
        "options": [
            { "title": "Mostra a foto!", "next": "node_photo" },
            { "title": "Só conversa por enquanto", "next": "node2b_extra" }
        ]
    },
    "node2b_extra": {
        "text": "Tudo bem, vamos curtir um papo leve então! 😄 Só pra te dar um gostinho, já imaginou uma foto minha com uma vibe bem descontraída e charmosa? 😏 Quer ver?",
        "options": [
            { "title": "Quero ver a foto!", "next": "node_photo" },
            { "title": "Quero algo mais quente", "next": "node3" }
        ]
    },
    "node_photo": {
        "text": "Olha só essa foto! 🔥 Gostou? Tenho mais coisas legais pra compartilhar, quer continuar nessa vibe?",
        "image": "https://img.sexgram.ru/wp-content/uploads/2022/07/xmednisx-005-SexGram.ru_-scaled.jpg",
        "options": [
            { "title": "Amei, quero mais!", "next": "node3" },
            { "title": "Tá ficando bom!", "next": "node3" }
        ]
    },
    "node3": {
        "text": "Tô adorando nosso papo! 😍 Quer ver mais fotos ou prefere que eu conte uma história bem interessante pra te deixar no clima?",
        "options": [
            { "title": "Mais fotos, por favor!", "next": "node4a" },
            { "title": "Conta uma história!", "next": "node4b" }
        ]
    },
    "node4a": {
        "text": "Boa! 😘 Tenho umas fotos que vão te deixar com um sorrisinho no rosto. Quer ver uma agora ou prefere que eu te conte o que tem de especial nelas?",
        "options": [
            { "title": "Manda agora!", "next": "node_photo2" },
            { "title": "Conta mais!", "next": "node4a_desc" }
        ]
    },
    "node4a_desc": {
        "text": "Imagina uma foto com uma vibe bem sensual, luz suave, e um olhar que te puxa pra dentro... 😏 Pronto pra ver de verdade?",
        "options": [
            { "title": "Quero a foto!", "next": "node_photo2" }
        ]
    },
    "node4b": {
        "text": "Adoro uma boa história! 😈 Quer algo rápido e direto ou uma narrativa mais envolvente pra te levar pra outro clima?",
        "options": [
            { "title": "Rápida e quente", "next": "node5b" },
            { "title": "Bem detalhada", "next": "node5c" }
        ]
    },
    "node_photo2": {
        "text": "🔥 Curtiu? Quer continuar vendo mais coisas legais assim? Tenho um monte de conteúdo incrível esperando por você!",
        "image": "https://sexgram.ru/wp-content/uploads/2022/07/xmednisx-041-SexGram.ru_.jpg",
        "options": [
            { "title": "Quero mais disso!", "next": "node6" },
            { "title": "Tá demais!", "next": "node6" }
        ]
    },
    "node5b": {
        "text": "Tá aí: 'Eu tava num lugar tranquilo, luzes baixas, pensando em alguém especial... e aí as coisas começaram a esquentar na minha cabeça.' 😏 Quer mais histórias ou algo visual?",
        "options": [
            { "title": "Mais histórias!", "next": "node6" },
            { "title": "Quero ver fotos!", "next": "node6" }
        ]
    },
    "node5c": {
        "text": "Então segura essa: 'Era uma noite quente, eu tava sozinha, com uma música suave. Comecei a imaginar alguém me olhando, e cada pensamento me levava mais longe... até perder o controle.' 😘 Quer mais ou prefere algo real?",
        "options": [
            { "title": "Quero continuar!", "next": "node6" },
            { "title": "Mais histórias!", "next": "node6" }
        ]
    },
    "node6": {
        "text": "Tá curtindo, né? 😍 Eu tenho muito mais conteúdo assim, fotos, histórias, tudo bem envolvente! Quer dar uma olhada em tudo isso no meu site? É de graça, só pra quem curte essa vibe!",
        "options": [
            { "title": "Quero ver o site!", "next": "node7" },
            { "title": "Fala mais!", "next": "node6_extra" }
        ]
    },
    "node6_extra": {
        "text": "Você é curioso, hein? 😏 No meu site, tem fotos exclusivas, histórias quentes e um monte de coisas pra manter esse clima. Totalmente grátis! Bora lá?",
        "options": [
            { "title": "Bora pro site!", "next": "node7" }
        ]
    },
    "node7": {
        "text": "Show! 😄 Clica aqui pra curtir todo o conteúdo gratuito que preparei pra você. Vamos continuar essa vibe! 🔥",
        "options": [
            { "title": "Ver conteúdo!", "next": "node_end", "link": "https://api.alvonews.site/redirect/" },
            { "title": "Volto depois", "next": "node_end" }
        ]
    },
    "node_end": {
        "text": "Adorei nosso papo! 😊 Quando quiser mais, é só voltar que te levo pra curtir ainda mais! 🔥"
    }
};
// -------------------
// Estado dos usuários
// -------------------
const userState = {}; // { senderId: "nodeX" }

// -------------------
// Enviar mensagem
// -------------------
async function sendMessage(recipientId, message) {
    try {
        const response = await fetch(
            `https://graph.facebook.com/v23.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ recipient: { id: recipientId }, message })
            }
        );
        const data = await response.json();
        console.log("📤 Mensagem enviada:", data);
    } catch (err) {
        console.error("❌ Erro no fetch:", err);
    }
}

// -------------------
// Enviar nó da conversa
// -------------------
async function sendConversationNode(senderId, nodeKey) {
    const node = conversationFlow[nodeKey];
    if (!node) return;

    userState[senderId] = nodeKey;

    let messagesToSend = [];

    // se o node tiver imagem, envia imagem primeiro
    if (node.image) {
        messagesToSend.push({
            attachment: {
                type: "image",
                payload: {
                    url: node.image,
                    is_reusable: true
                }
            }
        });
    }

    // se tiver opções e alguma delas tiver link, envia como botão
    const hasLinkOption = node.options?.some(opt => opt.link);

    if (hasLinkOption) {
        messagesToSend.push({
            attachment: {
                type: "template",
                payload: {
                    template_type: "button",
                    text: node.text,
                    buttons: node.options.map(opt => {
                        if (opt.link) {
                            return {
                                type: "web_url",
                                url: opt.link,
                                title: opt.title
                            };
                        } else {
                            return {
                                type: "postback",
                                title: opt.title,
                                payload: opt.next
                            };
                        }
                    })
                }
            }
        });
    } else {
        // mensagem de texto + quick replies
        let message = { text: node.text };
        if (node.options && node.options.length > 0) {
            message.quick_replies = node.options.map((opt) => ({
                content_type: "text",
                title: opt.title,
                payload: opt.next
            }));
        }
        messagesToSend.push(message);
    }

    // envia tudo na ordem
    for (const msg of messagesToSend) {
        await sendMessage(senderId, msg);
    }
}

// -------------------
// Verificação do webhook
// -------------------
app.get("/webhook/facebook", (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode && token) {
        if (mode === "subscribe" && token === VERIFY_TOKEN) {
            console.log("✅ WEBHOOK_VERIFIED");
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);
        }
    }
});

// -------------------
// Receber eventos
// -------------------
app.post("/webhook/facebook", async (req, res) => {
    console.log("📩 Evento recebido:", JSON.stringify(req.body, null, 2));

    const body = req.body;

    if (body.object === "page") {
        for (const entry of body.entry) {
            const webhookEvent = entry.messaging[0];
            const senderId = webhookEvent.sender.id;

            if (webhookEvent.message) {
                // quick reply?
                if (webhookEvent.message.quick_reply) {
                    const payload = webhookEvent.message.quick_reply.payload;
                    await sendConversationNode(senderId, payload);
                }
                // primeira mensagem
                else if (webhookEvent.message.text) {
                    const userMessage = webhookEvent.message.text.toLowerCase();
                    if (userMessage.includes("oi")) {
                        await sendConversationNode(senderId, "start");
                    }
                }
            }
        }

        res.status(200).send("EVENT_RECEIVED");
    } else {
        res.sendStatus(404);
    }
});

const staticLinks = [
    "https://pktapps.com/como-usar-o-modo-noturno-no-celular-para-cuidar-da-visao/",
    "https://pktapps.com/descubra-os-5-melhores-aplicativos-de-relacionamento-de-2025/",
    "https://pktapps.com/como-criar-foto-profissional-para-o-linkedin-usando-ia/"
];

app.get("/redirect", async (req, res) => {
    try {
        if (!Array.isArray(staticLinks) || staticLinks.length === 0) {
            return res.status(404).json({ error: "Nenhum link disponível" });
        }

        const randomLink = staticLinks[Math.floor(Math.random() * staticLinks.length)];

        // Header para todos os navegadores (inclui WebView do FB)
        res.set("Referrer-Policy", "no-referrer");

        // Página minimalista, sem nada pesado que quebre no Messenger
        return res.send(`<!doctype html>
<html>
  <head>
    <meta name="referrer" content="no-referrer">
    <meta http-equiv="refresh" content="0; url=${randomLink}">
    <script>
      // Messenger webview geralmente executa JS, isso garante redirect
      window.location.replace(${JSON.stringify(randomLink)});
    </script>
    <style>
      body { font-family: sans-serif; text-align: center; margin-top: 30px; }
    </style>
  </head>
  <body>
    Redirecionando...
    <br><br>
    <a rel="noreferrer noopener" href="${randomLink}">Clique aqui se não redirecionar</a>
  </body>
</html>`);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erro interno" });
    }
});


// -------------------
// Inicia servidor
// -------------------
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
