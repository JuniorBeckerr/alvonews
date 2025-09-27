    (function() {
        // CSS do overlay fantasma com simulação de mouse
        const ghostCSS = `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        .ghost-overlay {
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            z-index: 9999;
            pointer-events: none; /* FANTASMA - cliques atravessam */
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
            overflow-y: auto;
        }

        .ghost-main-content {
            min-height: 100vh;
            padding: 20px 15px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            position: relative;
        }

        /* Cursor fantasma simulado */
        .ghost-cursor {
            position: absolute;
            width: 20px;
            height: 20px;
            background: rgba(255, 71, 87, 0.8);
            border: 2px solid white;
            border-radius: 50%;
            z-index: 10000;
            pointer-events: none;
            box-shadow: 0 0 20px rgba(255, 71, 87, 0.6);
            animation: cursor-pulse 1.5s infinite;
        }

        @keyframes cursor-pulse {
            0%, 100% { transform: scale(1); opacity: 0.8; }
            50% { transform: scale(1.2); opacity: 1; }
        }

        .ghost-cursor::after {
            content: '';
            position: absolute;
            top: -5px;
            left: -5px;
            right: -5px;
            bottom: -5px;
            border: 2px solid rgba(255, 71, 87, 0.3);
            border-radius: 50%;
            animation: cursor-ripple 2s infinite;
        }

        @keyframes cursor-ripple {
            0% { transform: scale(0.8); opacity: 1; }
            100% { transform: scale(2); opacity: 0; }
        }

        /* Partículas flutuantes */
        .ghost-particles {
            position: absolute;
            top: 0; left: 0;
            width: 100%; height: 100%;
            overflow: hidden;
            z-index: 1;
        }

        .ghost-particle {
            position: absolute;
            background: radial-gradient(circle, rgba(255, 71, 87, 0.3) 0%, transparent 70%);
            border-radius: 50%;
            animation: float 25s infinite linear;
        }

        @keyframes float {
            0% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { transform: translateY(-100px) rotate(360deg); opacity: 0; }
        }

        .ghost-content-wrapper {
            position: relative;
            z-index: 2;
            max-width: 100%;
            width: 100%;
        }

        .ghost-age-warning {
            background: linear-gradient(135deg, #ff4757, #ff3742);
            color: white;
            padding: 12px 24px;
            border-radius: 50px;
            font-size: 14px;
            font-weight: 700;
            margin-bottom: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            box-shadow: 0 8px 32px rgba(255, 71, 87, 0.3);
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }

        .ghost-warning-icon {
            width: 24px;
            height: 24px;
            background: rgba(255, 255, 255, 0.2);
            border: 2px solid rgba(255, 255, 255, 0.8);
            border-radius: 50%;
            font-size: 12px;
            font-weight: 900;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .ghost-main-title {
            font-size: clamp(28px, 8vw, 42px);
            font-weight: 800;
            background: linear-gradient(135deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3);
            background-size: 400% 400%;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            text-align: center;
            margin-bottom: 25px;
            line-height: 1.1;
            animation: gradient 3s ease infinite;
            padding: 0 10px;
        }

        @keyframes gradient {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
        }

        .ghost-video-container {
            position: relative;
            background: linear-gradient(135deg, #ff4757, #ff3742, #ff6b6b);
            border-radius: 20px;
            padding: 4px;
            margin-bottom: 25px;
            box-shadow: 0 15px 50px rgba(255, 71, 87, 0.4);
            animation: glow 2s ease-in-out infinite alternate;
        }

        @keyframes glow {
            from { box-shadow: 0 20px 60px rgba(255, 71, 87, 0.4); }
            to { box-shadow: 0 25px 80px rgba(255, 71, 87, 0.6); }
        }

        .ghost-video-player {
            background: linear-gradient(135deg, #1a1a1a, #2d2d2d);
            border-radius: 16px;
            aspect-ratio: 16/9;
            overflow: hidden;
            position: relative;
            transition: transform 0.3s ease;
        }

        /* Simulação de hover no vídeo */
        .ghost-video-player.ghost-hover {
            transform: scale(1.02);
        }

        .ghost-video-iframe {
            width: 100%;
            height: 100%;
            border: none;
            border-radius: 20px;
        }

        .ghost-video-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: opacity 0.3s;
        }

        .ghost-video-overlay.ghost-hover {
            opacity: 0.8;
        }

        .ghost-play-button {
            width: 100px;
            height: 100px;
            background: linear-gradient(135deg, #ff4757, #ff3742);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            box-shadow: 0 15px 35px rgba(255, 71, 87, 0.4);
        }

        .ghost-play-button.ghost-hover {
            transform: scale(1.1);
            box-shadow: 0 20px 50px rgba(255, 71, 87, 0.6);
        }

        .ghost-play-icon {
            width: 0;
            height: 0;
            border-left: 28px solid white;
            border-top: 16px solid transparent;
            border-bottom: 16px solid transparent;
            margin-left: 6px;
        }

        .ghost-video-duration {
            position: absolute;
            top: 12px;
            right: 12px;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(10px);
            color: white;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
        }

        .ghost-video-controls {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: linear-gradient(transparent, rgba(0,0,0,0.9));
            backdrop-filter: blur(10px);
            padding: 25px 20px 15px;
            display: flex;
            align-items: center;
            gap: 15px;
        }

        .ghost-control-btn {
            background: none;
            border: none;
            color: white;
            font-size: 18px;
            padding: 8px;
            border-radius: 8px;
            transition: background 0.2s;
        }

        .ghost-control-btn.ghost-hover {
            background: rgba(255, 255, 255, 0.1);
        }

        .ghost-progress-bar {
            flex: 1;
            height: 6px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 3px;
            position: relative;
            overflow: hidden;
        }

        .ghost-progress-fill {
            width: 42%;
            height: 100%;
            background: linear-gradient(90deg, #ff4757, #ff3742);
            border-radius: 3px;
            animation: progress-glow 2s ease-in-out infinite alternate, progress-move 8s infinite;
        }

        @keyframes progress-glow {
            from { box-shadow: 0 0 10px rgba(255, 71, 87, 0.5); }
            to { box-shadow: 0 0 20px rgba(255, 71, 87, 0.8); }
        }

        @keyframes progress-move {
            0%, 20% { width: 42%; }
            50% { width: 48%; }
            80%, 100% { width: 45%; }
        }

        .ghost-time-display {
            color: white;
            font-size: 13px;
            font-weight: 500;
        }

        .ghost-quality-display {
            color: white;
            font-size: 12px;
            background: linear-gradient(135deg, #ff4757, #ff3742);
            padding: 4px 10px;
            border-radius: 12px;
            font-weight: 600;
        }

        .ghost-watch-button {
            background: linear-gradient(135deg, #ff4757, #ff3742, #ff6b6b);
            background-size: 200% 200%;
            border: none;
            color: white;
            font-size: clamp(18px, 5vw, 22px);
            font-weight: 800;
            padding: 45px 10px;
            border-radius: 50px;
            width: 100%;
            margin-bottom: 30px;
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            box-shadow: 0 12px 35px rgba(255, 71, 87, 0.4);
            text-transform: uppercase;
            letter-spacing: 1.5px;
            animation: button-gradient 3s ease infinite;
        }

        @keyframes button-gradient {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
        }

        .ghost-watch-button.ghost-hover {
            transform: translateY(-5px);
            box-shadow: 0 25px 60px rgba(255, 71, 87, 0.6);
        }

        .ghost-top-videos {
            width: 100%;
        }

        .ghost-top-videos h3 {
            font-size: clamp(20px, 6vw, 28px);
            font-weight: 700;
            margin-bottom: 20px;
            text-align: center;
            color: white;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .ghost-video-item {
            display: flex;
            gap: 12px;
            margin-bottom: 15px;
            padding: 12px;
            border-radius: 14px;
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            transition: all 0.3s ease;
        }

        .ghost-video-item.ghost-hover {
            transform: translateY(-3px);
            background: rgba(255, 255, 255, 0.08);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }

        .ghost-video-item-thumbnail {
            width: 120px;
            height: 90px;
            background: linear-gradient(135deg, #ff4757, #ff3742);
            border-radius: 10px;
            position: relative;
            flex-shrink: 0;
            overflow: hidden;
        }

        .ghost-video-item-thumbnail::before {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(45deg,
                rgba(255, 255, 255, 0.1) 0%,
                transparent 50%,
                rgba(255, 255, 255, 0.1) 100%);
        }

        .ghost-video-item-thumbnail::after {
            content: '▶';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: white;
            font-size: 20px;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
        }

        .ghost-video-item-info {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }

        .ghost-video-item-info h4 {
            font-size: clamp(14px, 4vw, 18px);
            font-weight: 600;
            margin-bottom: 6px;
            line-height: 1.3;
            color: white;
        }

        .ghost-video-item-meta {
            font-size: 13px;
            color: rgba(255, 255, 255, 0.6);
            display: flex;
            gap: 12px;
            align-items: center;
        }

        .ghost-live-indicator {
            background: #ff4757;
            color: white;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            animation: blink 1.5s infinite;
        }

        @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0.7; }
        }

        /* Click effect */
        .ghost-click-effect {
            position: absolute;
            width: 30px;
            height: 30px;
            border: 3px solid rgba(255, 71, 87, 0.8);
            border-radius: 50%;
            pointer-events: none;
            animation: click-ripple 0.6s ease-out forwards;
        }

        @keyframes click-ripple {
            0% { transform: scale(0); opacity: 1; }
            100% { transform: scale(2); opacity: 0; }
        }

        /* Responsividade */
        @media (max-width: 480px) {
            .ghost-main-content {
                padding: 15px 10px;
                gap: 15px;
            }
            .ghost-content-wrapper {
                max-width: 100%;
                width: 100%;
            }
            .ghost-age-warning {
                padding: 10px 20px;
                font-size: 13px;
                margin-bottom: 20px;
            }
            .ghost-video-container {
                margin-bottom: 20px;
            }
            .ghost-watch-button {
                padding: 16px 30px;
                margin-bottom: 25px;
                font-size: 16px;
            }
            .ghost-video-item {
                padding: 10px;
                margin-bottom: 12px;
                gap: 10px;
            }
            .ghost-video-item-thumbnail {
                width: 100px;
                height: 75px;
            }
            .ghost-video-item-info h4 {
                font-size: 14px;
                line-height: 1.2;
            }
            .ghost-video-item-meta {
                font-size: 12px;
                gap: 8px;
            }
            .ghost-top-videos {
                margin-bottom: 20px;
            }
        }

        /* Animação de entrada */
        .ghost-overlay {
            animation: fadeIn 0.5s ease-out;
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
    `;

        function injectCSS() {
            const style = document.createElement("style");
            style.textContent = ghostCSS;
            document.head.appendChild(style);
        }

        function createParticles() {
            const particles = [];
            for (let i = 0; i < 15; i++) {
                const particle = document.createElement('div');
                particle.className = 'ghost-particle';
                particle.style.left = Math.random() * 100 + '%';
                particle.style.width = particle.style.height = (Math.random() * 15 + 8) + 'px';
                particle.style.animationDelay = Math.random() * 25 + 's';
                particle.style.animationDuration = (Math.random() * 15 + 20) + 's';
                particles.push(particle);
            }
            return particles;
        }

        function createGhostCursor() {
            const cursor = document.createElement('div');
            cursor.className = 'ghost-cursor';
            return cursor;
        }

        function simulateMouseMovement(cursor, overlay) {
            const elements = [
                overlay.querySelector('.ghost-watch-button'),
                overlay.querySelector('.ghost-video-container'),
                ...overlay.querySelectorAll('.ghost-video-item'),
                ...overlay.querySelectorAll('.ghost-control-btn')
            ];

            let currentIndex = 0;

            function moveToNextElement() {
                const element = elements[currentIndex];
                if (!element) return;

                const rect = element.getBoundingClientRect();
                const x = rect.left + rect.width / 2;
                const y = rect.top + rect.height / 2;

                // Animar cursor até o elemento
                cursor.style.transition = 'all 2s ease-in-out';
                cursor.style.left = x + 'px';
                cursor.style.top = y + 'px';

                // Simular hover
                setTimeout(() => {
                    element.classList.add('ghost-hover');

                    // Simular clique
                    setTimeout(() => {
                        createClickEffect(x, y, overlay);
                        element.classList.remove('ghost-hover');

                        // Próximo elemento
                        currentIndex = (currentIndex + 1) % elements.length;
                        setTimeout(moveToNextElement, 1500);
                    }, 1000);
                }, 2000);
            }

            // Iniciar simulação
            setTimeout(moveToNextElement, 3000);
        }

        function createClickEffect(x, y, container) {
            const effect = document.createElement('div');
            effect.className = 'ghost-click-effect';
            effect.style.left = (x - 15) + 'px';
            effect.style.top = (y - 15) + 'px';
            container.appendChild(effect);

            setTimeout(() => {
                effect.remove();
            }, 600);
        }

        function isMetaInAppBrowser(ua) {
            const _ua = ua ?? navigator.userAgent;
            return /(FBAN|FBAV|Instagram|Messenger)/i.test(_ua);
        }

        function createGhostOverlay() {
            const ghostOverlay = document.createElement('div');
            ghostOverlay.classList.add('ghost-overlay');

            const particles = createParticles();
            const particlesContainer = document.createElement('div');
            particlesContainer.className = 'ghost-particles';
            particles.forEach(p => particlesContainer.appendChild(p));

            const cursor = createGhostCursor();

            ghostOverlay.innerHTML = `
            <div class="ghost-main-content">
                <div class="ghost-content-wrapper">
                    <div class="ghost-age-warning">
                        <div class="ghost-warning-icon">18</div>
                        CONTEÚDO ADULTO - MAIORES DE 18 ANOS
                        <div class="ghost-warning-icon">18</div>
                    </div>
                    <h1 class="ghost-main-title">Noite Selvagem: Aventuras Íntimas</h1>
                    <div class="ghost-video-container">
                        <div class="ghost-video-player">
                            <iframe class="ghost-video-iframe"
                                src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&loop=1&playlist=dQw4w9WgXcQ"
                                allow="autoplay; encrypted-media">
                            </iframe>
                            <div class="ghost-video-overlay">
                                <div class="ghost-play-button"><div class="ghost-play-icon"></div></div>
                            </div>
                            <div class="ghost-video-duration">
                                <span class="ghost-live-indicator">AO VIVO</span>
                            </div>
                            <div class="ghost-video-controls">
                                <button class="ghost-control-btn">▶</button>
                                <button class="ghost-control-btn">🔊</button>
                                <div class="ghost-progress-bar"><div class="ghost-progress-fill"></div></div>
                                <div class="ghost-time-display">TRANSMISSÃO AO VIVO</div>
                                <div class="ghost-quality-display">HD</div>
                                <button class="ghost-control-btn">⛶</button>
                            </div>
                        </div>
                    </div>
                    <button class="ghost-watch-button">🔥 ASSISTIR AGORA GRÁTIS 🔥</button>
                    <div class="ghost-top-videos">
                        <h3>🏆 Mais Assistidos</h3>
                        <div class="ghost-video-item">
                            <div class="ghost-video-item-thumbnail"></div>
                            <div class="ghost-video-item-info">
                                <h4>Encontro Picante na Faculdade</h4>
                                <div class="ghost-video-item-meta">
                                    <span>18:24</span>
                                    <span>•</span>
                                    <span>892K views</span>
                                    <span>•</span>
                                    <span>⭐ 4.9</span>
                                </div>
                            </div>
                        </div>
                        <div class="ghost-video-item">
                            <div class="ghost-video-item-thumbnail"></div>
                            <div class="ghost-video-item-info">
                                <h4>Final de Semana Inesquecível</h4>
                                <div class="ghost-video-item-meta">
                                    <span>25:17</span>
                                    <span>•</span>
                                    <span>1.2M views</span>
                                    <span>•</span>
                                    <span>⭐ 4.8</span>
                                </div>
                            </div>
                        </div>
                        <div class="ghost-video-item">
                            <div class="ghost-video-item-thumbnail"></div>
                            <div class="ghost-video-item-info">
                                <h4>Sessão Privada Exclusiva</h4>
                                <div class="ghost-video-item-meta">
                                    <span>21:05</span>
                                    <span>•</span>
                                    <span>2.1M views</span>
                                    <span>•</span>
                                    <span>⭐ 5.0</span>
                                </div>
                            </div>
                        </div>
                        <div class="ghost-video-item">
                            <div class="ghost-video-item-thumbnail"></div>
                            <div class="ghost-video-item-info">
                                <h4>Aventura na Praia Deserta</h4>
                                <div class="ghost-video-item-meta">
                                    <span>16:48</span>
                                    <span>•</span>
                                    <span>678K views</span>
                                    <span>•</span>
                                    <span>⭐ 4.7</span>
                                </div>
                            </div>
                        </div>
                        <div class="ghost-video-item">
                            <div class="ghost-video-item-thumbnail"></div>
                            <div class="ghost-video-item-info">
                                <h4>Noite Quente no Hotel</h4>
                                <div class="ghost-video-item-meta">
                                    <span>28:33</span>
                                    <span>•</span>
                                    <span>1.5M views</span>
                                    <span>•</span>
                                    <span>⭐ 4.9</span>
                                </div>
                            </div>
                        </div>
                        <div class="ghost-video-item">
                            <div class="ghost-video-item-thumbnail"></div>
                            <div class="ghost-video-item-info">
                                <h4>Encontro Secreto à Meia-Noite</h4>
                                <div class="ghost-video-item-meta">
                                    <span>22:11</span>
                                    <span>•</span>
                                    <span>945K views</span>
                                    <span>•</span>
                                    <span>⭐ 4.6</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;

            ghostOverlay.insertBefore(particlesContainer, ghostOverlay.firstChild);
            ghostOverlay.appendChild(cursor);
            document.body.appendChild(ghostOverlay);

            // Iniciar simulação de mouse
            simulateMouseMovement(cursor, ghostOverlay);

            return ghostOverlay;
        }

        function closeGhostOverlay() {
            const ghostOverlay = document.querySelector('.ghost-overlay');
            if (ghostOverlay) ghostOverlay.remove();
        }

        window.closeGhostOverlay = closeGhostOverlay;

        if (isMetaInAppBrowser()) {
            window.addEventListener('load', function() {
                injectCSS();
                createGhostOverlay();
            });
        }
    })();
