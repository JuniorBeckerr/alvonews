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
    start: {
        text: "Oi, tudo bom? 😊 Tô super animada pra te conhecer e compartilhar umas coisinhas especiais... Pronto pra começar?",
        options: [{ title: "Tô pronto!", next: "node1" }]
    },
    node1: {
        text: "Que legal! 😄 Como tá o teu dia? Tá afim de um papo descontraído que pode... esquentar um pouco? 😏",
        options: [
            { title: "Quero esse clima quente!", next: "node2a" },
            { title: "Vamos de boa por enquanto", next: "node2b" }
        ]
    },
    node2a: {
        text: "Hmmm, adorei essa vibe! 😈 Que tal apimentar as coisas? Posso te mandar uma foto minha bem especial pra te deixar no clima... Topa?",
        options: [
            { title: "Manda a foto!", next: "node_photo" },
            { title: "Quero algo diferente", next: "node3" }
        ]
    },
    node2b: {
        text: "Tranquilo, vamos no seu ritmo! 😊 Quer conversar um pouco mais ou tá curioso pra algo mais... interessante? Quem sabe uma foto minha pra esquentar o papo?",
        options: [
            { title: "Manda a foto!", next: "node_photo" },
            { title: "Quero algo mais interessante", next: "node3" },
            { title: "Quero só conversar", next: "node2b_extra" }
        ]
    },
    node2b_extra: {
        text: "Beleza, vamos de leve então! 😄 Mas só pra te provocar... já pensou em ver uma foto minha bem sensual? 😏 O que acha?",
        options: [
            { title: "Quero a foto!", next: "node_photo" },
            { title: "Quero algo quente!", next: "node3" }
        ]
    },
    node_photo: {
        text: "🔥 Gostou? Vamos continuar esquentando?",
        image: "https://img.sexgram.ru/wp-content/uploads/2022/07/xmednisx-005-SexGram.ru_-scaled.jpg",
        options: [
            { title: "Amei, continua!", next: "node3" },
            { title: "Quero mais disso!", next: "node3" }
        ]
    },
    node3: {
        text: "Tá ficando bom, hein? 😏 Quer que eu te mostre mais fotos sensuais 📸 ou prefere uma história picante que vai mexer com tua imaginação? 📖",
        options: [
            { title: "Mais fotos", next: "node4a" },
            { title: "História picante", next: "node4b" }
        ]
    },
    node4a: {
        text: "Boa escolha! 😘 Minhas fotos são puro fogo... Quer outra amostrinha grátis agora?",
        options: [
            { title: "Quero agora!", next: "node5a" },
            { title: "Descreve mais", next: "node4a_desc" }
        ]
    },
    node4a_desc: {
        text: "Tá curioso? 😜 Pensa em mim com uma lingerie vermelha, luzes suaves, deitada de um jeito que te faz querer ver mais... Quer a foto de verdade agora?",
        options: [{ title: "Manda a foto!", next: "node5a" }]
    },
    node4b: {
        text: "Histórias são a minha praia! 😈 Quer uma curtinha que já te deixa no clima ou uma longa, cheia de detalhes quentes?",
        options: [
            { title: "Curta e direta", next: "node5b" },
            { title: "Longa e intensa", next: "node5c" }
        ]
    },
    node5a: {
        text: "Olha só essa: [Placeholder: outra foto sensual]. 🔥 Ficou com vontade de mais? Todo o meu conteúdo adulto tá disponível de graça!",
        options: [
            { title: "Quero mais!", next: "node6" },
            { title: "Nossa, já tô dentro!", next: "node6" }
        ]
    },
    node5b: {
        text: "História curta: 'Estava sozinha, com uma música suave ao fundo. Minha pele arrepiava enquanto eu imaginava você me olhando... e aí, as coisas esquentaram.' 😏 Quer mais histórias, de graça?",
        options: [
            { title: "Sim, continua!", next: "node6" },
            { title: "Quero ver fotos agora", next: "node6" }
        ]
    },
    node5c: {
        text: "História longa: 'Era uma noite quente, e eu tava com aquele fogo interno. Tirei cada peça de roupa bem devagar, sentindo o tecido deslizar. Imaginei você ali, me tocando, e cada movimento me levou mais fundo no prazer...' 😘 Quer acessar todas as minhas histórias e vídeos de graça?",
        options: [
            { title: "Quero tudo!", next: "node6" },
            { title: "Tô louco por mais!", next: "node6" }
        ]
    },
    node6: {
        text: "Você tá no clima perfeito! 😍 Minha campanha especial tá liberando todo o meu conteúdo adulto – fotos sensuais, vídeos quentes, histórias que vão te levar às nuvens – tudo de graça! Quer o link pra acessar agora?",
        options: [
            { title: "Manda o link!", next: "node7" },
            { title: "Me fala mais do conteúdo", next: "node6_extra" }
        ]
    },
    node6_extra: {
        text: "Claro, amor! 😘 Tem fotos minhas em poses provocantes, vídeos de momentos bem íntimos e histórias que vão fazer tua imaginação voar. Tudo grátis pra você curtir quando quiser. Pronto pro link?",
        options: [{ title: "Manda agora!", next: "node7" }]
    },
    node7: {
        text: "Aqui tá o link pra todo o conteúdo liberado: https://exemplo.com/freecontent 🎉 Mergulha de cabeça e aproveita! 😘",
        options: [
            { title: "Tô indo conferir!", next: "node_end" },
            { title: "Volto depois", next: "node_end" }
        ]
    },
    node_end: {
        text: "Adorei nosso papo! 😊 Volta quando quiser que a gente esquenta ainda mais! 🔥"
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

    // mensagem de texto
    let message = { text: node.text };
    if (node.options && node.options.length > 0) {
        message.quick_replies = node.options.map((opt) => ({
            content_type: "text",
            title: opt.title,
            payload: opt.next
        }));
    }
    messagesToSend.push(message);

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

// -------------------
// Inicia servidor
// -------------------
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
