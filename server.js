import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN; // token da página do FB

// Função para enviar mensagem
async function sendMessage(recipientId, message) {
    try {
        const response = await fetch(`https://graph.facebook.com/v23.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ recipient: { id: recipientId }, message }),
        });

        const data = await response.json();
        console.log("📤 Mensagem enviada:", data);
    } catch (err) {
        console.error("❌ Erro no fetch:", err);
    }
}

// Endpoint de verificação
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

// Endpoint para receber eventos
app.post("/webhook/facebook", async (req, res) => {
    console.log("📩 Evento recebido:", JSON.stringify(req.body, null, 2));

    const body = req.body;

    if (body.object === "page") {
        for (const entry of body.entry) {
            const webhookEvent = entry.messaging[0];
            const senderId = webhookEvent.sender.id;

            if (webhookEvent.message && webhookEvent.message.text) {
                const userMessage = webhookEvent.message.text.toLowerCase();

                if (userMessage.includes("oi")) {
                    // envia a resposta depois de 5s
                    setTimeout(async () => {
                        try {
                            await sendMessage(senderId, {
                                text: "Tudo bem com você?",
                                quick_replies: [
                                    { content_type: "text", title: "Sim", payload: "SIM_PAYLOAD" },
                                    { content_type: "text", title: "Não", payload: "NAO_PAYLOAD" },
                                ],
                            });
                        } catch (err) {
                            console.error("❌ Erro ao enviar mensagem:", err);
                        }
                    }, 5000);
                }
            }
        }

        // resposta IMEDIATA para o Facebook
        res.status(200).send("EVENT_RECEIVED");
    } else {
        res.sendStatus(404);
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
