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
        text: "Oi! Seja bem-vindo 👋",
        options: [{ title: "Começar", next: "node1" }]
    },
    node1: {
        text: "Tudo bem com você?",
        options: [
            { title: "Sim 😃", next: "node2a" },
            { title: "Não 😔", next: "node2b" }
        ]
    },
    node2a: {
        text: "Que ótimo! Quer conhecer mais sobre o que tenho pra te mostrar?",
        options: [
            { title: "Quero sim", next: "node3" },
            { title: "Talvez depois", next: "node_end" }
        ]
    },
    node2b: {
        text: "Poxa, sinto muito. Talvez eu possa te animar. Quer conversar mais?",
        options: [
            { title: "Sim", next: "node3" },
            { title: "Não", next: "node_end" }
        ]
    },
    node3: {
        text: "Prefere que eu te mostre imagens 📸 ou te conte uma história 📖?",
        options: [
            { title: "Imagens", next: "node4a" },
            { title: "História", next: "node4b" }
        ]
    },
    node4a: {
        text: "Legal! Tenho várias imagens para te mostrar. Quer ver agora?",
        options: [
            { title: "Sim, quero!", next: "node5a" },
            { title: "Não, deixa pra depois", next: "node_end" }
        ]
    },
    node4b: {
        text: "Adoro contar histórias. Quer que seja curta ou longa?",
        options: [
            { title: "Curta", next: "node5b" },
            { title: "Longa", next: "node5c" }
        ]
    },
    node5a: {
        text: "Aqui vai uma amostra... Quer mais conteúdos exclusivos?",
        options: [
            { title: "Sim!", next: "node6" },
            { title: "Não", next: "node_end" }
        ]
    },
    node5b: {
        text: "História curta: ... Quer mais?",
        options: [
            { title: "Sim!", next: "node6" },
            { title: "Não", next: "node_end" }
        ]
    },
    node5c: {
        text: "História longa: ... Quer mais?",
        options: [
            { title: "Sim!", next: "node6" },
            { title: "Não", next: "node_end" }
        ]
    },
    node6: {
        text: "Ótimo! Para continuar, você pode acessar nosso conteúdo completo. Quer que eu te mande o link?",
        options: [
            { title: "Sim, manda!", next: "node7" },
            { title: "Agora não", next: "node_end" }
        ]
    },
    node7: {
        text: "Aqui está o link: https://exemplo.com/checkout 💳",
        options: [
            { title: "Comprar agora", next: "node_end" },
            { title: "Pensar mais um pouco", next: "node_end" }
        ]
    },
    node_end: {
        text: "Ok, obrigado pela conversa! Volte sempre 😊"
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

    // monta mensagem
    let message = { text: node.text };

    if (node.options && node.options.length > 0) {
        message.quick_replies = node.options.map((opt) => ({
            content_type: "text",
            title: opt.title,
            payload: opt.next
        }));
    }

    await sendMessage(senderId, message);
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
