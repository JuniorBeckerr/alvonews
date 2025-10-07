import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));
const leadsFilePath = path.join(__dirname, "leads.json");

const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const processedMessages = new Set();
const activeUsers = new Set();

// -------------------
// Fluxo da conversa
// -------------------
const conversationFlow = {
    "start": {
        "text": "Oi, gostoso 😏 Tava te esperando... quer brincar um pouquinho comigo?",
        "options": [
            { "title": "Quero sim 😈", "next": "node1" },
            { "title": "Mostra o que tem aí 👀", "next": "node1" }
        ]
    },
    "node1": {
        "text": "Adoro quem chega direto assim 😘 Posso te mostrar uma foto minha pra começar o clima?",
        "options": [
            { "title": "Manda!", "next": "node_photo1" },
            { "title": "Quero algo mais quente 🔥", "next": "node_photo2" }
        ]
    },
    "node_photo1": {
        "text": "Olha só essa... 😍 Curtiu? Tenho umas bem mais ousadas, quer ver?",
        "image": "https://img.sexgram.ru/wp-content/uploads/2022/07/xmednisx-005-SexGram.ru_-scaled.jpg",
        "options": [
            { "title": "Manda mais 😈", "next": "node_photo2" },
            { "title": "Tá me deixando doido 😏", "next": "node2" }
        ]
    },
    "node_photo2": {
        "text": "🔥 Essa aqui é pra te deixar pensando em mim... quer ver tudo de graça no meu site?",
        "image": "https://sexgram.ru/wp-content/uploads/2022/07/xmednisx-041-SexGram.ru_.jpg",
        "options": [
            { "title": "Quero ver tudo! 😍", "next": "node_end", "link": "https://api.alvonews.site/redirect/" },
            { "title": "Me conta mais 😏", "next": "node2" }
        ]
    },
    "node2": {
        "text": "Sou safada, mas educada 😘 No meu site tem fotos e vídeos que não posso mandar aqui... quer espiar rapidinho?",
        "options": [
            { "title": "Me mostra 😈", "next": "node_end", "link": "https://api.alvonews.site/redirect/" },
            { "title": "Depois eu vejo 😉", "next": "node_end" }
        ]
    },
    "node_end": {
        "text": "Adorei esse clima entre a gente 😍 Clica no link e vem ver tudo sem filtro 🔥"
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
async function delay(min = 3000, max = 5000) {
    const time = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise(r => setTimeout(r, time));
}

async function sendConversationNode(senderId, nodeKey) {
    // Evita que o mesmo usuário dispare várias respostas em paralelo
    if (activeUsers.has(senderId)) {
        console.log(`⚠️ Ignorando envio duplicado para ${senderId}`);
        return;
    }

    activeUsers.add(senderId);

    try {
        const node = conversationFlow[nodeKey];
        if (!node) return;

        userState[senderId] = nodeKey;

        // Se tiver imagem, envia primeiro
        if (node.image) {
            await sendMessage(senderId, {
                attachment: {
                    type: "image",
                    payload: {
                        url: node.image,
                        is_reusable: true,
                    },
                },
            });
            await delay(); // espera entre 3 e 5 segundos
        }

        // Se tiver link, manda como template
        const hasLink = node.options?.some((opt) => opt.link);
        if (hasLink) {
            await sendMessage(senderId, {
                attachment: {
                    type: "template",
                    payload: {
                        template_type: "button",
                        text: node.text,
                        buttons: node.options.map((opt) => {
                            if (opt.link) {
                                return { type: "web_url", url: opt.link, title: opt.title };
                            } else {
                                return { type: "postback", title: opt.title, payload: opt.next };
                            }
                        }),
                    },
                },
            });
        } else {
            const message = { text: node.text };
            if (node.options && node.options.length > 0) {
                message.quick_replies = node.options.map((opt) => ({
                    content_type: "text",
                    title: opt.title,
                    payload: opt.next,
                }));
            }
            await sendMessage(senderId, message);
        }

        await delay(); // pequeno delay antes da próxima mensagem
    } catch (err) {
        console.error("❌ Erro no sendConversationNode:", err);
    } finally {
        activeUsers.delete(senderId);
    }
}

function readLeads() {
    try {
        const data = fs.readFileSync(leadsFilePath, "utf-8");
        return JSON.parse(data);
    } catch (err) {
        console.error("Erro ao ler o arquivo de leads:", err);
        return {}; // Se o arquivo não existir ou ocorrer algum erro, retorna um objeto vazio
    }
}

// Função para salvar os leads no arquivo
function saveLeads(leads) {
    try {
        fs.writeFileSync(leadsFilePath, JSON.stringify(leads, null, 2), "utf-8");
        console.log("Leads salvos com sucesso!");
    } catch (err) {
        console.error("Erro ao salvar o arquivo de leads:", err);
    }
}

function addLead(senderId, state) {
    const leads = readLeads();

    // Verifica se o lead já existe
    if (!leads[senderId]) {
        // Adiciona o novo lead
        leads[senderId] = {
            state: state,
            timestamp: Date.now(),
        };
        console.log(`Novo lead adicionado: ${senderId}`);
    } else {
        // Se o lead já existe, apenas atualiza o estado
        leads[senderId].state = state;
        leads[senderId].timestamp = Date.now();
        console.log(`Lead atualizado: ${senderId}`);
    }

    // Salva os leads no arquivo
    saveLeads(leads);
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
    try {
        console.log("📩 Evento recebido:", JSON.stringify(req.body, null, 2));

        const body = req.body;

        if (body.object === "page") {
            for (const entry of body.entry) {
                const webhookEvent = entry.messaging[0];
                const senderId = webhookEvent.sender.id;

                // Verifica se é uma mensagem duplicada
                const messageId = webhookEvent.message?.mid;
                if (messageId && processedMessages.has(messageId)) {
                    console.log(`⚠️ Mensagem duplicada ignorada: ${messageId}`);
                    continue;
                }
                if (messageId) processedMessages.add(messageId);

                // 🔹 Só processa se for uma mensagem do usuário
                if (webhookEvent.message) {
                    // Caso seja um quick reply (botão)
                    if (webhookEvent.message.quick_reply) {
                        const payload = webhookEvent.message.quick_reply.payload;
                        addLead(senderId, payload); // salva o estado real
                        await sendConversationNode(senderId, payload);
                        continue;
                    }

                    // Caso o usuário digite texto normal
                    if (webhookEvent.message.text) {
                        const userMessage = webhookEvent.message.text.toLowerCase().trim();
                        const gatilhos = [
                            "oi",
                            "ola",
                            "olá",
                            "podemos conversar",
                            "esta disponivel",
                            "está disponível",
                            "fala",
                            "eai",
                        ];

                        // Só inicia o fluxo se o usuário estiver "sem estado" e a msg for um gatilho
                        const isGatilho = gatilhos.some((palavra) =>
                            userMessage.includes(palavra)
                        );

                        if (isGatilho && (!userState[senderId] || userState[senderId] === "node_end")) {
                            addLead(senderId, "start");
                            await sendConversationNode(senderId, "start");
                        } else {
                            console.log(
                                `❌ Ignorado: mensagem "${userMessage}" não é gatilho ou usuário já está em fluxo (${userState[senderId]})`
                            );
                        }
                    }
                }

                // Caso o evento seja um postback (clicou em botão do template)
                if (webhookEvent.postback) {
                    const payload = webhookEvent.postback.payload;
                    addLead(senderId, payload);
                    await sendConversationNode(senderId, payload);
                }
            }

            res.status(200).send("EVENT_RECEIVED");
        } else {
            res.sendStatus(404);
        }
    } catch (err) {
        console.error("❌ Erro no webhook:", err);
        res.sendStatus(500);
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
// Broadcast para vários usuários
// -------------------
app.post("/broadcast", async (req, res) => {
    try {
        const { recipients, message } = req.body;
        if (!Array.isArray(recipients) || recipients.length === 0) {
            return res.status(400).json({ error: "Envie um array de recipients" });
        }

        const messages = Array.isArray(message) ? message : [message];

        const results = [];
        for (const id of recipients) {
            try {
                for (const msg of messages) {
                    await sendMessage(id, msg);
                }
                results.push({ id, status: "ok" });
            } catch (err) {
                console.error(`Erro enviando para ${id}:`, err);
                results.push({ id, status: "erro" });
            }
        }

        return res.json({ success: true, results });
    } catch (err) {
        console.error("❌ Erro no broadcast:", err);
        return res.status(500).json({ error: "Erro no servidor." });
    }
});


const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

app.get("/teste", async (req, res) => {
    try {
        // Simula tempo de processamento pesado (timeout test)
        console.log("⏳ Iniciando teste de timeout...");
        await sleep(100 * 1000); // 100 segundos
        console.log("✅ Finalizou sem timeout.");

        return res.json({ success: true });
    } catch (err) {
        console.error("❌ Erro no broadcast:", err);
        return res.status(500).json({ error: "Erro no servidor." });
    }
});


// -------------------
// Inicia servidor
// -------------------
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});