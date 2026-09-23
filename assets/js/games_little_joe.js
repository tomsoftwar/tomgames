/* TOM GAMES — LITTLE JOE integrado a partir do jogo fornecido pelo usuário. */
class LittleJoe {
    constructor(canvasElement) {

                const view = canvasElement;
                const canvas = document.createElement("canvas");
                canvas.width = 600;
                canvas.height = 300;
                const ctx = canvas.getContext("2d");
                const viewCtx = view.getContext("2d");
                const livesSpan = { innerText: "" };
                const screenEl = { innerText: "" };
                const scoreEl = { innerText: "" };
                const timerEl = { innerText: "" };

                let lives = 5;
                let currentScreen = 1;
                let score = 0;
                let timeLeft = 150;
                let gameState = "START";
                let introStartedAt = 0;
                const introDuration = 5000;
                let active = false;
                let explosionTimer = 0;
                let frameCount = 0;

                let joe = {
                    x: 40,
                    y: 204,
                    width: 24,
                    height: 32,
                    vx: 0,
                    vy: 0,
                    speed: 3.4,
                    jumpForce: -9.8,
                    gravity: 0.48,
                    isJumping: false,
                    isCrouching: false
                };

                let obstacles = [];
                let particles = [];
                let houseX = 550;
                let keys = { left: false, right: false, space: false, down: false };

                // Sistema de Som 8-bit (Web Audio API)
                let audioCtx = null;
                let bgmInterval = null;
                let noteIndex = 0;

                function initAudio() {
                    if (!audioCtx) {
                        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                    }
                    if (audioCtx.state === 'suspended') {
                        audioCtx.resume();
                    }
                }

                function playSound(freq, duration, type = 'square', vol = 0.05) {
                    if (!audioCtx) return;
                    try {
                        let osc = audioCtx.createOscillator();
                        let gain = audioCtx.createGain();
                        osc.type = type;
                        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
                
                        gain.gain.setValueAtTime(vol, audioCtx.currentTime);
                        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
                
                        osc.connect(gain);
                        gain.connect(audioCtx.destination);
                
                        osc.start();
                        osc.stop(audioCtx.currentTime + duration);
                    } catch(e) {}
                }

                function startChiptuneBGM() {
                    if (bgmInterval) return;
                    // Melodia nostálgica estilo 8-bit (Arpejo rápido)
                    const melody = [
                        261.63, 329.63, 392.00, 523.25, 392.00, 329.63,
                        220.00, 261.63, 329.63, 440.00, 329.63, 261.63,
                        246.94, 293.66, 369.99, 493.88, 369.99, 293.66,
                        220.00, 246.94, 293.66, 370.00, 293.66, 246.94
                    ];
            
                    bgmInterval = setInterval(() => {
                        if (gameState === "PLAYING" && audioCtx) {
                            playSound(melody[noteIndex], 0.12, 'square', 0.03);
                            noteIndex = (noteIndex + 1) % melody.length;
                        }
                    }, 140);
                }

                view.addEventListener("click", () => {
                    if (typeof switchGame === "function") switchGame("littleJoe");
                    active = true;
                    window.tomActiveGame = "littleJoe";
                    initAudio();
                    startChiptuneBGM();
                    if (gameState === "START" || gameState === "GAMEOVER" || gameState === "WIN") {
                        playSound(587.33, 0.1, 'square', 0.08); // Som de clique/início
                        resetGame();
                    }
                });

                window.addEventListener("keydown", (e) => {
                    if (window.tomActiveGame !== "littleJoe") return;
                    if (gameState === "INTRO") { e.preventDefault(); return; }
                    initAudio();
                    startChiptuneBGM();
                    if (e.code === "ArrowLeft") keys.left = true;
                    if (e.code === "ArrowRight") keys.right = true;
                    if (e.code === "Space") {
                        if (gameState === "START" || gameState === "GAMEOVER" || gameState === "WIN") {
                            playSound(587.33, 0.1, 'square', 0.08);
                            resetGame();
                            e.preventDefault();
                            return;
                        }
                        if (!joe.isJumping && !joe.isCrouching && gameState === "PLAYING") {
                            playSound(440, 0.15, 'triangle', 0.06); // Efeito de Pulo
                            joe.vy = joe.jumpForce;
                            joe.isJumping = true;
                        }
                        e.preventDefault();
                    }
                    if (e.code === "ArrowDown") {
                        if (!joe.isJumping && gameState === "PLAYING" && !joe.isCrouching) {
                            joe.isCrouching = true;
                            joe.height = 16;
                            joe.y += 16;
                        }
                    }
                });

                window.addEventListener("keyup", (e) => {
                    if (window.tomActiveGame !== "littleJoe") return;
                    if (e.code === "ArrowLeft") keys.left = false;
                    if (e.code === "ArrowRight") keys.right = false;
                    if (e.code === "ArrowDown") {
                        if (joe.isCrouching) {
                            joe.y -= 16;
                            joe.height = 32;
                            joe.isCrouching = false;
                        }
                    }
                });

                setInterval(() => {
                    if (gameState === "PLAYING") {
                        timeLeft--;
                        timerEl.innerText = timeLeft;
                        if (timeLeft <= 0) {
                            playSound(110, 0.6, 'sawtooth', 0.1);
                            gameState = "EXPLODING";
                            explosionTimer = 60;
                        }
                    }
                }, 1000);

                function resetGame() {
                    lives = 5;
                    score = 0;
                    timeLeft = 150;
                    livesSpan.innerText = lives;
                    scoreEl.innerText = score;
                    timerEl.innerText = timeLeft;
                    loadScreen(1);
                    gameState = "INTRO";
                    introStartedAt = performance.now();
                }

                function loadScreen(screenNum) {
                    currentScreen = screenNum;
                    screenEl.innerText = currentScreen;
                    joe.x = 30;
                    joe.y = 204;
                    obstacles = [];
                    particles = [];

                    let obstacleCount = 1 + screenNum; 
                    let types = ['stone', 'pit', 'snake', 'spider', 'scorpion', 'bat'];

                    for (let i = 0; i < obstacleCount; i++) {
                        let typeIndex = Math.min(Math.floor((screenNum - 1) * 0.75), types.length - 1);
                        let obsType = types[typeIndex];
                
                        let obsY = 218;
                        if (obsType === 'bat') {
                            obsY = 175;
                        } else if (obsType === 'spider') {
                            obsY = 190;
                        }

                        obstacles.push({
                            x: 170 + (i * 90) + Math.random() * 20,
                            y: obsY,
                            width: 24,
                            height: 24,
                            type: obsType,
                            passed: false,
                            speedX: screenNum >= 3 ? (Math.random() > 0.5 ? 1 : -1) * (0.5 + screenNum * 0.18) : 0
                        });
                    }

                    let climate = getClimateTheme(screenNum).type;
                    if (climate === 'snow' || climate === 'rain' || climate === 'storm') {
                        for(let p=0; p<40; p++) {
                            particles.push({
                                x: Math.random() * canvas.width,
                                y: Math.random() * canvas.height,
                                speed: climate === 'snow' ? 1.5 : 6,
                                size: climate === 'snow' ? 3 : 2
                            });
                        }
                    }
                }

                function getClimateTheme(screenNum) {
                    const themes = [
                        { sky: "#101820", ground: "#224411", name: "Noite Estrelada", type: "night" },
                        { sky: "#3388cc", ground: "#226611", name: "Dia Ensolarado", type: "day" },
                        { sky: "#445566", ground: "#334422", name: "Chuva Fina", type: "rain" },
                        { sky: "#1a1a2b", ground: "#2b2b1a", name: "Tempestade Escura", type: "storm" },
                        { sky: "#cceeff", ground: "#aabbbb", name: "Neve Fria", type: "snow" },
                        { sky: "#552233", ground: "#441a1a", name: "Entardecer Chuvoso", type: "rain" },
                        { sky: "#ff7700", ground: "#553311", name: "Pôr do Sol (Casa)", type: "sunset" }
                    ];
                    return themes[screenNum - 1];
                }

                function update() {
                    frameCount++;
                    if (gameState === "INTRO") {
                        if (performance.now() - introStartedAt >= introDuration) gameState = "PLAYING";
                        return;
                    }
                    if (gameState === "EXPLODING") {
                        explosionTimer--;
                        if (explosionTimer <= 0) gameState = "GAMEOVER";
                        return;
                    }

                    if (gameState !== "PLAYING") return;

                    joe.vx = 0;
                    if (keys.left) joe.vx = -joe.speed;
                    if (keys.right) joe.vx = joe.speed;
                    joe.x += joe.vx;

                    if (joe.x < 0) joe.x = 0;
            
                    if (joe.x > houseX) {
                        if (currentScreen < 7) {
                            loadScreen(currentScreen + 1);
                        } else {
                            playSound(659.25, 0.4, 'square', 0.08);
                            gameState = "WIN";
                        }
                    }

                    joe.vy += joe.gravity;
                    joe.y += joe.vy;

                    let floorY = joe.isCrouching ? 220 : 204;
                    if (joe.y > floorY) {
                        joe.y = floorY;
                        joe.vy = 0;
                        joe.isJumping = false;
                    }

                    let theme = getClimateTheme(currentScreen);
                    particles.forEach(p => {
                        p.y += p.speed;
                        if (p.y > canvas.height) {
                            p.y = 0;
                            p.x = Math.random() * canvas.width;
                        }
                    });

                    obstacles.forEach(obs => {
                        obs.x += obs.speedX;
                        if (obs.x < 120 || obs.x > 500) obs.speedX *= -1;

                        if (!obs.passed && joe.x > obs.x + obs.width) {
                            obs.passed = true;
                            score += 10;
                            scoreEl.innerText = score;
                        }

                        if (
                            joe.x < obs.x + obs.width &&
                            joe.x + joe.width > obs.x &&
                            joe.y < obs.y + obs.height &&
                            joe.y + joe.height > obs.y
                        ) {
                            playSound(150, 0.2, 'sawtooth', 0.08); // Som de Dano
                            lives--;
                            livesSpan.innerText = lives;
                            joe.x -= 40; 
                            if (lives <= 0) {
                                playSound(90, 0.5, 'sawtooth', 0.1);
                                gameState = "GAMEOVER";
                            }
                        }
                    });
                }

                function drawPixelArtJoe(x, y) {
                    ctx.fillStyle = "rgba(0,0,0,0.3)";
                    ctx.fillRect(x + 2, y + joe.height - 2, 20, 2);

                    let isMoving = (keys.left || keys.right) && !joe.isJumping;
                    let legAnim = isMoving ? Math.floor(frameCount / 6) % 2 : 0;

                    if (joe.isCrouching) {
                        ctx.fillStyle = "#ff3333";
                        ctx.fillRect(x + 4, y, 16, 4);
                        ctx.fillStyle = "#ffccaa";
                        ctx.fillRect(x + 5, y + 4, 14, 6);
                        ctx.fillStyle = "#0044cc";
                        ctx.fillRect(x + 3, y + 10, 18, 6);
                    } else {
                        ctx.fillStyle = "#ff3333";
                        ctx.fillRect(x + 6, y, 12, 5);
                        ctx.fillStyle = "#ffccaa";
                        ctx.fillRect(x + 6, y + 5, 12, 8);
                        ctx.fillStyle = "#000";
                        ctx.fillRect(x + 9, y + 8, 2, 2);
                        ctx.fillRect(x + 13, y + 8, 2, 2);
                
                        ctx.fillStyle = "#0044cc";
                        ctx.fillRect(x + 5, y + 13, 14, 11);
                        ctx.fillStyle = "#ffffff";
                        ctx.fillRect(x + 11, y + 13, 2, 11);

                        ctx.fillStyle = "#ffccaa";
                        if (isMoving) {
                            if (legAnim === 0) {
                                ctx.fillRect(x + 2, y + 15, 3, 6);
                                ctx.fillRect(x + 19, y + 13, 3, 6);
                            } else {
                                ctx.fillRect(x + 2, y + 13, 3, 6);
                                ctx.fillRect(x + 19, y + 15, 3, 6);
                            }
                        } else {
                            ctx.fillRect(x + 2, y + 14, 3, 6);
                            ctx.fillRect(x + 19, y + 14, 3, 6);
                        }

                        ctx.fillStyle = "#002266";
                        if (isMoving) {
                            if (legAnim === 0) {
                                ctx.fillRect(x + 6, y + 24, 4, 8);
                                ctx.fillRect(x + 14, y + 22, 4, 8);
                            } else {
                                ctx.fillRect(x + 8, y + 22, 4, 8);
                                ctx.fillRect(x + 12, y + 24, 4, 8);
                            }
                        } else {
                            ctx.fillRect(x + 6, y + 24, 5, 8);
                            ctx.fillRect(x + 13, y + 24, 5, 8);
                        }
                    }
                }

                function drawObstacle(obs) {
                    let x = obs.x, y = obs.y;
                    if (obs.type === 'stone') {
                        ctx.fillStyle = "#666";
                        ctx.fillRect(x + 2, y + 8, 20, 16);
                        ctx.fillStyle = "#999";
                        ctx.fillRect(x + 4, y + 10, 6, 4);
                    } else if (obs.type === 'pit') {
                        ctx.fillStyle = "#0a0a14";
                        ctx.fillRect(x, y + 12, 24, 14);
                        ctx.fillStyle = "#220033";
                        ctx.fillRect(x + 4, y + 18, 16, 4);
                    } else if (obs.type === 'snake') {
                        ctx.fillStyle = "#00aa33";
                        ctx.fillRect(x, y + 16, 24, 8);
                        ctx.fillStyle = "#00ff44";
                        let wave = Math.floor(frameCount / 10) % 2 === 0;
                        ctx.fillRect(x + 6, y + (wave ? 12 : 14), 12, 6);
                        ctx.fillStyle = "#ffff00";
                        ctx.fillRect(x + 2, y + 14, 2, 2);
                        if (Math.floor(frameCount / 15) % 2 === 0) {
                            ctx.fillStyle = "#ff0000";
                            ctx.fillRect(x - 3, y + 18, 3, 2);
                        }
                    } else if (obs.type === 'spider') {
                        ctx.fillStyle = "#8800cc";
                        ctx.fillRect(x + 6, y + 10, 12, 10);
                        ctx.fillStyle = "#ff0055";
                        ctx.fillRect(x + 8, y + 12, 2, 2);
                        ctx.fillRect(x + 14, y + 12, 2, 2);
                        ctx.fillStyle = "#330044";
                        let pAnim = Math.floor(frameCount / 8) % 2;
                        ctx.fillRect(x, y + (pAnim === 0 ? 8 : 12), 6, 4);
                        ctx.fillRect(x + 18, y + (pAnim === 0 ? 12 : 8), 6, 4);
                    } else if (obs.type === 'scorpion') {
                        ctx.fillStyle = "#ff4500";
                        ctx.fillRect(x + 4, y + 14, 16, 10);
                        ctx.fillStyle = "#cc0000";
                        ctx.fillRect(x, y + 14, 4, 4);
                        ctx.fillRect(x + 16, y + 6, 4, 10);
                        ctx.fillRect(x + 12, y + 4, 6, 4);
                        ctx.fillStyle = "#ffff00";
                        ctx.fillRect(x + 12, y + 2, 2, 2);
                    } else if (obs.type === 'bat') {
                        let wingFlap = Math.floor(frameCount / 6) % 2 === 0;
                        ctx.fillStyle = "#222233";
                        ctx.fillRect(x + 8, y + 10, 8, 8);
                        ctx.fillStyle = "#ff0000";
                        ctx.fillRect(x + 9, y + 11, 2, 2);
                        ctx.fillRect(x + 13, y + 11, 2, 2);
                        ctx.fillStyle = "#444455";
                        if (wingFlap) {
                            ctx.fillRect(x, y + 4, 8, 8);
                            ctx.fillRect(x + 16, y + 4, 8, 8);
                        } else {
                            ctx.fillRect(x, y + 12, 8, 6);
                            ctx.fillRect(x + 16, y + 12, 8, 6);
                        }
                    }
                }

                function drawBackground() {
                    let theme = getClimateTheme(currentScreen);

                    ctx.fillStyle = theme.sky;
                    ctx.fillRect(0, 0, canvas.width, 228);

                    if (theme.type === 'night') {
                        ctx.fillStyle = "#ffffff";
                        ctx.fillRect(100, 40, 2, 2);
                        ctx.fillRect(250, 70, 2, 2);
                        ctx.fillRect(450, 30, 2, 2);
                        ctx.fillRect(520, 90, 2, 2);
                    } else if (theme.type === 'snow') {
                        ctx.fillStyle = "#ffffff";
                        particles.forEach(p => ctx.fillRect(p.x, p.y, p.size, p.size));
                    } else if (theme.type === 'rain' || theme.type === 'storm') {
                        ctx.strokeStyle = "#88ccff";
                        ctx.lineWidth = 1;
                        particles.forEach(p => {
                            ctx.beginPath();
                            ctx.moveTo(p.x, p.y);
                            ctx.lineTo(p.x - 2, p.y + 10);
                            ctx.stroke();
                        });
                    }

                    ctx.fillStyle = theme.ground;
                    ctx.fillRect(0, 228, canvas.width, 72);
                    ctx.fillStyle = "#1a110a";
                    ctx.fillRect(0, 260, canvas.width, 40);

                    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
                    ctx.font = "10px 'Courier New'";
                    ctx.fillText(`FASE ${currentScreen}: ${theme.name.toUpperCase()}`, 15, 20);
                }

                function draw() {
                    if (gameState === "START") {
                        ctx.fillStyle = "#0a0a1a";
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                        ctx.fillStyle = "#ffaa00";
                        ctx.font = "bold 28px 'Courier New'";
                        ctx.fillText("LITTLE JOE", 190, 45);

                        ctx.fillStyle = "#00ffff";
                        ctx.font = "13px 'Courier New'";
                        ctx.fillText("AJUDE O PEQUENO JOE A CHEGAR EM CASA,", 110, 85);
                        ctx.fillText("MAS, NÃO SERÁ FÁCIL!", 185, 108);

                        ctx.fillStyle = "#ffffff";
                        ctx.font = "11px 'Courier New'";
                        ctx.fillText("Desvie de lagos, buracos, pedras, cobras,", 130, 145);
                        ctx.fillText("aranhas, escorpiões e morcegos voadores!", 115, 165);

                        ctx.fillStyle = "#ff5555";
                        ctx.font = "11px 'Courier New'";
                        ctx.fillText("(Trilha Sonora 8-bit & Efeitos Sonoros Ativos)", 130, 195);

                        if (Math.floor(frameCount / 25) % 2 === 0) {
                            ctx.fillStyle = "#00ff66";
                            ctx.font = "bold 15px 'Courier New'";
                            ctx.fillText("[ CLIQUE AQUI PARA INICIAR ]", 155, 235);
                        }
                        return;
                    }

                    drawBackground();

                    if (gameState === "EXPLODING") {
                        ctx.fillStyle = Math.random() > 0.5 ? "#ff2200" : "#ffcc00";
                        ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 150 + Math.random() * 150, 150 + Math.random() * 150);
                        ctx.fillStyle = "#ffffff";
                        ctx.font = "bold 32px 'Courier New'";
                        ctx.fillText("EXPLOSÃO!", 190, 150);
                        return;
                    }

                    if (gameState === "GAMEOVER") {
                        ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                        ctx.fillStyle = "#ff0000";
                        ctx.font = "bold 36px 'Courier New'";
                        ctx.fillText("GAME OVER", 180, 130);
                        ctx.font = "14px 'Courier New'";
                        ctx.fillStyle = "#fff";
                        ctx.fillText("O tempo acabou e tudo explodiu!", 160, 170);
                
                        if (Math.floor(frameCount / 25) % 2 === 0) {
                            ctx.fillStyle = "#00ff66";
                            ctx.font = "bold 14px 'Courier New'";
                            ctx.fillText("[ CLIQUE PARA TENTAR NOVAMENTE ]", 140, 215);
                        }
                        return;
                    }

                    if (gameState === "WIN") {
                        ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                        ctx.fillStyle = "#00ff66";
                        ctx.font = "bold 32px 'Courier New'";
                        ctx.fillText("PARABÉNS, JOE!", 160, 110);
                        ctx.font = "15px 'Courier New'";
                        ctx.fillStyle = "#fff";
                        ctx.fillText(`Você chegou em casa com segurança!`, 130, 150);
                        ctx.fillText(`Pontuação Final: ${score} pts`, 175, 185);
                
                        if (Math.floor(frameCount / 25) % 2 === 0) {
                            ctx.fillStyle = "#ffff00";
                            ctx.font = "bold 14px 'Courier New'";
                            ctx.fillText("[ CLIQUE PARA JOGAR NOVAMENTE ]", 145, 230);
                        }
                        return;
                    }

                    if (currentScreen === 7) {
                        ctx.fillStyle = "#663300";
                        ctx.fillRect(houseX - 15, 160, 60, 68);
                        ctx.fillStyle = "#ffcc00";
                        ctx.fillRect(houseX + 5, 175, 14, 14);
                        ctx.fillStyle = "#331100";
                        ctx.fillRect(houseX + 25, 188, 16, 40);
                        ctx.fillStyle = "#aa1111";
                        ctx.beginPath();
                        ctx.moveTo(houseX - 25, 160);
                        ctx.lineTo(houseX + 15, 105);
                        ctx.lineTo(houseX + 55, 160);
                        ctx.fill();
                    } else {
                        ctx.fillStyle = "#ffffff";
                        ctx.fillRect(houseX + 10, 180, 6, 48);
                        ctx.fillStyle = "#00ffcc";
                        ctx.fillRect(houseX, 180, 26, 16);
                        ctx.fillStyle = "#000000";
                        ctx.font = "10px 'Courier New'";
                        ctx.fillText(">>>", houseX + 5, 192);
                    }

                    drawPixelArtJoe(joe.x, joe.y);
                    obstacles.forEach(obs => drawObstacle(obs));
                }

                function activate() {
                    active = true;
                    if (typeof switchGame === "function" && window.tomActiveGame !== "littleJoe") switchGame("littleJoe");
                    initAudio();
                    startChiptuneBGM();
                    resetGame();
                    requestAnimationFrame(loop);
                }

                function deactivate() {
                    active = false;
                    gameState = "START";
                    keys = { left: false, right: false, space: false, down: false };
                }

                function loop() {
                    if (!active) return;
                    frameCount++;
                    update();
                    draw();
                    viewCtx.imageSmoothingEnabled = false;
                    viewCtx.clearRect(0, 0, view.width, view.height);
                    viewCtx.drawImage(canvas, 0, 0, view.width, view.height);
                    requestAnimationFrame(loop);
                }
    
        this.activate = activate;
        this.deactivate = deactivate;
        this.isIntro = () => gameState === "INTRO";
    }
}
window.littleJoeGame = null;
function initLittleJoe(canvas) {
    window.littleJoeGame = new LittleJoe(canvas);
    return window.littleJoeGame;
}
