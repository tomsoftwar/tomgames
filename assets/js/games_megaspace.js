/* TOM GAMES — MEGASPACE integrado a partir do jogo fornecido. */
function initMegaSpace(suppliedCanvas){

        const view = suppliedCanvas;
        const canvas = document.createElement('canvas');
        canvas.width = 600; canvas.height = 500;
        const ctx = canvas.getContext('2d');
        let active = false;

        // ==== SPRITES PIXEL ART (Estilo Atari) ====
        const PIXEL_SIZE = 4;

        const sprShip = [
            [0,0,0,1,0,0,0],
            [0,0,1,1,1,0,0],
            [0,0,1,1,1,0,0],
            [0,1,1,1,1,1,0],
            [1,1,0,1,0,1,1],
            [1,1,1,1,1,1,1]
        ]; // Nave: 7x6 (28x24 pixels)

        const sprAliens = [
            // Tipo 1: Inseto
            [
                [0,1,0,0,0,1,0],
                [1,0,1,1,1,0,1],
                [1,1,1,1,1,1,1],
                [0,1,0,1,0,1,0],
                [1,0,0,0,0,0,1]
            ],
            // Tipo 2: Diamante / Dado
            [
                [0,0,1,1,1,0,0],
                [0,1,1,0,1,1,0],
                [1,1,1,1,1,1,1],
                [0,1,1,0,1,1,0],
                [0,0,1,1,1,0,0]
            ],
            // Tipo 3: Hambúrguer / Pneu
            [
                [0,1,1,1,1,1,0],
                [1,1,1,1,1,1,1],
                [0,0,0,0,0,0,0],
                [1,1,1,1,1,1,1],
                [0,1,1,1,1,1,0]
            ]
        ];

        function drawSprite(matrix, x, y, color) {
            ctx.fillStyle = color;
            for (let row = 0; row < matrix.length; row++) {
                for (let col = 0; col < matrix[row].length; col++) {
                    if (matrix[row][col] === 1) {
                        ctx.fillRect(x + (col * PIXEL_SIZE), y + (row * PIXEL_SIZE), PIXEL_SIZE, PIXEL_SIZE);
                    }
                }
            }
        }
        // ==========================================

        // ÁUDIO 8-BIT
        let audioCtx;
        function initAudio() {
            if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            if (audioCtx.state === 'suspended') audioCtx.resume();
        }

        function playSound(type) {
            if (!audioCtx) return;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            const now = audioCtx.currentTime;

            if (type === 'shoot') {
                osc.type = 'square';
                osc.frequency.setValueAtTime(800, now);
                osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
                gain.gain.setValueAtTime(0.05, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
                osc.start(now); osc.stop(now + 0.1);
            } else if (type === 'hit') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(200, now);
                osc.frequency.exponentialRampToValueAtTime(50, now + 0.1);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                osc.start(now); osc.stop(now + 0.1);
            } else if (type === 'die') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(100, now);
                osc.frequency.linearRampToValueAtTime(20, now + 0.5);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.linearRampToValueAtTime(0.01, now + 0.5);
                osc.start(now); osc.stop(now + 0.5);
            } else if (type === 'extralife') {
                osc.type = 'square';
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.setValueAtTime(600, now + 0.1);
                osc.frequency.setValueAtTime(800, now + 0.2);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
                osc.start(now); osc.stop(now + 0.3);
            }
        }

        // VARIÁVEIS DE JOGO
        let state = 'START';
        let score = 0, lives = 3, level = 1, energy = 100;
        let nextLifeScore = 2000;
        let introY = 500;
        let frameCount = 0;

        // Ajuste de largura e altura baseado no tamanho dos sprites em pixels
        const player = { x: 285, y: 390, w: 28, h: 24, speed: 5, cooldown: 0 };
        let bullets = [], aliens = [], alienBullets = [], particles = [];
        const keys = { left: false, right: false };

        // CONTROLES
        window.addEventListener('keydown', e => {
            if (!active) return;
            if (state === 'INTRO') { e.preventDefault(); return; }
            if (e.code === 'ArrowLeft') keys.left = true;
            if (e.code === 'ArrowRight') keys.right = true;
            if (e.code === 'Space') {
                e.preventDefault();
                initAudio();
                if (state === 'START' || state === 'GAMEOVER' || state === 'WIN') {
                    resetGame();
                    state = 'INTRO';
                    introY = canvas.height;
                } else if (state === 'PLAYING' && player.cooldown <= 0) {
                    bullets.push({ x: player.x + 12, y: player.y, w: 4, h: 10 });
                    playSound('shoot');
                    player.cooldown = 12;
                }
            }
        });
        window.addEventListener('keyup', e => {
            if (!active) return;
            if (state === 'INTRO') { e.preventDefault(); return; }
            if (e.code === 'ArrowLeft') keys.left = false;
            if (e.code === 'ArrowRight') keys.right = false;
        });

        // LÓGICA
        function resetGame() {
            score = 0; lives = 3; level = 1; nextLifeScore = 2000;
            loadLevel();
        }

        function loadLevel() {
            energy = 100;
            player.x = 285;
            bullets = []; alienBullets = []; aliens = []; particles = [];
            
            for (let r = 0; r < 4; r++) {
                for (let c = 0; c < 5; c++) {
                    aliens.push({
                        x: 100 + c * 80, y: 50 + r * 40,
                        startX: 100 + c * 80, startY: 50 + r * 40,
                        w: 28, h: 20, row: r
                    });
                }
            }
        }

        function spawnParticles(x, y, color) {
            for(let i=0; i<15; i++) {
                particles.push({
                    x: x, y: y,
                    vx: (Math.random()-0.5)*8, vy: (Math.random()-0.5)*8,
                    life: 20, color: color
                });
            }
        }

        function update() {
            frameCount++;

            if (state === 'INTRO') {
                introY -= 2;
                if (introY < -50) state = 'PLAYING';
                return;
            }

            if (state !== 'PLAYING') return;

            // Mover Player
            if (keys.left && player.x > 0) player.x -= player.speed;
            if (keys.right && player.x < canvas.width - player.w) player.x += player.speed;
            if (player.cooldown > 0) player.cooldown--;

            // Energia
            energy -= 0.05 + (level * 0.01);
            if (energy <= 0) {
                killPlayer();
                return;
            }

            // Balas Player
            for (let i = bullets.length - 1; i >= 0; i--) {
                bullets[i].y -= 8;
                let hit = false;
                
                for (let j = aliens.length - 1; j >= 0; j--) {
                    let a = aliens[j];
                    if (bullets[i] && bullets[i].x < a.x + a.w && bullets[i].x + bullets[i].w > a.x &&
                        bullets[i].y < a.y + a.h && bullets[i].y + bullets[i].h > a.y) {
                        
                        spawnParticles(a.x + a.w/2, a.y + a.h/2, getLevelColor(level));
                        playSound('hit');
                        aliens.splice(j, 1);
                        bullets.splice(i, 1);
                        score += 15;
                        hit = true;

                        if (score >= nextLifeScore) {
                            lives++;
                            nextLifeScore += 2000;
                            playSound('extralife');
                        }
                        break;
                    }
                }
                if (!hit && bullets[i] && bullets[i].y < 0) bullets.splice(i, 1);
            }

            // Atualizar Aliens
            let speedX = 1 + (level * 0.3);
            aliens.forEach(a => {
                a.x -= speedX;
                if (a.x < -30) a.x = canvas.width;

                if (level % 4 === 2) {
                    a.y = a.startY + Math.sin(frameCount * 0.05 + a.row) * 20;
                } else if (level % 4 === 3) {
                    a.y = a.startY + (Math.floor(frameCount / 30) % 2 === 0 ? 15 : -15);
                } else if (level % 4 === 0) {
                    a.y += 0.2;
                }

                if (Math.random() < 0.002 + (level * 0.001)) {
                    alienBullets.push({ x: a.x + a.w/2 - 2, y: a.y + a.h, w: 4, h: 8 });
                }

                if (a.x < player.x + player.w && a.x + a.w > player.x &&
                    a.y < player.y + player.h && a.y + a.h > player.y) {
                    killPlayer();
                }
            });

            if (aliens.length === 0) {
                score += Math.floor(energy); 
                level++;
                if (level > 10) state = 'WIN';
                else loadLevel();
            }

            // Balas Alien
            for (let i = alienBullets.length - 1; i >= 0; i--) {
                alienBullets[i].y += 4 + (level * 0.5);
                if (alienBullets[i].x < player.x + player.w && alienBullets[i].x + alienBullets[i].w > player.x &&
                    alienBullets[i].y < player.y + player.h && alienBullets[i].y + alienBullets[i].h > player.y) {
                    killPlayer();
                    break;
                }
                if (alienBullets[i] && alienBullets[i].y > 420) alienBullets.splice(i, 1);
            }

            // Partículas
            particles.forEach((p, i) => {
                p.x += p.vx; p.y += p.vy; p.life--;
                if (p.life <= 0) particles.splice(i, 1);
            });
        }

        function killPlayer() {
            playSound('die');
            spawnParticles(player.x + player.w/2, player.y + player.h/2, '#00ffff');
            lives--;
            if (lives <= 0) state = 'GAMEOVER';
            else loadLevel();
        }

        function getLevelColor(lvl) {
            const colors = ['#ff00ff', '#00ffff', '#ff5555', '#55ff55', '#ffff55'];
            return colors[(lvl - 1) % colors.length];
        }

        // DESENHO
        function drawText(txt, x, y, size, color="white", align="center") {
            ctx.fillStyle = color;
            ctx.font = `bold ${size}px 'Courier New'`;
            ctx.textAlign = align;
            ctx.fillText(txt, x, y);
        }

        function draw() {
            ctx.fillStyle = "#000";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            if (state === 'START') {
                drawText("MEGASPACE", canvas.width/2, 200, 40, "#55ff55");
                drawText("Aperte ESPAÇO", canvas.width/2, 260, 20);
                return;
            }
            if (state === 'INTRO') {
                drawText("MATE TODOS OS ALIENÍGENAS", canvas.width/2, introY, 20, "#ffcc00");
                drawText("ANTES QUE ACABE SUA ENERGIA", canvas.width/2, introY + 30, 20, "#ffcc00");
                return;
            }

            // Nave com Sprite 
            drawSprite(sprShip, player.x, player.y, "#3366ff");

            // Aliens com Sprites dinâmicos baseados no nível
            const spriteIndex = (level - 1) % sprAliens.length;
            const currentAlienSprite = sprAliens[spriteIndex];
            const color = getLevelColor(level);
            
            aliens.forEach(a => {
                drawSprite(currentAlienSprite, a.x, a.y, color);
            });

            // Tiros
            ctx.fillStyle = "#fff";
            bullets.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h));
            ctx.fillStyle = "#ff5555";
            alienBullets.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h));

            // Partículas
            particles.forEach(p => {
                ctx.fillStyle = p.color;
                ctx.fillRect(p.x, p.y, 4, 4);
            });

            // ==========================================
            // UI INFERIOR (Estilo Atari)
            // ==========================================
            ctx.fillStyle = "#aaa";
            ctx.fillRect(0, 420, canvas.width, 80);

            ctx.fillStyle = "#000";
            drawText("ENERGY", 60, 455, 18, "#000");

            // Barra de Energia
            ctx.fillStyle = "#000";
            ctx.fillRect(118, 443, 204, 14);
            ctx.fillStyle = energy > 25 ? "#ffff00" : "#ff0000";
            ctx.fillRect(120, 445, Math.max(0, energy * 2), 10);

            // Vidas (Desenhadas como pequenas naves Sprite)
            for (let i = 0; i < lives - 1; i++) {
                let lx = 350 + (i * 35);
                ctx.save();
                ctx.scale(0.7, 0.7); // Reduz o tamanho da nave para caber na UI
                drawSprite(sprShip, lx / 0.7, 440 / 0.7, "#3366ff");
                ctx.restore();
            }

            // Score e Nível
            drawText(score.toString().padStart(6, '0'), canvas.width/2, 490, 24, "#3366ff");
            drawText("LVL:" + level, canvas.width - 50, 490, 16, "#000");

            // Telas de Fim
            if (state === 'GAMEOVER') {
                ctx.fillStyle = "rgba(0,0,0,0.8)";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                drawText("GAME OVER", canvas.width/2, 220, 40, "#ff5555");
                drawText("Aperte ESPAÇO", canvas.width/2, 280, 16);
            } else if (state === 'WIN') {
                ctx.fillStyle = "rgba(0,0,0,0.8)";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                drawText("VITÓRIA!", canvas.width/2, 220, 40, "#55ff55");
                drawText("Aperte ESPAÇO", canvas.width/2, 280, 16);
            }
        }

        // LOOP PRINCIPAL
        function gameLoop() {
            if (!active) return;
            update();
            draw();
            ctx.imageSmoothingEnabled = false;
            const vctx = view.getContext('2d');
            vctx.imageSmoothingEnabled = false;
            vctx.clearRect(0,0,view.width,view.height);
            vctx.drawImage(canvas,0,0,view.width,view.height);
            requestAnimationFrame(gameLoop);
        }
        function activate(){
            active=true; resetGame(); state='INTRO'; introY=canvas.height;
            requestAnimationFrame(gameLoop);
        }
        function deactivate(){active=false;}
    
 return {activate,deactivate,isIntro:()=>state==='INTRO'};
}
