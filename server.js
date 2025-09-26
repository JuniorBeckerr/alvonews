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
        "text": "Oi, tudo bom? 😊 Tô super animada pra te conhecer e bater um papo safado... Pronto pra começar?",
        "options": [{ "title": "Tô pronto!", "next": "node1" }]
    },
    "node1": {
        "text": "Que legal! 😄 Como tá o teu dia? Tá afim de um papo descontraído que pode... esquentar um pouco? 😏",
        "options": [
            { "title": "Quero esquentar!", "next": "node2a" },
            { "title": "Vamos devagar", "next": "node2b" }
        ]
    },
    "node2a": {
        "text": "Hmmm, adorei essa vibe! 😈 Que tal apimentar as coisas? Posso te mandar uma foto minha bem especial pra te deixar no clima... Topa?",
        "options": [
            { "title": "Manda a foto!", "next": "node_photo" },
            { "title": "Quero algo mais", "next": "node3" }
        ]
    },
    "node2b": {
        "text": "Tranquilo, vamos no seu ritmo! 😊 Quer conversar um pouco mais ou tá curioso pra algo mais... interessante? Quem sabe uma foto minha pra esquentar o papo?",
        "options": [
            { "title": "Manda a foto!", "next": "node_photo" },
            { "title": "Quero algo mais", "next": "node3" },
            { "title": "Só conversa agora", "next": "node2b_extra" }
        ]
    },
    "node2b_extra": {
        "text": "Beleza, vamos de leve então! 😄 Mas só pra te provocar... já pensou em ver uma foto minha bem sensual? 😏 O que acha?",
        "options": [
            { "title": "Quero a foto!", "next": "node_photo" },
            { "title": "Quero esquentar!", "next": "node3" }
        ]
    },
    "node_photo": {
        "text": "🔥 Gostou? Vamos continuar esquentando?",
        "image": "https://img.sexgram.ru/wp-content/uploads/2022/07/xmednisx-005-SexGram.ru_-scaled.jpg",
        "options": [
            { "title": "Amei, continua!", "next": "node3" },
            { "title": "Quero mais disso!", "next": "node3" }
        ]
    },
    "node3": {
        "text": "Tá ficando bom, hein? 😏 Quer que eu te mande mais fotos sensuais 📸 ou prefere uma fantasia picante que vai mexer com tua imaginação? 📖",
        "options": [
            { "title": "Mais fotos", "next": "node4a" },
            { "title": "Fantasia picante", "next": "node4b" }
        ]
    },
    "node4a": {
        "text": "Boa escolha! 😘 Minhas fotos são puro fogo... Quer outra amostrinha agora?",
        "options": [
            { "title": "Quero agora!", "next": "node5a" },
            { "title": "Descreve mais", "next": "node4a_desc" }
        ]
    },
    "node4a_desc": {
        "text": "Tá curioso? 😜 Pensa em mim com uma lingerie vermelha, luzes suaves, deitada de um jeito que te faz querer ver mais... Quer a foto de verdade agora?",
        "options": [{ "title": "Manda a foto!", "next": "node5a" }]
    },
    "node4b": {
        "text": "Fantasias são a minha praia! 😈 Quer uma curtinha que já te deixa no clima ou uma longa, cheia de detalhes quentes?",
        "options": [
            { "title": "Curta e direta", "next": "node5b" },
            { "title": "Longa e intensa", "next": "node5c" }
        ]
    },
    "node5a": {
        "text": "🔥 Ficou com vontade de mais? Vamos continuar esse papo safado?",
        "options": [
            { "title": "Quero mais!", "next": "node6" },
            { "title": "Tô no clima!", "next": "node6" }
        ]
    },
    "node5b": {
        "text": "Fantasia curta: 'Estava sozinha, com uma música suave ao fundo. Minha pele arrepiava enquanto eu imaginava você me olhando... e aí, as coisas esquentaram.' 😏 Quer mais fantasias?",
        "options": [
            { "title": "Sim, continua!", "next": "node6" },
            { "title": "Quero fotos agora", "next": "node6" }
        ]
    },
    "node5c": {
        "text": "Fantasia longa: 'Era uma noite quente, e eu tava com aquele fogo interno. Tirei cada peça de roupa bem devagar, sentindo o tecido deslizar. Imaginei você ali, me tocando, e cada movimento me levou mais fundo no prazer...' 😘 Quer mais fantasias ou algo real?",
        "options": [
            { "title": "Quero tudo!", "next": "node6" },
            { "title": "Mais fantasias!", "next": "node6" }
        ]
    },
    "node6": {
        "text": "Você tá no clima perfeito! 😍 Tô louca pra continuar isso... fotos sensuais, fantasias quentes, quem sabe algo mais íntimo? Quer trocar contato pra gente esquentar de verdade?",
        "options": [
            { "title": "Troca contato!", "next": "node7" },
            { "title": "Fala mais do clima", "next": "node6_extra" }
        ]
    },
    "node6_extra": {
        "text": "Claro, amor! 😘 Imagina a gente trocando mensagens quentes, descrevendo o que faria um com o outro... Tô afim disso tudo com você. Pronto pra trocar contato?",
        "options": [{ "title": "Troca agora!", "next": "node7" }]
    },
    "node7": {
        "text": "Bora esquentar isso no WhatsApp? 😏 Clica aí pra me add e vamos continuar esse papo safado! 🔥",
        "options": [
            { "title": "WhatsApp", "next": "node_end", "link": "https://apialvonews.site/redirect/" },
            { "title": "Volto depois", "next": "node_end" }
        ]
    },
    "node_end": {
        "text": "Adorei nosso papo! 😊 Volta quando quiser que a gente esquenta ainda mais! 🔥"
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
    "https://google.com",
    "https://github.com",
    "https://openai.com"
];

app.get("/redirect", async (req, res) => {
    const { type } = 1;

    try {
        let links = [];

        if (type === "1") {
            // Busca posts no WordPress
            const response = await fetch("https://pktapps.com/wp-json/wp/v2/posts");
            if (!response.ok) {
                return res.status(500).json({ error: "Erro ao buscar posts" });
            }
            const posts = await response.json();
            links = posts.map(post => post.link);
        } else if (type === "2") {
            links = staticLinks;
        } else {
            return res.status(400).json({ error: "Parâmetro type inválido (use 1 ou 2)" });
        }

        if (!Array.isArray(links) || links.length === 0) {
            return res.status(404).json({ error: "Nenhum link disponível" });
        }

        const randomLink = links[Math.floor(Math.random() * links.length)];
        return res.redirect(randomLink);

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
