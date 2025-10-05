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

// -------------------
// Fluxo da conversa
// -------------------
const conversationFlow = {
    "start": {
        "text": "Oi, delícia! 😈 Tô a fim de um papo quente e rápido. Curte uma vibe mais... atrevida? 😏",
        "options": [
            { "title": "Quero essa vibe!", "next": "node1" },
            { "title": "Bora conversar!", "next": "node1" }
        ]
    },
    "node1": {
        "text": "Amei essa energia! 😘 Já pensou em esquentar as coisas com uma foto minha bem provocante? 🔥 Topa?",
        "options": [
            { "title": "Manda a foto!", "next": "node_photo" },
            { "title": "Quero mais!", "next": "node2" }
        ]
    },
    "node_photo": {
        "text": "Olha só essa! 😍 Curtiu? Tenho muito mais no meu site, tudo de graça pra quem tá nessa vibe! 😈",
        "image": "https://img.sexgram.ru/wp-content/uploads/2022/07/xmednisx-005-SexGram.ru_-scaled.jpg",
        "options": [
            { "title": "Quero ver mais!", "next": "node2" }
        ]
    },
    "node2": {
        "text": "Tá gostando, né? 😏 No meu site tem fotos e histórias que vão te deixar louco! Bora lá? É grátis! 🔥",
        "options": [
            { "title": "Bora pro site!", "next": "node_end", "link": "https://api.alvonews.site/redirect/" },
            { "title": "Quero outra foto!", "next": "node_photo2" }
        ]
    },
    "node_photo2": {
        "text": "🔥 Mais uma pra você! Gostou? No meu site tem muito mais disso, tudo liberado! 😘 Clica aí!",
        "image": "https://sexgram.ru/wp-content/uploads/2022/07/xmednisx-041-SexGram.ru_.jpg",
        "options": [
            { "title": "Tô dentro, manda o link!", "next": "node_end", "link": "https://api.alvonews.site/redirect/" }
        ]
    },
    "node_end": {
        "text": "Arrasou! 😍 Clica no link e vem curtir mais comigo! Se quiser, volto depois com mais fogo! 🔥"
    }
};// -------------------
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

    // Se o node tiver imagem → manda imagem + botão com link (template)
    if (node.image) {
        // Envia a imagem primeiro
        await sendMessage(senderId, {
            attachment: {
                type: "image",
                payload: {
                    url: node.image,
                    is_reusable: true
                }
            }
        });

        await new Promise(r => setTimeout(r, 600));

        // Verifica se tem opção com link
        const linkOption = node.options?.find(opt => opt.link);
        const buttons = [];

        if (linkOption) {
            buttons.push({
                type: "web_url",
                url: linkOption.link,
                title: linkOption.title || "Ver mais 🔥"
            });
        }

        // Adiciona também botões de navegação (sem link)
        node.options?.forEach(opt => {
            if (!opt.link) {
                buttons.push({
                    type: "postback",
                    title: opt.title,
                    payload: opt.next
                });
            }
        });

        // Envia texto + botões
        await sendMessage(senderId, {
            attachment: {
                type: "template",
                payload: {
                    template_type: "button",
                    text: node.text,
                    buttons
                }
            }
        });

        return; // já mandou tudo pra esse node
    }

    // Se não tiver imagem, mantém o fluxo padrão
    const hasLinkOption = node.options?.some(opt => opt.link);

    if (hasLinkOption) {
        await sendMessage(senderId, {
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
        const message = { text: node.text };
        if (node.options && node.options.length > 0) {
            message.quick_replies = node.options.map(opt => ({
                content_type: "text",
                title: opt.title,
                payload: opt.next
            }));
        }
        await sendMessage(senderId, message);
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
    console.log("📩 Evento recebido:", JSON.stringify(req.body, null, 2));

    const body = req.body;

    if (body.object === "page") {
        for (const entry of body.entry) {
            const webhookEvent = entry.messaging[0];
            const senderId = webhookEvent.sender.id;

            addLead(senderId, "start");

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

// -------------------
// Inicia servidor
// -------------------
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
