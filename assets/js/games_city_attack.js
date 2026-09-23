class CityAttack {
  constructor(canvas){
    this.canvas = canvas;
    this.active = false;
    this.controller = initCityAttack(canvas);
  }
  activate(){ if(this.controller) this.controller.activate(); }
  deactivate(){ if(this.controller) this.controller.deactivate(); }
}

function initCityAttack(suppliedCanvas){
  let active = false;

const gameCanvas = suppliedCanvas;
        const canvas = gameCanvas;
/* canvas fornecido pelo TOM GAMES */
        const ctx = canvas.getContext('2d');

        // ==== SISTEMA DE ÁUDIO 8-BIT ====
        let audioCtx;
        
        function initAudio() {
            if (!audioCtx) {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
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
                osc.frequency.setValueAtTime(300, now);
                osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
                gain.gain.setValueAtTime(0.05, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
            } 
            else if (type === 'hit') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(150, now);
                osc.frequency.exponentialRampToValueAtTime(40, now + 0.2);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
            }
            else if (type === 'planeHit') {
                osc.type = 'square';
                osc.frequency.setValueAtTime(100, now);
                osc.frequency.exponentialRampToValueAtTime(20, now + 0.3);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                osc.start(now);
                osc.stop(now + 0.3);
            }
            else if (type === 'buildingHit') {
                osc.type = 'square';
                osc.frequency.setValueAtTime(100, now);
                osc.frequency.linearRampToValueAtTime(50, now + 0.4);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.linearRampToValueAtTime(0.01, now + 0.4);
                osc.start(now);
                osc.stop(now + 0.4);
            }
            else if (type === 'gameover') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(200, now);
                osc.frequency.linearRampToValueAtTime(50, now + 1);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.linearRampToValueAtTime(0.01, now + 1);
                osc.start(now);
                osc.stop(now + 1);
            }
            else if (type === 'win') {
                osc.type = 'square';
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.setValueAtTime(500, now + 0.2);
                osc.frequency.setValueAtTime(600, now + 0.4);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.6);
                osc.start(now);
                osc.stop(now + 0.6);
            }
        }
        // ===================================

        // Estados do jogo
                let gameState = 'START';
        let score = 0;
        let level = 1;
        let introY = canvas.height;
        let endScreenTime = 0; // Controla os 7 segundos de espera
        
        let buildings = [];
        let planes = [];
        let paratroopers = [];
        let bombs = [];
        let bullets = [];
        let particles = []; 

        const cannon = {
            x: canvas.width / 2,
            y: canvas.height - 40,
            angle: -Math.PI / 2,
            cooldown: 0
        };

        const keys = { ArrowLeft: false, ArrowRight: false, Space: false };

        window.addEventListener('keydown', (e) => {
            if (!active) return;
            if (e.code === 'ArrowLeft') keys.ArrowLeft = true;
            if (e.code === 'ArrowRight') keys.ArrowRight = true;
            if (e.code === 'Space') {
                e.preventDefault(); 
                initAudio(); 
                
                if (gameState === 'START') {
                    gameState = 'INTRO';
                    introY = canvas.height;
                } else if (gameState === 'GAMEOVER' || gameState === 'WIN') {
                    // Só permite reiniciar após 7 segundos
                    if (Date.now() - endScreenTime >= 7000) {
                        gameState = 'START';
                    }
                } else if (gameState === 'PLAYING') {
                    shoot();
                }
            }
        });

        window.addEventListener('keyup', (e) => {
            if (!active) return;
            if (e.code === 'ArrowLeft') keys.ArrowLeft = false;
            if (e.code === 'ArrowRight') keys.ArrowRight = false;
        });

        function initGame() {
            score = 0;
            level = 1;
            cannon.angle = -Math.PI / 2;
            
            buildings = [
                { x: 50, y: canvas.height - 40, hp: 3, width: 40 },
                { x: 120, y: canvas.height - 40, hp: 3, width: 40 },
                { x: canvas.width - 160, y: canvas.height - 40, hp: 3, width: 40 },
                { x: canvas.width - 90, y: canvas.height - 40, hp: 3, width: 40 }
            ];
            
            planes = [];
            paratroopers = [];
            bombs = [];
            bullets = [];
            particles = [];
        }

        function shoot() {
            if (cannon.cooldown <= 0) {
                playSound('shoot');
                bullets.push({
                    x: cannon.x + Math.cos(cannon.angle) * 20,
                    y: cannon.y + Math.sin(cannon.angle) * 20,
                    vx: Math.cos(cannon.angle) * 10,
                    vy: Math.sin(cannon.angle) * 10
                });
                cannon.cooldown = 12;
            }
        }

        function createExplosion(x, y, color) {
            for (let i = 0; i < 12; i++) {
                particles.push({
                    x: x, y: y,
                    vx: (Math.random() - 0.5) * 6,
                    vy: (Math.random() - 0.5) * 6,
                    life: 20 + Math.random() * 10,
                    color: color
                });
            }
        }

        function update() {
            if (gameState === 'INTRO') {
                introY -= 1.5;
                if (introY < -50) {
                    initGame();
                    gameState = 'PLAYING';
                }
                return;
            }

            if (gameState !== 'PLAYING') return;

            level = Math.floor(score / 300) + 1;
            
            // Condição de Vitória
            if (score >= 1200) {
                playSound('win');
                gameState = 'WIN';
                endScreenTime = Date.now();
                return;
            }

            // Movimento do Canhão
            if (keys.ArrowLeft && cannon.angle > -Math.PI + 0.2) cannon.angle -= 0.06;
            if (keys.ArrowRight && cannon.angle < -0.2) cannon.angle += 0.06;
            if (cannon.cooldown > 0) cannon.cooldown--;

            // Aviões
            let planeSpawnRate = 0.01 + (level * 0.005);
            if (Math.random() < planeSpawnRate && planes.length < 3) {
                let yPos = 30 + Math.random() * 60;
                let isLeft = Math.random() > 0.5;
                planes.push({
                    x: isLeft ? -40 : canvas.width + 40,
                    y: yPos,
                    vx: (isLeft ? 1 : -1) * (2 + level * 0.5)
                });
            }

            let maxParatroopers = level; 
            let dropParaRate = 0.005 + (level * 0.008); 
            let dropBombRate = 0.003 + (level * 0.005); // Chance de soltar bomba

            planes.forEach((plane, pIndex) => {
                plane.x += plane.vx * 0.55;
                
                // Soltar paraquedistas
                if (Math.random() < dropParaRate && 
                    plane.x > 30 && plane.x < canvas.width - 30 &&
                    paratroopers.length < maxParatroopers) {
                    paratroopers.push({
                        x: plane.x, y: plane.y + 15, vy: 1 + (level * 0.15)
                    });
                }

                // Soltar bombas (direção aos prédios)
                if (Math.random() < dropBombRate && plane.x > 30 && plane.x < canvas.width - 30) {
                    bombs.push({
                        x: plane.x, y: plane.y + 10, vy: 2 + (level * 0.2) // Bombas caem mais rápido
                    });
                }

                if (plane.x < -100 || plane.x > canvas.width + 100) {
                    planes.splice(pIndex, 1);
                }
            });

            // Atualiza Bombas
            bombs.forEach((bomb, bIndex) => {
                bomb.y += bomb.vy * 0.55;
                if (bomb.y >= canvas.height - 40) {
                    let hitBuilding = false;
                    buildings.forEach(b => {
                        if (b.hp > 0 && bomb.x > b.x - 10 && bomb.x < b.x + b.width + 10) {
                            b.hp--;
                            hitBuilding = true;
                            playSound('buildingHit');
                            createExplosion(b.x + b.width/2, b.y, "#ff0000"); // Explosão grande de fogo
                        }
                    });
                    
                    if(!hitBuilding) playSound('hit');
                    createExplosion(bomb.x, bomb.y, "#ff6600");
                    bombs.splice(bIndex, 1);
                }
            });

            // Atualiza Paraquedistas
            paratroopers.forEach((para, pIndex) => {
                para.y += para.vy * 0.55;
                if (para.y >= canvas.height - 40) {
                    let hitBuilding = false;
                    buildings.forEach(b => {
                        if (b.hp > 0 && para.x > b.x - 10 && para.x < b.x + b.width + 10) {
                            b.hp--;
                            hitBuilding = true;
                            playSound('buildingHit');
                            createExplosion(b.x + b.width/2, b.y, "#ff8800");
                        }
                    });
                    
                    if(!hitBuilding) playSound('hit');
                    createExplosion(para.x, para.y, "#888");
                    paratroopers.splice(pIndex, 1);
                }
            });

            // Condição de Derrota
            if (buildings.every(b => b.hp <= 0)) {
                playSound('gameover');
                gameState = 'GAMEOVER';
                endScreenTime = Date.now();
            }

            // Balas e Colisões (com Soldados, Bombas e Aviões)
            bullets.forEach((bullet, bIndex) => {
                bullet.x += bullet.vx * 0.65;
                bullet.y += bullet.vy * 0.65;
                let hit = false;

                // 1. Atingiu Paraquedista (10 pts)
                paratroopers.forEach((para, pIndex) => {
                    if (!hit && Math.abs(bullet.x - para.x) < 15 && Math.abs(bullet.y - para.y) < 15) {
                        playSound('hit');
                        createExplosion(para.x, para.y, "#fff");
                        paratroopers.splice(pIndex, 1);
                        score += 10;
                        hit = true;
                    }
                });

                // 2. Atingiu Bomba (5 pts - bônus defensivo)
                bombs.forEach((bomb, pIndex) => {
                    if (!hit && Math.abs(bullet.x - bomb.x) < 12 && Math.abs(bullet.y - bomb.y) < 12) {
                        playSound('hit');
                        createExplosion(bomb.x, bomb.y, "#ffcc00");
                        bombs.splice(pIndex, 1);
                        score += 5;
                        hit = true;
                    }
                });

                // 3. Atingiu Avião (20 pts)
                planes.forEach((plane, pIndex) => {
                    if (!hit && bullet.x > plane.x - 20 && bullet.x < plane.x + 20 &&
                                bullet.y > plane.y - 10 && bullet.y < plane.y + 10) {
                        playSound('planeHit');
                        createExplosion(plane.x, plane.y, "#ff4400"); // Grande explosão
                        planes.splice(pIndex, 1);
                        score += 20;
                        hit = true;
                    }
                });

                if (hit || bullet.x < 0 || bullet.x > canvas.width || bullet.y < 0) {
                    bullets.splice(bIndex, 1);
                }
            });

            particles.forEach((p, i) => {
                p.x += p.vx * 0.55;
                p.y += p.vy * 0.55;
                p.life--;
                if (p.life <= 0) particles.splice(i, 1);
            });
        }

        function drawText(text, x, y, size, color = "white", align = "center") {
            ctx.fillStyle = color;
            ctx.font = `${size}px 'Press Start 2P'`;
            ctx.textAlign = align;
            ctx.fillText(text, x, y);
        }

        function draw() {
            if (gameState === 'PLAYING' || gameState === 'GAMEOVER' || gameState === 'WIN') {
                // Céu
                let sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
                sky.addColorStop(0, "#3e529e"); 
                sky.addColorStop(0.5, "#a1489e"); 
                sky.addColorStop(1, "#c77538"); 
                ctx.fillStyle = sky;
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Chão
                ctx.fillStyle = "#5c4a16";
                ctx.beginPath();
                ctx.moveTo(0, canvas.height - 40);
                ctx.lineTo(canvas.width / 2 - 60, canvas.height - 40);
                ctx.lineTo(canvas.width / 2 - 20, canvas.height - 10);
                ctx.lineTo(canvas.width / 2 + 20, canvas.height - 10);
                ctx.lineTo(canvas.width / 2 + 60, canvas.height - 40);
                ctx.lineTo(canvas.width, canvas.height - 40);
                ctx.lineTo(canvas.width, canvas.height);
                ctx.lineTo(0, canvas.height);
                ctx.fill();

                // Prédios
                buildings.forEach(b => {
                    if (b.hp > 0) {
                        ctx.fillStyle = "#0a7516";
                        let height = b.hp * 15;
                        ctx.fillRect(b.x, canvas.height - 40 - height, b.width, height);
                        
                        ctx.fillStyle = "#ffff00";
                        for (let h = 0; h < b.hp; h++) {
                            ctx.fillRect(b.x + 5, canvas.height - 40 - (h*15) - 10, 8, 5);
                            ctx.fillRect(b.x + b.width - 13, canvas.height - 40 - (h*15) - 10, 8, 5);
                        }
                    }
                });

                // Canhão
                ctx.fillStyle = "#555";
                ctx.fillRect(canvas.width/2 - 15, canvas.height - 40, 30, 20);
                ctx.fillRect(canvas.width/2 - 5, canvas.height - 50, 10, 10);
                
                ctx.save();
                ctx.translate(canvas.width/2, canvas.height - 45);
                ctx.rotate(cannon.angle);
                ctx.fillStyle = "#999";
                ctx.fillRect(0, -4, 25, 8);
                ctx.restore();

                // Aviões
                planes.forEach(plane => {
                    ctx.save();
                    ctx.translate(plane.x, plane.y);
                    if (plane.vx < 0) ctx.scale(-1, 1);
                    ctx.fillStyle = "#2d8a3a"; 
                    ctx.fillRect(-20, -5, 40, 10);
                    ctx.fillRect(-20, -12, 8, 10);
                    ctx.fillStyle = "#999";
                    ctx.fillRect(20, -4, 3, 8);
                    ctx.fillStyle = "#87ceeb"; 
                    ctx.fillRect(5, -9, 10, 4);
                    ctx.fillStyle = "#1a5e24";
                    ctx.fillRect(-5, 2, 18, 5);
                    ctx.restore();
                });

                // Bombas
                bombs.forEach(bomb => {
                    ctx.fillStyle = "#111"; // Corpo da bomba
                    ctx.fillRect(bomb.x - 4, bomb.y - 6, 8, 12);
                    ctx.fillStyle = "#f00"; // Ponta vermelha (estilo Atari)
                    ctx.fillRect(bomb.x - 2, bomb.y + 6, 4, 2);
                });

                // Paraquedistas
                paratroopers.forEach(para => {
                    ctx.fillStyle = "#fff";
                    ctx.beginPath();
                    ctx.arc(para.x, para.y - 12, 12, Math.PI, 0);
                    ctx.fill();
                    ctx.strokeStyle = "#fff";
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(para.x - 12, para.y - 12); ctx.lineTo(para.x, para.y);
                    ctx.moveTo(para.x + 12, para.y - 12); ctx.lineTo(para.x, para.y);
                    ctx.stroke();
                    ctx.fillStyle = "#fff";
                    ctx.fillRect(para.x - 2, para.y, 4, 10);
                    ctx.fillRect(para.x - 6, para.y + 2, 12, 3);
                    ctx.fillRect(para.x - 4, para.y + 10, 3, 6);
                    ctx.fillRect(para.x + 1, para.y + 10, 3, 6);
                });

                // Balas
                ctx.fillStyle = "#000000";
                bullets.forEach(bullet => {
                    ctx.fillRect(bullet.x - 2, bullet.y - 2, 4, 4);
                });

                // Partículas
                particles.forEach(p => {
                    ctx.fillStyle = p.color;
                    ctx.fillRect(p.x, p.y, 4, 4);
                });

                // HUD
                drawText(score.toString().padStart(4, '0'), canvas.width / 2, 30, 20);
                drawText(`LVL:${level}`, canvas.width - 60, 30, 10);
            }

            // MENSAGENS DE TELA
            if (gameState === 'START') {
                ctx.fillStyle = "black";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                drawText("CITY ATTACK", canvas.width / 2, canvas.height / 2 - 30, 30, "#00ff00");
                drawText("APERTE ESPACO", canvas.width / 2, canvas.height / 2 + 30, 16);
            } 
            else if (gameState === 'INTRO') {
                ctx.fillStyle = "black";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                drawText("A CIDADE ESTÁ SENDO ATACADA,", canvas.width / 2, introY, 14, "#ffcc00");
                drawText("DEFENDA-A!", canvas.width / 2, introY + 30, 14, "#ffcc00");
            }
            else if (gameState === 'GAMEOVER' || gameState === 'WIN') {
                ctx.fillStyle = "rgba(0,0,0,0.85)";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                if (gameState === 'GAMEOVER') {
                    drawText("GAME OVER", canvas.width / 2, canvas.height / 2, 30, "#ff0000");
                } else {
                    drawText("PARABÉNS!", canvas.width / 2, canvas.height / 2 - 20, 24, "#00ff00");
                    drawText("VOCÊ SALVOU A CIDADE!", canvas.width / 2, canvas.height / 2 + 20, 16, "#00ff00");
                }

                // Lógica de tempo de espera (7 segundos = 7000 ms)
                let timePassed = Date.now() - endScreenTime;
                if (timePassed >= 7000) {
                    drawText("APERTE ESPACO PARA REINICIAR", canvas.width / 2, canvas.height / 2 + 60, 12, "#fff");
                } else {
                    let secondsLeft = Math.ceil((7000 - timePassed) / 1000);
                    drawText(`AGUARDE ${secondsLeft} SEGUNDOS`, canvas.width / 2, canvas.height / 2 + 60, 12, "#aaa");
                }
            }

            // CRÉDITOS DO DESENVOLVEDOR (Visível no Menu, Game Over e Vitória)
            if (gameState === 'START' || gameState === 'GAMEOVER' || gameState === 'WIN') {
                drawText("Desenvolvido por TOMSOFTWAR - @2026", canvas.width / 2, canvas.height - 20, 10, "#888");
            }
        }

        function gameLoop() {
            if (!active) return;
            update();
            draw();
            requestAnimationFrame(gameLoop);
        }

        gameLoop();

  function activateGame(){
    active = true;
    if (typeof switchGame === 'function' && window.tomActiveGame !== 'cityAttack') switchGame('cityAttack');
    window.tomActiveGame = 'cityAttack';
    initAudio();
    initGame();
    gameState = 'INTRO';
    introY = canvas.height;
    requestAnimationFrame(gameLoop);
  }

  function deactivateGame(){
    active = false;
    gameState = 'INACTIVE';
    keys.ArrowLeft = false;
    keys.ArrowRight = false;
    keys.Space = false;
  }

  canvas.addEventListener('click', () => {
    if (!active) return;
    initAudio();
    if (gameState === 'START') {
      gameState = 'INTRO';
      introY = canvas.height;
    } else if (gameState === 'GAMEOVER' || gameState === 'WIN') {
      if (Date.now() - endScreenTime >= 7000) gameState = 'START';
    } else if (gameState === 'PLAYING') {
      shoot();
    }
  });

  return {activate: activateGame, deactivate: deactivateGame, isIntro: () => gameState === 'INTRO'};
}
