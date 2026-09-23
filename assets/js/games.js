const $=s=>document.querySelector(s), clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function drawStars(c,w,h,t){c.fillStyle="#000";c.fillRect(0,0,w,h);for(let i=0;i<150;i++){let x=(i*83)%w,y=(i*47+t*(.02+(i%3)*.012))%h; c.fillStyle=i%15?"#fff":"#18a957"; c.fillRect(x,y,1+(i%2),1+(i%2));}}

/* Música 8-bit original gerada no navegador (sem arquivo externo). */
class Chiptune{
  constructor(){this.ctx=null;this.master=null;this.timer=null;this.step=0;this.enabled=true;this.tempo=125;this.engineOsc=null;this.engineGain=null;this.engineLfo=null;this.melody=[659,784,880,784,659,523,587,659,784,988,880,784,659,587,523,440];this.bass=[131,131,165,165,147,147,110,110];}
  init(){if(this.ctx)return;const A=window.AudioContext||window.webkitAudioContext;if(!A)return;this.ctx=new A();this.master=this.ctx.createGain();this.master.gain.value=.05625;this.master.connect(this.ctx.destination);this.ctx.resume();}
  tone(freq,dur,type='square',vol=.08,delay=0){if(!this.ctx||!this.enabled)return;const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(0,this.ctx.currentTime+delay);g.gain.linearRampToValueAtTime(vol,this.ctx.currentTime+delay+.008);g.gain.exponentialRampToValueAtTime(.001,this.ctx.currentTime+delay+dur);o.connect(g);g.connect(this.master);o.start(this.ctx.currentTime+delay);o.stop(this.ctx.currentTime+delay+dur+.02);}
  start(){this.init();if(!this.ctx||this.timer)return;this.enabled=true;const tick=()=>{if(!this.enabled)return;const i=this.step%this.melody.length;this.tone(this.melody[i],.16,'square',.055);if(this.step%2===0)this.tone(this.bass[(this.step/2)%this.bass.length],.25,'triangle',.035);this.step++;};tick();this.timer=setInterval(tick,60000/this.tempo/2);}
  stop(){this.enabled=false;if(this.timer){clearInterval(this.timer);this.timer=null;}if(this.master)this.master.gain.value=0;}
  toggle(){if(this.timer){this.stop();return false;}this.enabled=true;if(this.master)this.master.gain.value=.05625;this.start();return true;}
  sfx(freq,dur=.09,type='square',vol=.12){this.init();this.tone(freq,dur,type,vol);}
  shoot(){this.sfx(720,.055,'square',.08);}
  hit(){this.sfx(170,.07,'sawtooth',.11);this.sfx(420,.1,'square',.07,.045);}
  explode(){this.init();if(!this.ctx)return;const t=this.ctx.currentTime;for(let i=0;i<8;i++){const f=90+i*35,o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type='square';o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(45,t+.3);g.gain.setValueAtTime(.06,t);g.gain.exponentialRampToValueAtTime(.001,t+.3);o.connect(g);g.connect(this.master);o.start(t);o.stop(t+.32);}}
  collect(){this.sfx(880,.06,'square',.07);this.sfx(1175,.09,'square',.065,.055);}
  jump(){this.sfx(520,.07,'square',.07);this.sfx(780,.09,'square',.055,.055);}
  pass(){this.sfx(980,.06,'square',.07);this.sfx(1319,.11,'square',.08,.06);}
  engineStart(){this.init();if(!this.ctx||this.engineOsc)return;const now=this.ctx.currentTime;this.engineOsc=this.ctx.createOscillator();this.engineGain=this.ctx.createGain();this.engineLfo=this.ctx.createOscillator();const lfoGain=this.ctx.createGain();this.engineOsc.type='sawtooth';this.engineOsc.frequency.value=72;this.engineGain.gain.value=.018;this.engineLfo.type='sine';this.engineLfo.frequency.value=6;this.engineLfo.connect(lfoGain);lfoGain.gain.value=13;lfoGain.connect(this.engineOsc.frequency);this.engineOsc.connect(this.engineGain);this.engineGain.connect(this.master);this.engineOsc.start(now);this.engineLfo.start(now);}
  engineSpeed(level){if(this.engineOsc&&this.ctx){this.engineOsc.frequency.setTargetAtTime(68+level*16,this.ctx.currentTime,.05);}}
  engineStop(){if(!this.ctx||!this.engineOsc)return;const now=this.ctx.currentTime;try{this.engineGain.gain.exponentialRampToValueAtTime(.001,now+.08);this.engineOsc.stop(now+.1);this.engineLfo.stop(now+.1);}catch(e){}this.engineOsc=null;this.engineGain=null;this.engineLfo=null;}
  victory(){[523,659,784,1047,1319].forEach((f,i)=>this.tone(f,.3,'square',.09,i*.13));}
}
const music=new Chiptune();
function setupMusicButton(){let b=document.querySelector('#musicBtn');if(!b)return;b.addEventListener('click',()=>{const on=music.toggle();b.textContent=on?'♫ 8-BIT ON':'♫ 8-BIT OFF';});}

function switchGame(name){
  const map={invaders:'invadersGame',snake:'snakeGame',pacBang:'pacBangGame',joaoMaria:'joaoMariaGame',racha:'rachaGame',alienFort:'alienFortGame',dangerRiver:'dangerRiverGame',cityAttack:'cityAttackGame',littleJoe:'littleJoeGame'};
  const previous=window.tomActiveGame;
  if(previous && previous!==name){
    const g=window[map[previous]];
    if(g){g.active=false;if(typeof g.deactivate==='function')g.deactivate();}
  }
  window.tomActiveGame=name;
  const g=window[map[name]];
  if(g){
    g.active=true;
    g.last=performance.now();
    if(typeof g.loop==='function' && !g.raf)g.raf=requestAnimationFrame(e=>g.loop(e));
    if(typeof g.activate==='function' && previous!==name)g.activate();
  }
}

class Invaders{
 constructor(c){this.c=c;this.ctx=c.getContext('2d');this.ctx.imageSmoothingEnabled=false;this.resetAll();this.bind();this.loop(0);}
 resetAll(){this.score=0;this.lives=3;this.level=1;this.energy=100;this.running=false;this.demo=true;this.victory=false;this.shield=0;this.intro=true;this.introY=this.c.height+80;this.introDone=false;this.introStarted=false;this.ship={x:this.c.width/2,y:this.c.height-55,tilt:0};this.bullets=[];this.enemyBullets=[];this.explosions=[];this.waveDir=1;this.waveDrop=0;this.waveSpeed=45;this.lastEnemyShot=0;this.invaderAnim=0;this.boss=null;this.bossBullets=[];this.bossFlash=0;this.make();}
 make(){this.aliens=[];const rows=Math.min(6,3+this.level),cols=8,gapX=82,gapY=38,startX=(this.c.width-(cols-1)*gapX)/2;const colors=['#d83cff','#20b8ff','#ff7a00','#74d61d','#ffda00'];for(let r=0;r<rows;r++)for(let col=0;col<cols;col++){const type=(r+this.level-1)%4;this.aliens.push({x:startX+col*gapX,y:72+r*gapY,baseY:72+r*gapY,alive:true,type,row:r,col,hp:type===3?2:1,color:colors[r%colors.length],phase:Math.random()*6.28});}this.waveDir=1;this.waveDrop=0;this.waveSpeed=42+this.level*14;}
 bind(){this.keys={};this.c.tabIndex=0;const activate=()=>{switchGame('invaders');this.c.focus();music.start();};this.c.addEventListener('pointerdown',e=>{activate();if(e.pointerType==='touch'){this.touching=true;}this.start();});this.c.addEventListener('pointermove',e=>{if(e.pointerType==='touch'&&this.touching){const r=this.c.getBoundingClientRect();this.ship.x=clamp((e.clientX-r.left)/r.width*this.c.width,34,this.c.width-34);if(this.running)this.fire();}});this.c.addEventListener('pointerup',e=>{if(e.pointerType==='touch')this.touching=false;});this.c.addEventListener('pointercancel',()=>this.touching=false);window.addEventListener('keydown',e=>{if(window.tomActiveGame!=='invaders')return;const k=e.key.toLowerCase();if(['arrowleft','arrowright','arrowup','arrowdown','a',' '].includes(k))e.preventDefault();this.keys[k]=true;if(k===' ') {activate();this.start();}if(k==='a')this.fire();});window.addEventListener('keyup',e=>{if(window.tomActiveGame==='invaders')delete this.keys[e.key.toLowerCase()];});}
 deactivate(){this.running=false;this.intro=false;this.introStarted=false;this.keys={};}
 start(){if(this.victory||this.lives<=0){this.resetAll();}this.running=false;this.demo=false;this.intro=true;this.introDone=false;this.introStarted=true;this.introY=this.c.height+55;this.victory=false;if(this.energy<=0)this.energy=100;music.start();}
 fire(){if(!this.running||this.bullets.length>=8)return;this.bullets.push({x:this.ship.x,y:this.ship.y-28,v:-590});music.shoot();}
 addExplosion(x,y,big=false){this.explosions.push({x,y,t:0,max:big?0.65:.38,big});music.explode();}
 hit(){if(this.shield>0)return;this.energy=Math.max(0,this.energy-25);music.hit();if(this.energy<=0){this.lives--;this.energy=100;this.shield=5;this.ship.x=this.c.width/2;this.ship.y=this.c.height-55;this.addExplosion(this.ship.x,this.ship.y,true);if(this.lives<=0){this.running=false;music.stop();}}}
 spawnBoss(){this.boss={x:this.c.width/2,y:105,dir:1,hp:80,maxHp:80,t:0,flash:0};this.enemyBullets=[];music.sfx(110,.5,'sawtooth',.14);}
 update(dt,t){
  if(!this.running){if(this.intro&&!this.introDone){this.introY-=48*dt;if(this.introY<-150){this.introDone=true;this.intro=false;this.running=true;this.demo=false;this.last=performance.now();}}return;}
  const s=330;let dx=0,dy=0;if(this.keys.arrowleft)dx--;if(this.keys.arrowright)dx++;if(this.keys.arrowup)dy--;if(this.keys.arrowdown)dy++;this.ship.x+=dx*s*dt;this.ship.y+=dy*s*dt;this.ship.tilt=dx*.12;this.ship.x=clamp(this.ship.x,34,this.c.width-34);this.ship.y=clamp(this.ship.y,this.c.height*.55,this.c.height-38);if(this.keys.a)this.fire();this.shield=Math.max(0,this.shield-dt);this.invaderAnim+=dt*8;
  for(const b of this.bullets)b.y+=b.v*dt;this.bullets=this.bullets.filter(b=>b.y>42);
  for(const e of this.explosions)e.t+=dt;this.explosions=this.explosions.filter(e=>e.t<e.max);
  if(this.boss){this.updateBoss(dt,t);return;}
  const alive=this.aliens.filter(a=>a.alive);if(!alive.length){if(this.level<4){this.level++;this.make();this.energy=Math.min(100,this.energy+15);}else{this.spawnBoss();}return;}
  const minX=Math.min(...alive.map(a=>a.x)),maxX=Math.max(...alive.map(a=>a.x)),margin=36;if(maxX>=this.c.width-margin&&this.waveDir>0){this.waveDir=-1;this.waveDrop+=20+this.level*4;}if(minX<=margin&&this.waveDir<0){this.waveDir=1;this.waveDrop+=20+this.level*4;}
  for(const a of alive){a.x+=this.waveDir*this.waveSpeed*dt;a.y=a.baseY+this.waveDrop+Math.sin(t*.004+a.phase)*3;}
  const fireGap=Math.max(350,1050-this.level*140);if(t-this.lastEnemyShot>fireGap){const maxRow=Math.max(...alive.map(a=>a.row)),shooters=alive.filter(a=>a.row===maxRow),a=shooters[Math.floor(Math.random()*shooters.length)]||alive[0];this.enemyBullets.push({x:a.x,y:a.y+18,v:170+this.level*38,phase:Math.random()*6.28});if(this.level>=3&&Math.random()<.4)this.enemyBullets.push({x:a.x+14,y:a.y+18,v:205+this.level*32,phase:1});this.lastEnemyShot=t;}
  for(const b of this.enemyBullets){b.y+=b.v*dt;b.x+=Math.sin(t*.006+b.phase)*12*dt;}this.enemyBullets=this.enemyBullets.filter(b=>b.y<this.c.height+20);
  for(const b of this.bullets){for(const a of alive){if(a.alive&&Math.abs(b.x-a.x)<25&&Math.abs(b.y-a.y)<19){a.hp--;b.y=-999;if(a.hp<=0){a.alive=false;this.score+=10;this.addExplosion(a.x,a.y,a.type===3); }else{this.addExplosion(a.x,a.y,false);}break;}}}
  for(const b of this.enemyBullets){if(Math.abs(b.x-this.ship.x)<27&&Math.abs(b.y-this.ship.y)<24){b.y=999;this.hit();}}
  if(alive.some(a=>a.y>this.ship.y-45)){this.energy=0;this.hit();}
 }
 updateBoss(dt,t){const b=this.boss;b.t+=dt;b.x+=b.dir*(80+this.level*8)*dt;b.y=105+Math.sin(t*.003)*18;if(b.x>this.c.width-125||b.x<125)b.dir*=-1;b.flash=Math.max(0,b.flash-dt);for(const shot of this.bullets){if(Math.abs(shot.x-b.x)<78&&Math.abs(shot.y-b.y)<55){shot.y=-999;b.hp-=2;this.score+=10;b.flash=.08;this.addExplosion(shot.x,shot.y,false);if(b.hp<=0){this.score+=500;this.addExplosion(b.x,b.y,true);this.victory=true;this.running=false;music.victory();setTimeout(()=>music.stop(),1400);}}}for(const x of this.bossBullets)x.y+=x.v*dt;this.bossBullets=this.bossBullets.filter(x=>x.y<this.c.height+20);if(t-(this.boss.lastShot||0)>650){for(let i=-2;i<=2;i++)this.bossBullets.push({x:b.x+i*22,y:b.y+45,v:190+Math.abs(i)*25});b.lastShot=t;}for(const x of this.bossBullets){if(Math.abs(x.x-this.ship.x)<27&&Math.abs(x.y-this.ship.y)<25){x.y=999;this.hit();}}
 }
 pixelAlien(c,a){const x=Math.round(a.x),y=Math.round(a.y),blink=Math.floor(this.invaderAnim)%2;c.save();c.translate(x,y);c.fillStyle=a.color;c.shadowColor=a.color;c.shadowBlur=12;const leg=blink?4:7;c.fillRect(-18,-8,36,17);c.fillRect(-13,-14,26,6);c.fillRect(-22,-3,5,10);c.fillRect(17,-3,5,10);c.fillRect(-14,9,6,leg);c.fillRect(8,9,6,leg);if(a.type===1){c.fillRect(-24,-9,6,5);c.fillRect(18,-9,6,5);}if(a.type===2){c.fillRect(-11,-18,6,5);c.fillRect(5,-18,6,5);}if(a.type===3){c.fillRect(-22,6,6,8);c.fillRect(16,6,6,8);}c.shadowBlur=0;c.fillStyle='#101010';c.fillRect(-10,-5,6,6);c.fillRect(4,-5,6,6);c.fillStyle='#fff';c.fillRect(-9,-4,3,3);c.fillRect(5,-4,3,3);c.fillStyle=a.type===3?'#ffda00':'#e60012';c.fillRect(-8,5,16,3);if(blink)c.fillRect(-12,9,6,3),c.fillRect(6,9,6,3);c.restore();}
 drawShip(c,x,y){c.save();c.translate(Math.round(x),Math.round(y));c.rotate(this.ship.tilt);c.shadowColor='#20b8ff';c.shadowBlur=18;c.fillStyle='#ff7a00';c.fillRect(-19,20,9,14);c.fillRect(10,20,9,14);c.fillStyle='#fff';c.fillRect(-16,23,4,15);c.fillRect(12,23,4,15);c.fillStyle='#bfc9d2';c.fillRect(-34,8,68,10);c.fillRect(-25,0,50,15);c.fillStyle='#e60012';c.fillRect(-30,12,13,9);c.fillRect(17,12,13,9);c.fillStyle='#7d8993';c.fillRect(-24,-4,9,11);c.fillRect(15,-4,9,11);c.fillStyle='#f4f4f4';c.fillRect(-13,-30,26,40);c.fillRect(-18,-14,36,23);c.fillStyle='#e60012';c.fillRect(-7,-26,14,10);c.fillRect(-6,-14,12,20);c.fillStyle='#20b8ff';c.fillRect(-7,-21,14,12);c.fillStyle='#bfffff';c.fillRect(-3,-19,6,7);c.fillStyle='#26333d';c.fillRect(-3,-8,6,12);c.shadowBlur=0;if(this.shield>0){c.strokeStyle='#20b8ff';c.lineWidth=3;c.beginPath();c.arc(0,0,45,0,Math.PI*2);c.stroke();}c.restore();}
 drawBoss(c){if(!this.boss)return;const b=this.boss;c.save();c.translate(Math.round(b.x),Math.round(b.y));c.shadowColor='#ff3cff';c.shadowBlur=20;c.fillStyle=b.flash?'#fff':'#6d39c9';c.fillRect(-65,-35,130,75);c.fillStyle='#24204a';c.fillRect(-85,-20,20,45);c.fillRect(65,-20,20,45);c.fillStyle='#ff3b30';c.fillRect(-42,-52,16,17);c.fillRect(26,-52,16,17);c.fillStyle='#ffda00';c.fillRect(-70,-46,18,8);c.fillRect(52,-46,18,8);c.fillStyle='#e60012';c.fillRect(-25,-18,50,45);c.fillStyle='#fff';c.fillRect(-12,-8,24,24);c.fillStyle='#20b8ff';c.fillRect(-8,-4,16,16);c.fillStyle='#ff3b30';c.fillRect(-95,5,20,8);c.fillRect(75,5,20,8);c.fillStyle='#111';c.fillRect(-35,35,20,12);c.fillRect(15,35,20,12);c.shadowBlur=0;c.restore();}
 drawExplosion(c,e){const p=e.t/e.max,r=(e.big?12:6)+p*(e.big?75:34);c.save();c.translate(e.x,e.y);for(let i=0;i<12;i++){const a=i*Math.PI*2/12,rr=r*(.45+(i%3)*.2);c.fillStyle=i%2?'#ffda00':'#ff5a00';c.fillRect(Math.cos(a)*rr,Math.sin(a)*rr,4+(1-p)*6,4+(1-p)*6);}c.fillStyle='#fff';c.fillRect(-5,-5,10,10);c.restore();}
 draw(){const c=this.ctx,w=this.c.width,h=this.c.height;drawStars(c,w,h,performance.now());c.fillStyle='#fff';c.font='bold 14px monospace';c.fillText(`PONTOS ${String(this.score).padStart(5,'0')}`,12,22);c.fillText(`VIDAS ${this.lives}`,170,22);c.fillText(`NÍVEL ${this.level}/4`,265,22);c.fillText('ENERGIA',390,22);c.strokeStyle='#fff';c.strokeRect(465,12,120,12);c.fillStyle='#18a957';c.fillRect(467,14,116*this.energy/100,8);c.fillStyle='#18a957';c.font='10px monospace';if(this.shield>0)c.fillText(`ESCUDO ${this.shield.toFixed(1)}s`,600,22);this.aliens.forEach(a=>{if(a.alive)this.pixelAlien(c,a)});this.drawBoss(c,this.boss);this.drawShip(c,this.ship.x,this.ship.y);this.bullets.forEach(b=>{c.fillStyle='#7df9ff';c.shadowColor='#7df9ff';c.shadowBlur=12;c.fillRect(b.x-2,b.y-11,4,14);c.shadowBlur=0});this.enemyBullets.forEach(b=>{c.fillStyle='#ff3b30';c.shadowColor='#ff3b30';c.shadowBlur=9;c.fillRect(b.x-2,b.y,4,13);c.fillRect(b.x-5,b.y+3,10,4);c.shadowBlur=0});this.bossBullets.forEach(b=>{c.fillStyle='#d83cff';c.fillRect(b.x-3,b.y,6,15)});this.explosions.forEach(e=>this.drawExplosion(c,e));if(this.boss){c.fillStyle='#fff';c.font='bold 13px monospace';c.textAlign='center';c.fillText('CHEFÃO',this.boss.x,this.boss.y-65);c.strokeStyle='#fff';c.strokeRect(this.boss.x-90,this.boss.y-58,180,10);c.fillStyle='#e60012';c.fillRect(this.boss.x-88,this.boss.y-56,176*(this.boss.hp/this.boss.maxHp),6);c.textAlign='left';}if(!this.running&&this.intro&&this.introStarted){c.fillStyle='rgba(0,0,0,.92)';c.fillRect(0,0,w,h);c.textAlign='center';c.fillStyle='#e60012';c.shadowColor='#e60012';c.shadowBlur=16;c.font="24px 'Press Start 2P'";c.fillText('INVADERS',w/2,48);c.shadowBlur=0;c.font='bold 17px monospace';const introLines=['PROTEJA O UNIVERSO CONTRA INVASORES ALIENÍGENAS,','VOCÊ É O ÚNICO GUERREIRO QUE SOBROU NA TERRA,','BOA SORTE!'];introLines.forEach((line,i)=>{const y=this.introY+i*22;if(y>55&&y<h-35){c.fillStyle='#fff';c.shadowColor='#fff';c.shadowBlur=7;c.fillText(line,w/2,y);c.shadowBlur=0;}});c.fillStyle='#18a957';c.font='bold 12px monospace';c.fillText('PREPARE-SE...',w/2,h-22);c.textAlign='left';return;}if(this.victory){c.fillStyle='rgba(0,0,0,.82)';c.fillRect(0,0,w,h);c.textAlign='center';c.shadowColor='#e60012';c.shadowBlur=22;c.fillStyle='#e60012';c.font="34px 'Press Start 2P'";c.fillText('PARABÉNS!',w/2,h/2-25);c.shadowBlur=0;c.fillStyle='#fff';c.font='12px monospace';c.fillText('VOCÊ DERROTOU O CHEFÃO!',w/2,h/2+12);c.fillStyle='#ffda00';c.font='24px monospace';c.fillText('★ ★ ★',w/2,h/2+50);c.fillStyle='#18a957';c.font='12px monospace';c.fillText(`PONTUAÇÃO FINAL ${this.score}`,w/2,h/2+82);c.font='10px monospace';c.fillStyle='#fff';c.fillText('ESPAÇO OU CLIQUE PARA JOGAR NOVAMENTE',w/2,h/2+115);c.textAlign='left';return;}if(!this.running){c.fillStyle='rgba(0,0,0,.72)';c.fillRect(0,0,w,h);c.fillStyle='#e60012';c.font="32px 'Press Start 2P'";c.textAlign='center';c.shadowColor='#e60012';c.shadowBlur=18;c.fillText(this.lives<=0?'GAME OVER':'DEMO',w/2,h/2);c.shadowBlur=0;c.fillStyle='#fff';c.font='10px monospace';c.fillText('ESPAÇO OU CLIQUE PARA START',w/2,h/2+35);c.textAlign='left';}}
 loop(t){this.raf=0;if(this.active===false)return;const dt=Math.min(.04,(t-(this.last||t))/1000);this.last=t;this.update(dt,t);this.draw();this.raf=requestAnimationFrame(e=>this.loop(e));}
}

class Snake{
 constructor(c){this.c=c;this.ctx=c.getContext("2d");this.ctx.imageSmoothingEnabled=false;this.running=false;this.demo=true;this.lives=3;this.score=0;this.intro=true;this.introY=this.c.height+70;this.introDone=false;this.introSpeed=0;this.introStarted=false;this.introElapsed=0;this.introDuration=5;this.dir={x:1,y:0};this.next={x:1,y:0};this.last=0;this.demoTime=0;this.reset();this.bind();this.loop(0)}
 reset(){this.snake=[];for(let i=0;i<6;i++)this.snake.push({x:12-i,y:10});this.dir={x:1,y:0};this.next={x:1,y:0};this.obs=[{x:4,y:5},{x:18,y:9},{x:25,y:16},{x:9,y:16}];this.food();}
 food(){let f;do{f={x:2+Math.floor(Math.random()*27),y:3+Math.floor(Math.random()*16)}}while(this.snake.some(s=>s.x===f.x&&s.y===f.y)||this.obs.some(o=>o.x===f.x&&o.y===f.y));f.type=["strawberry","banana","grapes","apple","orange","watermelon"][Math.floor(Math.random()*6)];this.fruit=f}
 bind(){const set=k=>{const d={arrowup:{x:0,y:-1},w:{x:0,y:-1},arrowdown:{x:0,y:1},s:{x:0,y:1},arrowleft:{x:-1,y:0},a:{x:-1,y:0},arrowright:{x:1,y:0},d:{x:1,y:0}}[k];if(d&&!(d.x===-this.dir.x&&d.y===-this.dir.y))this.next=d};this.c.tabIndex=0;window.addEventListener("keydown",e=>{if(window.tomActiveGame!=="snake")return;const k=e.key.toLowerCase();if(k===" "){e.preventDefault();this.start();return}if(["arrowup","arrowdown","arrowleft","arrowright","w","a","s","d"].includes(k)){e.preventDefault();set(k)}});this.c.addEventListener("click",()=>{switchGame('snake');this.c.focus();this.start()});let start=null;this.c.addEventListener("pointerdown",e=>{switchGame('snake');this.c.focus();this.start();if(e.pointerType==="touch")start={x:e.clientX,y:e.clientY}});this.c.addEventListener("pointerup",e=>{if(!start)return;let dx=e.clientX-start.x,dy=e.clientY-start.y;if(Math.max(Math.abs(dx),Math.abs(dy))>15)set(Math.abs(dx)>Math.abs(dy)?(dx>0?"arrowright":"arrowleft"):(dy>0?"arrowdown":"arrowup"));start=null})}
 deactivate(){this.running=false;this.intro=false;this.introStarted=false;this.keys={};}
 start(){if(this.lives<=0){this.lives=3;this.score=0;this.obs=[{x:4,y:5},{x:18,y:9},{x:25,y:16},{x:9,y:16}]}this.reset();this.running=false;this.demo=false;this.intro=true;this.introDone=false;this.introStarted=true;this.introY=this.c.height+70;this.introElapsed=0;this.last=performance.now();music.start()}
 speed(){return Math.max(48,185-(this.snake.length-6)*6)}
 step(){this.dir=this.next;let h={x:this.snake[0].x+this.dir.x,y:this.snake[0].y+this.dir.y};if(h.x<0||h.x>=31||h.y<2||h.y>=20||this.snake.some(s=>s.x===h.x&&s.y===h.y)||this.obs.some(o=>o.x===h.x&&o.y===h.y)){this.lives--;music.explode();if(this.lives<=0){this.running=false;music.stop()}else{this.reset();this.last=performance.now()}return}this.snake.unshift(h);if(h.x===this.fruit.x&&h.y===this.fruit.y){this.score+=10;music.collect();this.food();if(this.snake.length%5===0){let o;do{o={x:2+Math.floor(Math.random()*27),y:3+Math.floor(Math.random()*16)}}while(this.snake.some(s=>s.x===o.x&&s.y===o.y)||this.obs.some(x=>x.x===o.x&&x.y===o.y)|| (o.x===this.fruit.x&&o.y===this.fruit.y));this.obs.push(o)}}else this.snake.pop()}
 update(t){this.demoTime=t;if(!this.running){if(this.intro&&!this.introDone){const elapsed=(t-(this.last||t))/1000;this.introElapsed+=Math.max(0,elapsed);this.introY=this.c.height+70-(this.c.height+195)*(this.introElapsed/this.introDuration);if(this.introElapsed>=this.introDuration){this.introDone=true;this.intro=false;this.running=true;this.last=t;}}return;}if(t-this.last>=this.speed()){this.last=t;this.step()}}
 drawFruit(c,f,sz){let x=f.x*sz+12,y=f.y*sz+12;c.save();c.translate(x,y);c.shadowBlur=8;c.shadowColor="#ffda00";if(f.type==="banana"){c.strokeStyle="#ffe43b";c.lineWidth=7;c.beginPath();c.arc(0,0,9,-.8,1.7);c.stroke()}else if(f.type==="grapes"){c.fillStyle="#a13cff";for(let yy=-5;yy<=5;yy+=5)for(let xx=-5;xx<=5;xx+=5)c.beginPath(),c.arc(xx,yy,4,0,Math.PI*2),c.fill();c.fillStyle="#18a957";c.fillRect(-2,-12,5,5)}else if(f.type==="strawberry"){c.fillStyle="#e60012";c.beginPath();c.moveTo(-9,-4);c.lineTo(0,9);c.lineTo(9,-4);c.quadraticCurveTo(0,-12,-9,-4);c.fill();c.fillStyle="#18a957";c.fillRect(-3,-10,6,4)}else{c.fillStyle=f.type==="orange"?"#ff7a00":f.type==="watermelon"?"#18a957":"#e60012";c.beginPath();c.arc(0,0,9,0,Math.PI*2);c.fill();c.fillStyle="#18a957";c.fillRect(-2,-12,5,5)}c.restore()}
 draw(){let c=this.ctx,w=this.c.width,h=this.c.height,sz=24;c.clearRect(0,0,w,h);c.fillStyle="#050705";c.fillRect(0,0,w,h);c.strokeStyle="rgba(24,169,87,.18)";c.lineWidth=1;for(let x=0;x<=w;x+=sz){c.beginPath();c.moveTo(x,48);c.lineTo(x,h);c.stroke()}for(let y=48;y<=h;y+=sz){c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke()}c.fillStyle="#fff";c.font="bold 14px monospace";c.fillText(`PONTOS ${this.score}`,12,25);c.fillText(`TAMANHO ${this.snake.length}`,165,25);c.fillText(`VIDAS ${this.lives}`,335,25);c.fillStyle="#18a957";c.font="10px monospace";c.fillText(`VELOCIDADE ${Math.round(1000/this.speed())}/s`,475,25);c.fillStyle="#e60012";c.fillRect(0,40,w,2);c.fillStyle="#444";this.obs.forEach(o=>{c.fillRect(o.x*sz+3,o.y*sz+3,18,18);c.fillStyle="#888";c.fillRect(o.x*sz+6,o.y*sz+6,12,12);c.fillStyle="#444"});this.drawFruit(c,this.fruit,sz);this.snake.forEach((s,i)=>{let x=s.x*sz+2,y=s.y*sz+2;c.fillStyle=i===0?"#ffe43b":"#ffda00";c.shadowColor="#ffda00";c.shadowBlur=i===0?12:5;c.fillRect(x,y,20,20);c.shadowBlur=0;if(i===0){c.fillStyle="#111";c.fillRect(x+5,y+5,5,5);c.fillRect(x+14,y+5,5,5);c.fillStyle="#fff";c.fillRect(x+6,y+5,2,2);c.fillRect(x+15,y+5,2,2);c.fillStyle="#e60012";c.fillRect(x+8,y+17,10,3)}});if(!this.running&&this.intro&&this.introStarted){c.fillStyle="rgba(0,0,0,.92)";c.fillRect(0,42,w,h-42);c.textAlign="center";c.fillStyle="#ffe43b";c.shadowColor="#ffe43b";c.shadowBlur=14;c.font="bold 24px monospace";c.fillText("COBRINHA",w/2,78);c.shadowBlur=0;c.font="bold 17px monospace";const introLines=["A COBRINHA ESTÁ FAMINTA!","AJUDE-A A COMER AS FRUTAS E VEJA COMO ELA CRESCE,","MAS CUIDADO COM OS OBSTÁCULOS!"];introLines.forEach((line,i)=>{const y=this.introY+i*22;if(y>90&&y<h-45){c.fillStyle="#fff";c.shadowColor="#fff";c.shadowBlur=7;c.fillText(line,w/2,y);c.shadowBlur=0;}});c.fillStyle="#18a957";c.font="bold 12px monospace";c.fillText("PREPARE-SE...",w/2,h-20);c.textAlign="left";return;}if(!this.running){c.fillStyle="rgba(0,0,0,.62)";c.fillRect(0,42,w,h-42);c.textAlign="center";c.fillStyle="#ffe43b";c.font="bold 28px monospace";c.fillText(this.lives<=0?"GAME OVER":"COBRINHA",w/2,h/2-10);c.fillStyle="#fff";c.font="12px monospace";c.fillText(this.lives<=0?"ESPAÇO OU CLIQUE PARA JOGAR NOVAMENTE":"ESPAÇO OU CLIQUE PARA COMEÇAR",w/2,h/2+25);c.textAlign="left"}}
 loop(t){this.raf=0;if(this.active===false)return;this.update(t);this.draw();this.raf=requestAnimationFrame(e=>this.loop(e))}}


/* JOÃO E MARIA — corrida pela floresta em busca de Maria. */
class JoaoMaria{
  constructor(c){
    this.c=c; this.ctx=c.getContext('2d'); this.ctx.imageSmoothingEnabled=false;
    this.resetAll(); this.bind(); this.loop(0);
  }
  resetAll(){
    this.score=0; this.level=1; this.lives=4; this.running=false; this.intro=false; this.introStarted=false; this.introDone=false;
    this.introElapsed=0; this.introDuration=5; this.last=0; this.time=0; this.speedBase=235; this.obstacles=[]; this.spawnTimer=0; this.spawnGap=1.15;
    this.ground=382; this.player={x:105,y:this.ground-56,vy:0,w:34,h:52,onGround:true,inv:0,ducking:false,walk:0}; this.maria={x:this.c.width+180,y:this.ground-58};
    this.victory=false; this.gameOver=false; this.creditsY=this.c.height+70; this.cloudOffset=0; this.lastSpawnX=this.c.width+100;
  }
  bind(){
    const activate=()=>{switchGame('joaoMaria');this.c.focus();music.start();};
    const jump=()=>{if(!this.running)return;if(this.player.onGround){this.player.vy=-610;this.player.onGround=false;music.jump();}};
    this.keys={};
    this.c.addEventListener('click',()=>{activate();if(!this.running)this.start();else jump();});
    this.c.addEventListener('pointerdown',e=>{activate();if(e.pointerType==='touch'){e.preventDefault();if(!this.running)this.start();else jump();}});
    window.addEventListener('keydown',e=>{
      if(window.tomActiveGame!=='joaoMaria')return;
      const k=e.key.toLowerCase();
      if([' ','arrowleft','arrowright','arrowdown'].includes(k))e.preventDefault();
      if(k===' '){activate();if(!this.running)this.start();else jump();}
      if(['arrowleft','arrowright','arrowdown'].includes(k))this.keys[k]=true;
    });
    window.addEventListener('keyup',e=>{if(window.tomActiveGame==='joaoMaria')delete this.keys[e.key.toLowerCase()];});
  }
  deactivate(){this.running=false;this.intro=false;this.introStarted=false;this.keys={};}
  start(){
    if(this.gameOver||this.victory){this.resetAll();}
    this.running=false; this.intro=true; this.introStarted=true; this.introDone=false; this.introElapsed=0; this.creditsY=this.c.height+55; this.last=performance.now(); music.start();
  }
  currentSpeed(){return this.speedBase+(this.level-1)*38;}
  resetObstacleField(){this.obstacles=[];this.spawnTimer=.65;}
  spawnObstacle(){
    const types=['hole','rock','bat','bee','stump','log'];
    const weights=['hole','rock','rock','bat','bee','stump','log'];
    let type=weights[Math.floor(Math.random()*weights.length)];
    const x=this.c.width+45;
    let y=this.ground-28,w=34,h=28;
    if(type==='hole'){w=52;h=16;y=this.ground-2;}
    if(type==='rock'){w=30+Math.floor(Math.random()*14);h=22+Math.floor(Math.random()*13);y=this.ground-h;}
    if(type==='bat'){w=42;h=25;y=this.ground-82-Math.random()*10;}
    if(type==='bee'){w=32;h=22;y=this.ground-80-Math.random()*10;}
    if(type==='stump'){w=30;h=40;y=this.ground-h;}
    if(type==='log'){w=58;h=22;y=this.ground-h;}
    this.obstacles.push({type,x,y,w,h,phase:Math.random()*6.28,passed:false,hit:false});
  }
  loseLife(){
    if(this.player.inv>0)return;
    this.lives--; this.player.inv=1.25; this.player.vy=-260; music.explode();
    if(this.lives<=0){this.running=false;this.gameOver=true;music.stop();}
    else {this.player.x=105;this.player.y=this.ground-56;this.player.vy=0;this.player.onGround=true;this.obstacles=this.obstacles.filter(o=>o.x>250);}
  }
  update(dt,t){
    this.time=t;
    if(!this.running){
      if(this.intro&&!this.introDone){
        this.introElapsed+=dt;
        const progress=Math.min(1,this.introElapsed/this.introDuration);
        this.creditsY=this.c.height+55-(this.c.height+210)*progress;
        if(this.introElapsed>=this.introDuration){this.introDone=true;this.intro=false;this.running=true;this.last=t;this.resetObstacleField();}
      }
      return;
    }
    this.player.inv=Math.max(0,this.player.inv-dt);
    const speed=this.currentSpeed();
    this.cloudOffset=(this.cloudOffset+speed*dt)%1200;
    if(this.keys.arrowleft)this.player.x-=270*dt;
    if(this.keys.arrowright)this.player.x+=270*dt;
    this.player.x=clamp(this.player.x,42,this.c.width-70);
    const wasGrounded=this.player.onGround;
    this.player.ducking=!!(this.keys.arrowdown && wasGrounded);
    this.player.h=this.player.ducking?35:52;
    if(wasGrounded)this.player.y=this.ground-this.player.h;
    this.player.vy+=1450*dt; this.player.y+=this.player.vy*dt;
    const floor=this.ground-this.player.h;
    if(this.player.y>=floor){this.player.y=floor;this.player.vy=0;this.player.onGround=true;}
    if(this.player.onGround && !this.player.ducking)this.player.walk+=dt*speed*.045;
    else this.player.onGround=false;
    this.spawnTimer-=dt;
    if(this.spawnTimer<=0){this.spawnObstacle();this.spawnTimer=Math.max(.48,this.spawnGap-(this.level-1)*.07)+Math.random()*.42;}
    for(const o of this.obstacles){
      o.x-=speed*dt;
      if(o.type==='bat'||o.type==='bee')o.y+=Math.sin(t/180+o.phase)*.7;
      if(!o.passed&&o.x+o.w<this.player.x){o.passed=true;this.score+=10;this.level=Math.min(7,Math.floor(this.score/150)+1);}
      if(!o.hit&&this.collides(o)){o.hit=true;this.loseLife();}
    }
    this.obstacles=this.obstacles.filter(o=>o.x+o.w>-30&&!o.hit);
    if(this.level===7 && this.score>=900){
      this.maria.x-=speed*dt*.72;
      if(this.maria.x<=this.player.x+60){this.running=false;this.victory=true;music.victory();setTimeout(()=>music.stop(),1400);}
    }
  }
  collides(o){
    const p=this.player; const px=p.x+5,py=p.y+5,pw=p.w-10,ph=p.h-7;
    if((o.type==='bat'||o.type==='bee')&&p.ducking)return false;
    if(o.type==='hole')return p.onGround&&px+pw>o.x+7&&px<o.x+o.w-7;
    return px<o.x+o.w&&px+pw>o.x&&py<o.y+o.h&&py+ph>o.y;
  }
  drawBackground(c,w,h,t){
    const grd=c.createLinearGradient(0,0,0,h);grd.addColorStop(0,'#06110a');grd.addColorStop(.62,'#123a1c');grd.addColorStop(1,'#071108');c.fillStyle=grd;c.fillRect(0,0,w,h);
    c.fillStyle='rgba(255,255,255,.7)';for(let i=0;i<55;i++){let x=(i*97+this.cloudOffset*.18)%w,y=48+(i*31)%150;c.fillRect(x,y,1+(i%2),1+(i%2));}
    // lua e árvores
    c.fillStyle='#ffe43b';c.shadowColor='#ffe43b';c.shadowBlur=14;c.beginPath();c.arc(650,75,28,0,Math.PI*2);c.fill();c.shadowBlur=0;
    for(let i=0;i<12;i++){let x=((i*83-this.cloudOffset*.35)%900+900)%900-70;let th=120+(i%4)*28;c.fillStyle=i%2?'#0a2412':'#0e2e17';c.fillRect(x,this.ground-th,24,th);c.fillRect(x-25,this.ground-th+30,74,18);c.fillRect(x-38,this.ground-th+60,100,18);}
    c.fillStyle='#184d24';c.fillRect(0,this.ground,w,h-this.ground);c.fillStyle='#2d7a31';c.fillRect(0,this.ground,w,5);
    c.fillStyle='#63a83f';for(let i=0;i<50;i++){let x=(i*47-this.cloudOffset)%w;if(x<0)x+=w;c.fillRect(x,this.ground+7+(i%3)*6,2,5);}
  }
  drawJoao(c){
    const p=this.player;c.save();c.translate(Math.round(p.x),Math.round(p.y));if(p.inv>0&&Math.floor(p.inv*12)%2===0){c.globalAlpha=.35;}
    if(p.ducking){
      c.fillStyle='#6b3e24';c.fillRect(10,21,14,15);c.fillStyle='#d9a066';c.fillRect(6,4,24,22);c.fillStyle='#4a2a1a';c.fillRect(4,1,28,8);c.fillRect(8,0,20,6);c.fillStyle='#111';c.fillRect(11,12,4,4);c.fillRect(22,12,4,4);c.fillStyle='#e60012';c.fillRect(15,19,8,3);c.fillStyle='#2d5fa7';c.fillRect(6,25,22,10);c.fillStyle='#1b1b1b';c.fillRect(5,34,9,6);c.fillRect(21,34,9,6);
    }else{
      c.fillStyle='#6b3e24';c.fillRect(10,25,14,24);c.fillStyle='#d9a066';c.fillRect(6,7,24,22);c.fillStyle='#4a2a1a';c.fillRect(4,4,28,8);c.fillRect(8,0,20,7);c.fillStyle='#111';c.fillRect(11,14,4,5);c.fillRect(22,14,4,5);c.fillStyle='#e60012';c.fillRect(15,22,8,3);c.fillStyle='#2d5fa7';c.fillRect(6,29,22,15);
      const step=Math.floor(p.walk)%2; c.fillStyle='#1b1b1b';
      if(step===0){c.fillRect(3,44,9,8);c.fillRect(22,44,9,8);}else{c.fillRect(6,44,9,8);c.fillRect(19,44,9,8);}
    }
    c.restore();
  }
  drawObstacle(c,o){
    c.save();c.translate(Math.round(o.x),Math.round(o.y));
    if(o.type==='hole'){c.fillStyle='#020402';c.beginPath();c.ellipse(o.w/2,8,o.w/2,9,0,0,Math.PI*2);c.fill();c.strokeStyle='#111';c.stroke();}
    else if(o.type==='rock'){c.fillStyle='#777';c.beginPath();c.moveTo(2,o.h);c.lineTo(8,7);c.lineTo(o.w-8,2);c.lineTo(o.w,12);c.lineTo(o.w-5,o.h);c.closePath();c.fill();c.fillStyle='#aaa';c.fillRect(10,8,7,5);}
    else if(o.type==='bat'){c.fillStyle='#4a276e';c.fillRect(14,7,15,13);c.fillRect(3,3,14,7);c.fillRect(27,3,14,7);c.fillStyle='#ff3b30';c.fillRect(18,10,3,3);c.fillRect(24,10,3,3);}
    else if(o.type==='bee'){c.fillStyle='#ffe43b';c.fillRect(7,4,20,17);c.fillStyle='#111';c.fillRect(11,4,4,17);c.fillRect(20,4,4,17);c.fillStyle='rgba(255,255,255,.7)';c.fillRect(4,1,9,5);c.fillRect(22,1,9,5);}
    else if(o.type==='stump'){c.fillStyle='#7b4b28';c.fillRect(5,0,20,o.h);c.fillStyle='#c58a4a';c.fillRect(8,4,14,7);c.fillStyle='#5a351e';c.fillRect(13,6,5,3);}
    else {c.fillStyle='#8b5a2b';c.fillRect(0,2,o.w,o.h);c.fillStyle='#c58a4a';c.fillRect(5,6,8,8);c.fillRect(o.w-13,6,8,8);}
    c.restore();
  }
  drawHeart(c,x,y){c.save();c.translate(Math.round(x),Math.round(y));c.fillStyle='#ff1744';c.shadowColor='#ff1744';c.shadowBlur=12;c.fillRect(-12,-7,8,12);c.fillRect(4,-7,8,12);c.fillRect(-8,-11,16,15);c.fillRect(-8,5,16,5);c.fillRect(-4,10,8,4);c.shadowBlur=0;c.restore();}
  drawMaria(c){
    const m=this.maria;c.save();c.translate(Math.round(m.x),Math.round(m.y));c.fillStyle='#d9a066';c.fillRect(7,7,24,22);c.fillStyle='#d94c86';c.fillRect(3,0,32,10);c.fillRect(0,7,8,20);c.fillRect(27,7,8,20);c.fillStyle='#111';c.fillRect(11,14,4,5);c.fillRect(22,14,4,5);c.fillStyle='#e60012';c.fillRect(15,22,8,3);c.fillStyle='#f4c7e2';c.fillRect(6,29,26,15);c.fillStyle='#8b5a2b';c.fillRect(8,44,8,8);c.fillRect(22,44,8,8);c.restore();
  }
  drawCredits(c,w,h){
    const lines=['MARIA SE PERDEU NA FLORESTA!','AJUDE JOÃO A ENCONTRÁ-LA,','MAS CUIDADO COM OS OBSTÁCULOS!','PULE COM A BARRA DE ESPAÇO','CADA OBSTÁCULO VENCIDO VALE 10 PONTOS','A CADA 150 PONTOS, UM NOVO NÍVEL','SÃO 7 NÍVEIS — ENCONTRE MARIA NO FINAL!'];
    c.save();c.textAlign='center';c.font='bold 17px monospace';lines.forEach((line,i)=>{let y=this.creditsY+i*29;if(y>-25&&y<h+25){c.fillStyle=i===0?'#ffe43b':'#fff';c.shadowColor=i===0?'#ffe43b':'#fff';c.shadowBlur=8;c.fillText(line,w/2,y);}});c.restore();
  }
  draw(){
    const c=this.ctx,w=this.c.width,h=this.c.height,t=performance.now();this.drawBackground(c,w,h,t);
    c.fillStyle='#fff';c.font='bold 14px monospace';c.fillText(`PONTOS ${String(this.score).padStart(4,'0')}`,12,24);c.fillText(`VIDAS ${this.lives}`,145,24);c.fillText(`NÍVEL ${this.level}/7`,245,24);c.fillStyle='#18a957';c.fillText(`VELOCIDADE ${Math.round(this.currentSpeed())}`,360,24);
    if(this.level===7)this.drawMaria(c);this.obstacles.forEach(o=>this.drawObstacle(c,o));this.drawJoao(c);
    if(this.level===7 && (this.victory || this.maria.x<=this.player.x+95)) this.drawHeart(c,(this.player.x+this.maria.x)/2,Math.min(this.player.y,this.maria.y)-35);
    if(!this.running&&this.intro&&this.introStarted){c.fillStyle='rgba(0,0,0,.9)';c.fillRect(0,42,w,h-42);this.drawCredits(c,w,h);c.fillStyle='#18a957';c.font='bold 12px monospace';c.textAlign='center';c.fillText('PREPARE-SE...',w/2,h-20);c.textAlign='left';return;}
    if(this.victory){c.fillStyle='rgba(0,0,0,.82)';c.fillRect(0,0,w,h);c.textAlign='center';c.shadowColor='#ffe43b';c.shadowBlur=20;c.fillStyle='#ffe43b';c.font="30px 'Press Start 2P'";c.fillText('PARABÉNS!',w/2,h/2-28);c.shadowBlur=0;c.fillStyle='#fff';c.font="14px 'Press Start 2P'";c.fillText('JOÃO ENCONTROU MARIA!',w/2,h/2+12);c.fillStyle='#18a957';c.font='12px monospace';c.fillText(`PONTUAÇÃO FINAL ${this.score}`,w/2,h/2+48);c.fillStyle='#fff';c.font='10px monospace';c.fillText('ESPAÇO OU CLIQUE PARA JOGAR NOVAMENTE',w/2,h/2+80);c.textAlign='left';return;}
    if(!this.running){c.fillStyle='rgba(0,0,0,.72)';c.fillRect(0,0,w,h);c.textAlign='center';c.shadowColor='#e60012';c.shadowBlur=18;c.fillStyle='#e60012';c.font="30px 'Press Start 2P'";c.fillText(this.gameOver?'GAME OVER':'JOÃO E MARIA',w/2,h/2-15);c.shadowBlur=0;c.fillStyle='#fff';c.font='11px monospace';c.fillText('ESPAÇO OU CLIQUE PARA START',w/2,h/2+25);c.textAlign='left';}
  }
  loop(t){this.raf=0;if(this.active===false)return;const dt=Math.min(.04,(t-(this.last||t))/1000);this.last=t;this.update(dt,t);this.draw();this.raf=requestAnimationFrame(e=>this.loop(e));}
}

/* RACHA — corrida arcade retrô */
class Racha{
  constructor(c){this.c=c;this.ctx=c.getContext('2d');this.ctx.imageSmoothingEnabled=false;this.reset();this.bind();this.loop(0);}
  reset(){this.score=0;this.passed=0;this.level=1;this.lives=4;this.timeLeft=120;this.running=false;this.intro=false;this.introStarted=false;this.introDone=false;this.introElapsed=0;this.introDuration=5;this.creditsY=this.c.height+50;this.gameOver=false;this.victory=false;this.keys={};this.inv=0;this.explosions=[];this.cars=[];this.spawnTimer=.2;this.roadOffset=0;this.last=0;this.player={x:this.c.width/2,y:this.c.height-78,w:42,h:68,tilt:0};}
  deactivate(){this.running=false;this.keys={};this.intro=false;this.introStarted=false;music.engineStop();}
  bind(){const activate=()=>{switchGame('racha');this.c.focus();music.start();};this.c.addEventListener('pointerdown',e=>{e.preventDefault();activate();this.start();});this.c.addEventListener('click',e=>{e.preventDefault();activate();this.start();});window.addEventListener('keydown',e=>{const k=e.key.toLowerCase();const focused=this.c===document.activeElement;if(k===' '&&focused){e.preventDefault();if(e.repeat)return;activate();if(this.running){return;}this.start();return;}if(window.tomActiveGame!=='racha')return;if(['arrowleft','arrowright','arrowup','arrowdown'].includes(k))e.preventDefault();this.keys[k]=true;});window.addEventListener('keyup',e=>{if(window.tomActiveGame==='racha')delete this.keys[e.key.toLowerCase()];});}
  start(){if(this.gameOver||this.victory)this.reset();this.running=false;this.intro=true;this.introStarted=true;this.introDone=false;this.introElapsed=0;this.creditsY=this.c.height+50;this.gameOver=false;this.victory=false;this.timeLeft=120;this.last=performance.now();this.cars=[];this.explosions=[];this.spawnTimer=.35;this.player.x=this.c.width/2;this.inv=0;music.start();music.engineStart();}
  levelFor(){return Math.min(7,Math.floor(this.passed/10)+1);}
  roadWidthAt(y){const top=105,bottom=this.c.width-70,p=Math.max(0,Math.min(1,(y-45)/(this.c.height-45)));return top+(bottom-top)*p;}
  roadBounds(y){const w=this.roadWidthAt(y),center=this.c.width/2;return {left:center-w/2,right:center+w/2};}
  spawnCar(){const y=70-Math.random()*90,b=this.roadBounds(115),lane=Math.floor(Math.random()*4),x=b.left+(b.right-b.left)*(lane+.5)/4,colors=['#e60012','#20b8ff','#ffe43b','#18a957','#d83cff','#ff7a00','#f4f4f4'];this.cars.push({x,y,w:32+Math.random()*8,h:54+Math.random()*8,speed:155+this.level*34+Math.random()*70,lane,passed:false,color:colors[Math.floor(Math.random()*colors.length)]});}
  loseLife(){if(this.inv>0)return;this.lives--;this.inv=1.6;this.explosions.push({x:this.player.x,y:this.player.y,t:0,max:.75,big:true});music.explode();this.cars=[];if(this.lives<=0){this.running=false;this.gameOver=true;music.engineStop();music.stop();}else {this.player.x=this.c.width/2;music.engineStart();}}
  update(dt,t){if(!this.running){if(this.intro&&!this.introDone){this.introElapsed+=dt;const pr=Math.min(1,this.introElapsed/this.introDuration);this.creditsY=this.c.height+45-(this.c.height+205)*pr;if(this.introElapsed>=this.introDuration){this.introDone=true;this.intro=false;this.running=true;this.last=t;}}return;}this.timeLeft=Math.max(0,this.timeLeft-dt);this.inv=Math.max(0,this.inv-dt);const steer=315+this.level*8;if(this.keys.arrowleft)this.player.x-=steer*dt;if(this.keys.arrowright)this.player.x+=steer*dt;const rb=this.roadBounds(this.player.y);this.player.x=clamp(this.player.x,rb.left+28,rb.right-28);this.player.tilt=(this.keys.arrowleft?-1:this.keys.arrowright?1:0)*.12;const speed=145+this.level*38;music.engineSpeed(this.level);this.roadOffset=(this.roadOffset+speed*dt)%80;this.spawnTimer-=dt;if(this.spawnTimer<=0){this.spawnCar();this.spawnTimer=Math.max(.38,1.05-this.level*.06)+Math.random()*.35;}for(const car of this.cars){car.y+=(car.speed+speed*.45)*dt;const rw=this.roadWidthAt(car.y),center=this.c.width/2,targetX=center-rw/2+rw*(car.lane+.5)/4;car.x+=(targetX-car.x)*Math.min(1,dt*2.2);if(!car.passed&&car.y>this.player.y+45){car.passed=true;this.passed++;this.score+=10;music.pass();this.level=this.levelFor();}if(this.inv<=0&&Math.abs(car.x-this.player.x)<34&&Math.abs(car.y-this.player.y)<54){music.hit();this.loseLife();}}this.cars=this.cars.filter(car=>car.y<this.c.height+80);for(const e of this.explosions)e.t+=dt;this.explosions=this.explosions.filter(e=>e.t<e.max);if(this.timeLeft<=0){this.running=false;this.victory=true;music.engineStop();music.victory();setTimeout(()=>music.stop(),1600);}}
  drawScene(c,w,h,t){const themes=[{sky:'#1b73d1',ground:'#236b1f',road:'#555',edge:'#fff',mark:'#f4f4f4',name:'DIA'},{sky:'#090d2b',ground:'#0b1020',road:'#343434',edge:'#777',mark:'#ddd',name:'NOITE'},{sky:'#b9d7ef',ground:'#eef5fa',road:'#70757a',edge:'#fff',mark:'#fff',name:'NEVE'},{sky:'#4d6680',ground:'#1b3a2b',road:'#42474a',edge:'#b9d7c0',mark:'#e9e9e9',name:'CHUVA'},{sky:'#e47b42',ground:'#532b18',road:'#4a4a4a',edge:'#ffd77a',mark:'#ffe9ad',name:'PÔR DO SOL'},{sky:'#10151b',ground:'#15241c',road:'#252525',edge:'#7c7c7c',mark:'#d7d7d7',name:'TEMPESTADE'},{sky:'#32145e',ground:'#173b20',road:'#3d3d45',edge:'#ffe43b',mark:'#ffe43b',name:'NOITE FINAL'}];const th=themes[this.level-1];c.fillStyle=th.sky;c.fillRect(0,0,w,h);if(this.level===3){c.fillStyle='rgba(255,255,255,.7)';for(let i=0;i<80;i++){let x=(i*71)%w,y=(i*37+t*.05)%h;c.fillRect(x,y,2,2);}}if(this.level===4||this.level===6){c.strokeStyle='rgba(220,240,255,.45)';c.lineWidth=1;for(let i=0;i<55;i++){let x=(i*53+t*.3)%w,y=(i*29+t*1.1)%h;c.beginPath();c.moveTo(x,y);c.lineTo(x-7,y+18);c.stroke();}}c.fillStyle=th.ground;c.fillRect(0,170,w,h-170);const topY=120,bottomY=h,topW=160,bottomW=w-70,center=w/2;c.fillStyle=th.road;c.beginPath();c.moveTo(center-topW/2,topY);c.lineTo(center+topW/2,topY);c.lineTo(center+bottomW/2,bottomY);c.lineTo(center-bottomW/2,bottomY);c.closePath();c.fill();c.strokeStyle=th.edge;c.lineWidth=3;c.beginPath();c.moveTo(center-topW/2,topY);c.lineTo(center-bottomW/2,bottomY);c.moveTo(center+topW/2,topY);c.lineTo(center+bottomW/2,bottomY);c.stroke();c.strokeStyle=th.mark;c.lineWidth=5;c.setLineDash([28,28]);c.lineDashOffset=-this.roadOffset;c.beginPath();c.moveTo(center,topY);c.lineTo(center,bottomY);c.stroke();c.setLineDash([]);for(let i=0;i<12;i++){const y=185+((i*73+this.roadOffset*1.4)%330),p=(y-topY)/(h-topY),spread=bottomW/2*p+topW/2*(1-p),side=i%2?-1:1,x=center+side*(spread+35+(i%3)*18);c.fillStyle=this.level===3?'#dce9f2':(i%2?'#174d20':'#0d3917');c.fillRect(x,y-20,8,20);c.fillRect(x-10,y-27,28,10);}if(this.level===2||this.level===7){c.fillStyle='#fff';c.shadowColor='#fff';c.shadowBlur=18;c.beginPath();c.arc(95,78,18,0,Math.PI*2);c.fill();c.shadowBlur=0;}c.fillStyle='#fff';c.font='bold 11px monospace';c.fillText(th.name,w-105,22);}
  drawCar(c,car){const p=clamp((car.y-55)/(this.c.height-55),0,1);const scale=.42+p*.95;const w=car.w*scale,h=car.h*scale;c.save();c.translate(Math.round(car.x),Math.round(car.y));c.shadowColor=car.color;c.shadowBlur=9*scale;c.fillStyle='rgba(0,0,0,.28)';c.fillRect(-w*.46,h*.43,w*.92,Math.max(3,5*scale));c.fillStyle=car.color;c.fillRect(-w/2,-h/2,w,h);c.shadowBlur=0;c.fillStyle='#111';c.fillRect(-w*.38,-h*.30,w*.76,h*.24);c.fillStyle='#9fd7ff';c.fillRect(-w*.30,-h*.26,w*.60,h*.12);c.fillStyle='#111';c.fillRect(-w*.53,-h*.30,Math.max(3,5*scale),h*.20);c.fillRect(w*.40,-h*.30,Math.max(3,5*scale),h*.20);c.fillRect(-w*.53,h*.12,Math.max(3,5*scale),h*.20);c.fillRect(w*.40,h*.12,Math.max(3,5*scale),h*.20);c.fillStyle='#ff3040';c.fillRect(-w*.34,h*.31,w*.16,Math.max(2,4*scale));c.fillRect(w*.18,h*.31,w*.16,Math.max(2,4*scale));c.restore();}
  drawChampionFlag(c,w,h){c.save();const x=w/2+150,y=h/2-105,sw=72,sh=42;const wave=Math.sin(performance.now()/120)*5;c.strokeStyle='#fff';c.lineWidth=5;c.beginPath();c.moveTo(x,y-55);c.lineTo(x,y+55);c.stroke();c.beginPath();c.moveTo(x,y-52);c.quadraticCurveTo(x+25,y-47+wave,x+sw,y-32);c.lineTo(x+sw,y+2);c.quadraticCurveTo(x+30,y-8+wave,x,y-10);c.closePath();c.fillStyle='#fff';c.fill();const cols=4,rows=2;for(let r=0;r<rows;r++)for(let col=0;col<cols;col++){c.fillStyle=(r+col)%2?'#111':'#e60012';const xx=x+col*18,yy=y-48+r*20+(wave*(col/cols));c.fillRect(xx,yy,18,20);}c.fillStyle='#ffe43b';c.font='bold 9px monospace';c.textAlign='center';c.fillText('CAMPEÃO',x+36,y-60);c.restore();}
  drawPlayer(c){const p=this.player;c.save();c.translate(Math.round(p.x),Math.round(p.y));c.rotate(p.tilt);if(this.inv>0&&Math.floor(this.inv*10)%2===0)c.globalAlpha=.35;c.shadowColor='#e60012';c.shadowBlur=14;c.fillStyle='#e60012';c.fillRect(-21,-34,42,68);c.shadowBlur=0;c.fillStyle='#111';c.fillRect(-15,-25,30,17);c.fillStyle='#9fd7ff';c.fillRect(-11,-22,22,10);c.fillStyle='#fff';c.fillRect(-17,22,10,5);c.fillRect(7,22,10,5);c.fillStyle='#ffda00';c.fillRect(-19,-12,5,10);c.fillRect(14,-12,5,10);c.fillStyle='#111';c.fillRect(-25,-25,6,14);c.fillRect(19,-25,6,14);c.fillRect(-25,14,6,14);c.fillRect(19,14,6,14);c.restore();}
  drawCredits(c,w,h){const lines=['CORRA E SEJA VENCEDOR NESTA CORRIDA EMOCIONANTE!','MAS FIQUE ATENTO AO TEMPO!','ULTRAPASSE 10 CARROS PARA AVANÇAR DE NÍVEL','SÃO 7 NÍVEIS, CADA UM COM UMA NOVA PAISAGEM','OS CARROS FICAM MAIS RÁPIDOS A CADA NÍVEL','VOCÊ TEM 4 VIDAS','TERMINE A CORRIDA EM 02 MINUTOS','BOA SORTE!'];c.save();c.textAlign='center';c.font='bold 17px monospace';lines.forEach((line,i)=>{const y=this.creditsY+i*29;if(y>-25&&y<h+25){c.fillStyle=i===0?'#ffe43b':'#fff';c.shadowColor=i===0?'#ffe43b':'#fff';c.shadowBlur=8;c.fillText(line,w/2,y);}});c.restore();}
  draw(){const c=this.ctx,w=this.c.width,h=this.c.height,t=performance.now();this.drawScene(c,w,h,t);c.fillStyle='#fff';c.font='bold 14px monospace';c.fillText(`PONTOS ${String(this.score).padStart(4,'0')}`,12,24);c.fillText(`CARROS ${this.passed}`,125,24);c.fillText(`NÍVEL ${this.level}/7`,245,24);c.fillText(`VIDAS ${this.lives}`,360,24);c.fillText(`TEMPO ${Math.floor(this.timeLeft/60)}:${String(Math.ceil(this.timeLeft%60)).padStart(2,'0')}`,455,24);this.cars.forEach(car=>this.drawCar(c,car));this.drawPlayer(c);this.explosions.forEach(e=>{const p=e.t/e.max,r=12+p*75;c.save();c.translate(e.x,e.y);c.globalAlpha=1-p;for(let i=0;i<18;i++){const a=i*Math.PI*2/18;c.fillStyle=i%2?'#ffe43b':'#ff3b00';c.fillRect(Math.cos(a)*r*.65,Math.sin(a)*r*.65,6,6);}c.fillStyle='#fff';c.fillRect(-10,-10,20,20);c.restore();});if(!this.running&&this.intro&&this.introStarted){c.fillStyle='rgba(0,0,0,.9)';c.fillRect(0,42,w,h-42);this.drawCredits(c,w,h);c.fillStyle='#ffe43b';c.font='bold 12px monospace';c.textAlign='center';c.fillText('PREPARE-SE...',w/2,h-20);c.textAlign='left';return;}if(this.victory){c.fillStyle='rgba(0,0,0,.84)';c.fillRect(0,0,w,h);c.textAlign='center';c.shadowColor='#ffe43b';c.shadowBlur=20;c.fillStyle='#ffe43b';c.font="30px 'Press Start 2P'";c.fillText('VOCÊ VENCEU!',w/2,h/2-25);c.shadowBlur=0;c.fillStyle='#fff';c.font='13px monospace';c.fillText('02:00 COMPLETADOS!',w/2,h/2+15);c.fillStyle='#18a957';c.fillText(`CARROS ULTRAPASSADOS ${this.passed} • PONTOS ${this.score}`,w/2,h/2+45);c.fillStyle='#fff';c.fillText('ESPAÇO OU CLIQUE PARA JOGAR NOVAMENTE',w/2,h/2+78);this.drawChampionFlag(c,w,h);c.textAlign='left';return;}if(!this.running){c.fillStyle='rgba(0,0,0,.76)';c.fillRect(0,0,w,h);c.textAlign='center';c.shadowColor='#e60012';c.shadowBlur=18;c.fillStyle='#e60012';c.font="30px 'Press Start 2P'";c.fillText(this.gameOver?'GAME OVER':'RACHA',w/2,h/2-15);c.shadowBlur=0;c.fillStyle='#fff';c.font='11px monospace';c.fillText('ESPAÇO OU CLIQUE PARA START',w/2,h/2+25);c.textAlign='left';}}
  loop(t){this.raf=0;if(this.active===false)return;const dt=Math.min(.04,(t-(this.last||t))/1000);this.last=t;this.update(dt,t);this.draw();this.raf=requestAnimationFrame(e=>this.loop(e));}
}

/* ALIEN FORT — batalha espacial arcade retrô. */
class AlienFort{
  constructor(c){this.c=c;this.ctx=c.getContext('2d');this.ctx.imageSmoothingEnabled=false;this.resetAll();this.bind();this.loop(0);}
  resetAll(){
    this.score=0;this.level=1;this.lives=4;this.running=false;this.demo=true;this.intro=false;this.introStarted=false;this.introDone=false;this.introElapsed=0;this.introDuration=5;this.creditsY=this.c.height+55;this.last=0;this.t=0;
    this.ufo={x:this.c.width/2,y:-90,targetY:this.c.height/2,scale:.45,light:0,descending:false,alive:true,shield:0};
    this.asteroids=[];this.shots=[];this.explosions=[];this.spawnTimer=.7;this.keys={};this.gameOver=false;this.victory=false;this.flash=0;
    this.levelTransition=false;this.transitionTime=0;this.transitionPhase='idle';this.transitionDuration=3.6;
  }
  bind(){
    const activate=()=>{switchGame('alienFort');this.c.focus();music.start();};
    this.c.addEventListener('click',e=>{e.preventDefault();activate();if(!this.running)this.start();});
    this.c.addEventListener('pointerdown',e=>{e.preventDefault();activate();if(!this.running)this.start();});
    window.addEventListener('keydown',e=>{
      if(window.tomActiveGame!=='alienFort')return;const k=e.key.toLowerCase();
      if([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(k))e.preventDefault();
      if(k===' '){if(e.repeat)return;activate();if(!this.running&&!this.levelTransition)this.start();return;}
      if(['arrowup','arrowdown','arrowleft','arrowright'].includes(k)){this.keys[k]=true;if(this.running&&!this.levelTransition)this.fire(k);}
    });
    window.addEventListener('keyup',e=>{if(window.tomActiveGame==='alienFort')delete this.keys[e.key.toLowerCase()];});
  }
  deactivate(){this.running=false;this.intro=false;this.introStarted=false;this.keys={};this.levelTransition=false;}
  start(){
    if(this.gameOver||this.victory)this.resetAll();
    this.running=false;this.demo=false;this.intro=true;this.introStarted=true;this.introDone=false;this.introElapsed=0;this.creditsY=this.c.height+45;this.last=performance.now();this.t=0;
    this.ufo={x:this.c.width/2,y:-90,targetY:this.c.height/2,scale:.45,light:0,descending:true,alive:true,shield:0};
    this.asteroids=[];this.shots=[];this.explosions=[];this.spawnTimer=.65;this.gameOver=false;this.victory=false;this.level=1;this.score=0;this.lives=4;this.levelTransition=false;music.start();
  }
  fire(k){if(!this.ufo.alive||this.shots.length>=14)return;const dirs={arrowup:{x:0,y:-1},arrowdown:{x:0,y:1},arrowleft:{x:-1,y:0},arrowright:{x:1,y:0}};const d=dirs[k];if(!d)return;this.shots.push({x:this.ufo.x+d.x*30,y:this.ufo.y+d.y*24,vx:d.x*620,vy:d.y*620,t:0});music.shoot();}
  spawnAsteroid(){
    const side=Math.floor(Math.random()*4),pad=36,cx=this.c.width/2,cy=this.c.height/2,speed=115+(this.level-1)*46+Math.random()*(65+this.level*3);
    let x,y,vx,vy;
    if(side===0){x=-pad;y=cy;vx=speed;vy=0;}else if(side===1){x=this.c.width+pad;y=cy;vx=-speed;vy=0;}else if(side===2){x=cx;y=-pad;vx=0;vy=speed;}else{x=cx;y=this.c.height+pad;vx=0;vy=-speed;}
    const r=12+Math.random()*13;this.asteroids.push({x,y,vx,vy,r,rot:Math.random()*6.28,spin:(Math.random()-.5)*3,flash:0});
  }
  beginLevelTransition(nextLevel){
    this.level=nextLevel;this.running=false;this.levelTransition=true;this.transitionTime=0;this.transitionPhase='up';this.ufo.descending=false;this.asteroids=[];this.shots=[];this.explosions=[];this.spawnTimer=.8;music.sfx(880,.12,'square',.09);music.sfx(1175,.18,'square',.08,.12);
  }
  updateTransition(dt){
    this.transitionTime+=dt;this.ufo.light+=dt*9;
    const h=this.c.height, center=h/2;
    if(this.transitionPhase==='up'){
      this.ufo.y-=h/1.15*dt;
      if(this.ufo.y<=-100){this.ufo.y=-100;this.transitionPhase='down';}
    }else if(this.transitionPhase==='down'){
      this.ufo.y+= (center+100)/1.55*dt;
      if(this.ufo.y>=center){this.ufo.y=center;this.transitionPhase='hold';}
    }else if(this.transitionPhase==='hold' && this.transitionTime>=this.transitionDuration){
      this.levelTransition=false;this.running=true;this.last=performance.now();this.spawnTimer=.55;
    }
  }
  update(dt,t){
    if(!this.running){
      if(this.levelTransition){this.updateTransition(dt);return;}
      if(this.intro&&!this.introDone){
        this.introElapsed+=dt;const pr=Math.min(1,this.introElapsed/this.introDuration);this.creditsY=this.c.height+45-(this.c.height+210)*pr;
        if(this.ufo.descending){this.ufo.y=-90+(this.ufo.targetY+90)*Math.min(1,this.introElapsed/2.2);this.ufo.light+=dt*8;if(this.ufo.y>=this.ufo.targetY){this.ufo.y=this.ufo.targetY;this.ufo.descending=false;}}
        if(this.introElapsed>=this.introDuration){this.introDone=true;this.intro=false;this.running=true;this.last=t;this.spawnTimer=.45;}
      }return;
    }
    this.t=t;this.ufo.light+=dt*9;this.flash=Math.max(0,this.flash-dt);
    if(this.ufo.alive){this.ufo.shield=Math.max(0,this.ufo.shield-dt);this.ufo.x=this.c.width/2;this.ufo.y=this.c.height/2;}
    for(const s of this.shots){s.x+=s.vx*dt;s.y+=s.vy*dt;s.t+=dt;}this.shots=this.shots.filter(s=>s.x>-20&&s.x<this.c.width+20&&s.y>-20&&s.y<this.c.height+20);
    this.spawnTimer-=dt;if(this.spawnTimer<=0){const salvo=this.level>=10?3:(this.level>=8?2:1);for(let n=0;n<salvo;n++)this.spawnAsteroid();this.spawnTimer=Math.max(.11,.78-(this.level-1)*.067)+Math.random()*.12;}
    for(const a of this.asteroids){a.x+=a.vx*dt;a.y+=a.vy*dt;a.rot+=a.spin*dt;a.flash=Math.max(0,a.flash-dt);}
    for(let i=this.asteroids.length-1;i>=0;i--){const a=this.asteroids[i];let destroyed=false;for(let j=this.shots.length-1;j>=0;j--){const s=this.shots[j];if(Math.hypot(a.x-s.x,a.y-s.y)<a.r+7){this.shots.splice(j,1);this.asteroids.splice(i,1);this.score+=10;this.flash=.08;this.explosions.push({x:a.x,y:a.y,t:0,max:.32,big:false});music.explode();destroyed=true;break;}}if(destroyed)continue;if(this.ufo.alive&&this.ufo.shield<=0&&Math.hypot(a.x-this.ufo.x,a.y-this.ufo.y)<a.r+34){this.asteroids.splice(i,1);this.lives--;this.ufo.shield=2.2;this.explosions.push({x:this.ufo.x,y:this.ufo.y,t:0,max:.65,big:true});music.explode();if(this.lives<=0){this.lives=0;this.running=false;this.gameOver=true;music.stop();}}}
    this.asteroids=this.asteroids.filter(a=>a.x>-70&&a.x<this.c.width+70&&a.y>-70&&a.y<this.c.height+70);
    for(const e of this.explosions)e.t+=dt;this.explosions=this.explosions.filter(e=>e.t<e.max);
    const newLevel=Math.min(11,Math.floor(this.score/110)+1);
    if(newLevel!==this.level){if(newLevel>=11){this.level=10;this.running=false;this.victory=true;music.victory();setTimeout(()=>music.stop(),1600);}else this.beginLevelTransition(newLevel);}
  }
  drawPlanet(c,w,h,t){
    const themes=[
      {sky:'#020611',a:'#173b7a',b:'#0b1630',planet:'#6e8fbf',ring:false,name:'PLANETA AZUL'},
      {sky:'#08020f',a:'#40156b',b:'#16062d',planet:'#a34cff',ring:true,name:'PLANETA VIOLETA'},
      {sky:'#021015',a:'#075b67',b:'#02262c',planet:'#58d1d9',ring:true,name:'PLANETA GELO'},
      {sky:'#100702',a:'#8a3214',b:'#351008',planet:'#e46b35',ring:false,name:'PLANETA FOGO'},
      {sky:'#050b03',a:'#3c661d',b:'#102408',planet:'#8bc34a',ring:true,name:'PLANETA VERDE'},
      {sky:'#10050d',a:'#7a163c',b:'#2a0718',planet:'#d83cff',ring:true,name:'PLANETA NEBULOSA'},
      {sky:'#020206',a:'#26345f',b:'#080d1e',planet:'#d8d8e8',ring:true,name:'PLANETA FINAL'},
      {sky:'#11020a',a:'#7d123b',b:'#250511',planet:'#ff5f9e',ring:false,name:'PLANETA RUBI'},
      {sky:'#02110b',a:'#0b6b49',b:'#03271b',planet:'#52e39b',ring:true,name:'PLANETA ESMERALDA'},
      {sky:'#09030f',a:'#5b2a9d',b:'#18082f',planet:'#b88cff',ring:true,name:'PLANETA ABISMO'},
    ];
    const th=themes[this.level-1];c.fillStyle=th.sky;c.fillRect(0,0,w,h);
    const grd=c.createRadialGradient(w*.68,h*.38,20,w*.68,h*.38,h*.72);grd.addColorStop(0,th.a);grd.addColorStop(1,th.b);c.globalAlpha=.72;c.fillStyle=grd;c.fillRect(0,0,w,h);c.globalAlpha=1;
    for(let i=0;i<130;i++){const x=(i*83+17)%w,y=(i*47+31+t*(.008+(i%4)*.002))%h,s=1+(i%3===0);const tw=(Math.sin(t/180+i*1.7)+1)/2;c.fillStyle=i%17===0?'#20b8ff':`rgba(255,255,255,${.3+tw*.7})`;c.fillRect(x,y,s,s);}
    const px=[w*.18,w*.82,w*.64,w*.27,w*.78,w*.38,w*.72,w*.24,w*.76,w*.50][this.level-1],py=[h*.28,h*.25,h*.30,h*.27,h*.23,h*.31,h*.25,h*.29,h*.24,h*.27][this.level-1],pr=[54,66,48,62,58,70,60,58,64,72][this.level-1];
    c.save();c.translate(px,py);if(th.ring){c.strokeStyle='rgba(255,255,255,.32)';c.lineWidth=8;c.beginPath();c.ellipse(0,8,pr*1.75,pr*.32,-.18,0,Math.PI*2);c.stroke();}const pg=c.createRadialGradient(-pr*.35,-pr*.35,5,0,0,pr);pg.addColorStop(0,'#fff');pg.addColorStop(.22,th.planet);pg.addColorStop(1,th.b);c.fillStyle=pg;c.beginPath();c.arc(0,0,pr,0,Math.PI*2);c.fill();c.fillStyle='rgba(255,255,255,.16)';for(let i=0;i<7;i++){c.beginPath();c.arc((i*23%70)-35,(i*31%70)-35,5+i%4,0,Math.PI*2);c.fill();}c.restore();
    c.fillStyle='#fff';c.font='bold 11px monospace';c.fillText(th.name,w-150,22);
  }
  drawUfo(c){const u=this.ufo;if(!u.alive)return;c.save();c.translate(Math.round(u.x),Math.round(u.y));c.scale(u.scale,u.scale);c.shadowColor='#20b8ff';c.shadowBlur=24;c.fillStyle='#aeb7c2';c.beginPath();c.ellipse(0,0,72,25,0,0,Math.PI*2);c.fill();c.shadowBlur=0;c.fillStyle='#56606b';c.beginPath();c.ellipse(0,-10,38,22,0,Math.PI,Math.PI*2);c.fill();c.fillStyle='#d9f5ff';c.beginPath();c.ellipse(0,-10,27,16,0,Math.PI,Math.PI*2);c.fill();for(let i=-3;i<=3;i++){const on=Math.sin(this.ufo.light+i*1.7)>0;c.fillStyle=on?'#ffe43b':'#e60012';c.shadowColor=c.fillStyle;c.shadowBlur=12;c.beginPath();c.arc(i*20,17,5,0,Math.PI*2);c.fill();}c.fillStyle='#20b8ff';c.globalAlpha=.45;c.beginPath();c.ellipse(0,28,52,12,0,0,Math.PI*2);c.fill();c.globalAlpha=1;if(u.shield>0){c.strokeStyle='#20b8ff';c.lineWidth=3;c.beginPath();c.arc(0,0,82,0,Math.PI*2);c.stroke();}c.restore();}
  drawAsteroid(c,a){c.save();c.translate(Math.round(a.x),Math.round(a.y));c.rotate(a.rot);c.shadowColor='#aaa';c.shadowBlur=7;c.fillStyle=a.flash?'#fff':'#777';c.beginPath();const n=8;for(let i=0;i<n;i++){const rr=a.r*(.75+((i*7)%5)/10),ang=i*Math.PI*2/n;i?c.lineTo(Math.cos(ang)*rr,Math.sin(ang)*rr):c.moveTo(Math.cos(ang)*rr,Math.sin(ang)*rr);}c.closePath();c.fill();c.shadowBlur=0;c.fillStyle='#444';c.fillRect(-a.r*.35,-a.r*.15,5,5);c.fillRect(a.r*.12,a.r*.22,4,4);c.restore();}
  drawExplosion(c,e){const p=e.t/e.max,r=(e.big?12:5)+p*(e.big?90:40);c.save();c.translate(e.x,e.y);c.globalAlpha=1-p;for(let i=0;i<16;i++){const ang=i*Math.PI*2/16,rr=r*(.45+(i%3)*.16);c.fillStyle=i%2?'#ffe43b':'#ff5a00';c.fillRect(Math.cos(ang)*rr,Math.sin(ang)*rr,5+(1-p)*6,5+(1-p)*6);}c.fillStyle='#fff';c.fillRect(-6,-6,12,12);c.restore();}
  drawCredits(c,w,h){const lines=['ALIEN FORT','UM GRANDE DISCO VOADOR PROTEGE A FORTALEZA ESPACIAL','ASTEROIDES VÊM DO CENTRO DOS QUATRO LADOS','USE AS SETAS PARA ATIRAR EM TODAS AS DIREÇÕES','CADA ASTEROIDE DESTRUÍDO VALE 10 PONTOS','A CADA 110 PONTOS, UM NOVO PLANETA E MAIS PERIGO','SÃO 10 NÍVEIS — CADA UM COM UMA PAISAGEM DIFERENTE','VOCÊ TEM 4 VIDAS','DESTRUA OS ASTEROIDES E VENÇA A BATALHA!'];c.save();c.textAlign='center';lines.forEach((line,i)=>{const y=this.creditsY+i*30;if(y>-25&&y<h+25){c.fillStyle=i===0?'#20b8ff':'#fff';c.shadowColor=i===0?'#20b8ff':'#fff';c.shadowBlur=9;c.font=i===0?'bold 24px monospace':'bold 16px monospace';c.fillText(line,w/2,y);}});c.restore();}
  draw(){const c=this.ctx,w=this.c.width,h=this.c.height,t=performance.now();this.drawPlanet(c,w,h,t);c.fillStyle='#fff';c.font='bold 14px monospace';c.fillText(`PONTOS ${String(this.score).padStart(5,'0')}`,12,22);c.fillText(`VIDAS ${this.lives}`,170,22);c.fillText(`NÍVEL ${this.level}/10`,250,22);c.fillStyle='#20b8ff';c.font='bold 10px monospace';c.fillText('SETAS • ATIRAR',590,22);this.asteroids.forEach(a=>this.drawAsteroid(c,a));this.shots.forEach(s=>{c.fillStyle='#20b8ff';c.shadowColor='#20b8ff';c.shadowBlur=12;c.fillRect(s.x-3,s.y-3,6,6);c.shadowBlur=0;});this.drawUfo(c);this.explosions.forEach(e=>this.drawExplosion(c,e));
    if(this.levelTransition){c.fillStyle='rgba(0,0,0,.28)';c.fillRect(0,0,w,h);c.textAlign='center';c.fillStyle='#20b8ff';c.shadowColor='#20b8ff';c.shadowBlur=15;c.font='bold 22px monospace';c.fillText(`NÍVEL ${this.level}`,w/2,78);c.shadowBlur=0;c.fillStyle='#fff';c.font='bold 13px monospace';c.fillText('NOVO PLANETA • A FORTALEZA ESTÁ CHEGANDO...',w/2,h-38);c.textAlign='left';return;}
    if(!this.running&&this.intro&&this.introStarted){c.fillStyle='rgba(0,0,0,.93)';c.fillRect(0,42,w,h-42);this.drawCredits(c,w,h);c.fillStyle='#ffe43b';c.font='bold 12px monospace';c.textAlign='center';c.fillText('PREPARE-SE...',w/2,h-20);c.textAlign='left';return;}
    if(this.victory){c.fillStyle='rgba(0,0,0,.85)';c.fillRect(0,0,w,h);c.textAlign='center';c.shadowColor='#ffe43b';c.shadowBlur=22;c.fillStyle='#ffe43b';c.font="30px 'Press Start 2P'";c.fillText('PARABÉNS!',w/2,h/2-35);c.shadowBlur=0;c.fillStyle='#fff';c.font="16px 'Press Start 2P'";c.fillText('VOCÊ VENCEU!',w/2,h/2+10);c.fillStyle='#20b8ff';c.font='12px monospace';c.fillText('10 PLANETAS COMPLETADOS • FORTALEZA SALVA!',w/2,h/2+48);c.fillStyle='#fff';c.font='10px monospace';c.fillText('ESPAÇO OU CLIQUE PARA JOGAR NOVAMENTE',w/2,h/2+82);c.textAlign='left';return;}
    if(!this.running){c.fillStyle='rgba(0,0,0,.76)';c.fillRect(0,0,w,h);c.textAlign='center';c.shadowColor='#e60012';c.shadowBlur=18;c.fillStyle='#e60012';c.font="30px 'Press Start 2P'";c.fillText(this.gameOver?'GAME OVER':'ALIEN FORT',w/2,h/2-15);c.shadowBlur=0;c.fillStyle='#fff';c.font='11px monospace';c.fillText(this.gameOver?'ESPAÇO OU CLIQUE PARA JOGAR NOVAMENTE':'ESPAÇO OU CLIQUE PARA START',w/2,h/2+25);c.textAlign='left';}}
  loop(t){this.raf=0;if(this.active===false)return;const dt=Math.min(.04,(t-(this.last||t))/1000);this.last=t;this.update(dt,t);this.draw();this.raf=requestAnimationFrame(e=>this.loop(e));}
}

/* PAC BANG — o Pacman cansou de comer e agora atira nos fantasmas. */
class PacBang{
  constructor(c){
    this.c=c; this.ctx=c.getContext('2d'); this.ctx.imageSmoothingEnabled=false;
    this.resetAll(); this.bind(); this.loop(0);
  }
  resetAll(){
    this.score=0; this.lives=3; this.level=1; this.energy=100; this.running=false; this.demo=true; this.victory=false;
    this.shield=0; this.bombs=2; this.bombExplosions=[]; this.bullets=[]; this.enemyBullets=[]; this.explosions=[]; this.ghosts=[]; this.boss=null; this.lastShot=0; this.lastEnemyShot=0; this.last=0; this.flash=0; this.creditsY=this.c.height+150; this.creditsSpeed=24;
    this.player={x:this.c.width/2,y:this.c.height-58,speed:330,mouth:0}; this.keys={}; this.intro=false; this.introY=this.c.height+120; this.introDone=false; this.introStarted=false; this.makeWave();
  }
  makeWave(){
    const colors=['#ff3030','#20b8ff','#ff69d4','#18a957','#ff8c00','#b65cff','#00e5ff','#ffda00'];
    const count=Math.min(8,4+this.level);
    this.ghosts=[];
    for(let i=0;i<count;i++){
      this.ghosts.push({x:75+i*(610/Math.max(1,count-1)),y:95+(i%2)*45,baseY:95+(i%2)*45,phase:Math.random()*Math.PI*2,speed:68+this.level*30+(i%3)*12,dir:i%2? -1:1,color:colors[i%colors.length],alive:true,blink:Math.random()*6.28,dive:0,diveTimer:Math.max(.9,2.5-this.level*.35)+Math.random()*2.2,shootTimer:Math.max(.65,1.7-this.level*.22)+Math.random()*1.8});
    }
    this.enemyBullets=[]; this.bullets=[];
  }
  spawnBoss(){
    this.boss={x:this.c.width/2,y:105,dir:1,speed:150,hp:110,maxHp:110,flash:0,shootTimer:.55,diveTimer:2.4,minionTimer:2.2};
    this.ghosts=[]; this.enemyBullets=[];
  }
  bind(){
    const activate=()=>{switchGame('pacbang');this.c.focus();music.start();};
    window.addEventListener('keydown',e=>{
      const k=e.key.toLowerCase();
      const focused=this.c===document.activeElement;
      if(k===' ' && focused){
        e.preventDefault();
        if(e.repeat)return;
        activate();
        if(this.running)this.useBomb();else this.start();
        return;
      }
      if(window.tomActiveGame!=='pacbang')return;
      if(['arrowleft','arrowright','a'].includes(k))e.preventDefault();
      this.keys[k]=true;
      if(k==='a')this.fire();
    });
    window.addEventListener('keyup',e=>{if(window.tomActiveGame==='pacbang')delete this.keys[e.key.toLowerCase()];});
    this.c.addEventListener('pointerdown',e=>{e.preventDefault();activate();this.start();if(e.pointerType==='touch')this.touchX=e.clientX;});
    this.c.addEventListener('click',e=>{e.preventDefault();activate();this.start();});
    this.c.addEventListener('pointermove',e=>{if(e.pointerType==='touch'&&this.touchX!=null&&this.running){const r=this.c.getBoundingClientRect();this.player.x=clamp((e.clientX-r.left)/r.width*this.c.width,34,this.c.width-34);}});
    this.c.addEventListener('pointerup',e=>{if(e.pointerType==='touch')this.touchX=null;});
    this.c.addEventListener('pointercancel',()=>this.touchX=null);
  }
  deactivate(){this.running=false;this.intro=false;this.introStarted=false;this.keys={};this.touchX=null;}
  start(){
    if(this.victory||this.lives<=0){this.resetAll();}
    this.running=false; this.demo=false; this.intro=true; this.introStarted=true; this.introDone=false; this.creditsY=this.c.height+80; if(this.energy<=0)this.energy=100; music.start(); this.last=performance.now();
  }
  fire(){
    const now=performance.now(); if(!this.running||now-this.lastShot<180||this.bullets.length>=8)return;
    this.lastShot=now; this.bullets.push({x:this.player.x,y:this.player.y-28,v:-600}); music.shoot();
  }
  useBomb(){
    if(!this.running||this.bombs<=0)return;
    this.bombs--;
    this.bombExplosions.push({t:0,max:.65});
    for(const g of this.ghosts){if(g.alive){g.alive=false;this.score+=10;this.addExplosion(g.x,g.y,false);}}
    if(this.boss){this.boss.hp=Math.max(0,this.boss.hp-20);this.boss.flash=.22;this.score+=50;this.addExplosion(this.boss.x,this.boss.y,true);if(this.boss.hp<=0){this.score+=500;this.addExplosion(this.boss.x,this.boss.y,true);this.boss=null;this.victory=true;this.running=false;music.victory();}}
    music.explode();
  }
  addExplosion(x,y,big=false){this.explosions.push({x,y,t:0,max:big?.62:.38,big});music.explode();}
  loseLife(){
    if(this.shield>0||this.victory||!this.running)return;
    this.addExplosion(this.player.x,this.player.y,true); this.lives--; this.energy=100; this.bullets=[]; this.enemyBullets=[];
    if(this.lives<=0){this.running=false;music.stop();return;}
    this.player.x=this.c.width/2; this.shield=4; this.bombs=2; this.level=Math.max(1,this.level); this.makeWave();
  }
  hitPlayer(dmg){
    if(this.shield>0)return;
    this.energy-=dmg; this.flash=.12; music.hit();
    if(this.energy<=0)this.loseLife();
  }
  update(dt,t){
    this.player.mouth=(Math.sin(t/95)+1)/2;
    if(!this.running&&this.intro&&!this.introDone){this.creditsY-=this.creditsSpeed*dt;if(this.creditsY<-230){this.introDone=true;this.intro=false;this.running=true;this.last=performance.now();}} this.bombExplosions.forEach(e=>e.t+=dt);this.bombExplosions=this.bombExplosions.filter(e=>e.t<e.max);
    if(this.shield>0)this.shield=Math.max(0,this.shield-dt);
    this.flash=Math.max(0,this.flash-dt);
    this.explosions.forEach(e=>e.t+=dt); this.explosions=this.explosions.filter(e=>e.t<e.max);
    if(!this.running)return;
    if(this.keys.arrowleft)this.player.x-=this.player.speed*dt;
    if(this.keys.arrowright)this.player.x+=this.player.speed*dt;
    this.player.x=clamp(this.player.x,34,this.c.width-34);
    this.bullets.forEach(b=>b.y+=b.v*dt); this.bullets=this.bullets.filter(b=>b.y>-20);
    this.updateGhosts(dt,t);
    this.enemyBullets.forEach(b=>{b.x+=b.vx*dt;b.y+=b.vy*dt;b.rot+=dt*8;});
    this.enemyBullets=this.enemyBullets.filter(b=>b.y<this.c.height+25&&b.x>-30&&b.x<this.c.width+30);
    for(const b of this.enemyBullets){if(Math.hypot(b.x-this.player.x,b.y-this.player.y)<24){b.y=this.c.height+50;this.hitPlayer(18);}}
    this.handleHits();
    if(this.boss)this.updateBoss(dt,t);
    else if(this.ghosts.length&&this.ghosts.every(g=>!g.alive)){
      if(this.level<4){this.level++;this.score+=100;this.makeWave();}
      else this.spawnBoss();
    }
  }
  updateGhosts(dt,t){
    for(const g of this.ghosts){
      if(!g.alive)continue;
      if(g.dive>0){g.dive-=dt;const targetY=this.player.y-30;g.x+=(this.player.x-g.x)*Math.min(1,dt*2.8);g.y+=(targetY-g.y)*Math.min(1,dt*2.1);if(g.dive<=0){g.dive=0;g.y=g.baseY;}}
      else {g.x+=g.dir*g.speed*dt;if(g.x<48||g.x>this.c.width-48){g.dir*=-1;g.x=clamp(g.x,48,this.c.width-48);}g.y=g.baseY+Math.sin(t/450+g.phase)*12;g.diveTimer-=dt;if(g.diveTimer<=0){g.diveTimer=Math.max(.8,2.4-this.level*.25)+Math.random()*2.6;if(Math.random()<.20+this.level*.08)this.startDive(g);}}
      g.shootTimer-=dt;
      if(g.shootTimer<=0){g.shootTimer=Math.max(.45,1.15-this.level*.12)+Math.random()*1.8;if(Math.random()<.72+this.level*.06)this.enemyFire(g);}
    }
  }
  startDive(g){g.dive=1.4;}
  enemyFire(g){const dx=this.player.x-g.x,dy=this.player.y-g.y,len=Math.hypot(dx,dy)||1;const v=185+this.level*30;this.enemyBullets.push({x:g.x,y:g.y+20,vx:dx/len*v,vy:dy/len*v,rot:0});if(this.level>=3&&Math.random()<.32){this.enemyBullets.push({x:g.x+12,y:g.y+18,vx:dx/len*(v*.9)-45,vy:dy/len*(v*.9),rot:0});}}
  updateBoss(dt,t){
    const b=this.boss; if(!b)return;
    b.flash=Math.max(0,b.flash-dt); b.x+=b.dir*b.speed*dt;if(b.x<100||b.x>this.c.width-100)b.dir*=-1;b.y=105+Math.sin(t/420)*22;
    b.shootTimer-=dt;if(b.shootTimer<=0){b.shootTimer=.38+Math.random()*.48;for(let i=-2;i<=2;i++){const dx=this.player.x-b.x+i*55,dy=this.player.y-b.y,len=Math.hypot(dx,dy)||1;const v=175+this.level*24;this.enemyBullets.push({x:b.x+i*24,y:b.y+25,vx:dx/len*v,vy:dy/len*v,rot:0});}}
    b.minionTimer-=dt;if(b.minionTimer<=0){b.minionTimer=3.8+Math.random()*1.8;this.spawnBossMinions();}
    b.diveTimer-=dt;if(b.diveTimer<=0){b.diveTimer=2.2+Math.random()*1.8;b.dive=1.15;}if(b.dive>0){b.dive-=dt;b.y+=(this.player.y-80-b.y)*Math.min(1,dt*3.0);if(Math.hypot(b.x-this.player.x,b.y-this.player.y)<65){this.hitPlayer(34);b.dive=0;b.y=105;}}
  }
  spawnBossMinions(){
    const colors=['#ff3030','#20b8ff','#ff69d4','#18a957','#ff8c00','#b65cff','#00e5ff','#ffda00'];
    const n=1+Math.floor(Math.random()*2);
    for(let i=0;i<n;i++){
      const side=i%2===0?-1:1, x=clamp(this.boss.x+side*(45+i*30),48,this.c.width-48);
      this.ghosts.push({x:x,y:145+(i%2)*38,baseY:145+(i%2)*38,phase:Math.random()*Math.PI*2,speed:115+this.level*28+Math.random()*25,dir:Math.random()<.5?-1:1,color:colors[(i+this.level+2)%colors.length],alive:true,blink:Math.random()*6.28,dive:0,diveTimer:.9+Math.random()*1.8,shootTimer:.6+Math.random()*1.3});
    }
  }
  handleHits(){
    for(let i=this.bullets.length-1;i>=0;i--){const b=this.bullets[i];let hit=false;
      for(const g of this.ghosts){if(g.alive&&Math.hypot(b.x-g.x,b.y-g.y)<27){g.alive=false;this.score+=10;this.addExplosion(g.x,g.y,false);hit=true;break;}}
      if(!hit&&this.boss&&Math.hypot(b.x-this.boss.x,b.y-this.boss.y)<72){this.boss.hp--;this.boss.flash=.1;this.score+=15;music.hit();hit=true;if(this.boss.hp<=0){this.score+=500;this.addExplosion(this.boss.x,this.boss.y,true);this.addExplosion(this.boss.x-45,this.boss.y+10,true);this.addExplosion(this.boss.x+45,this.boss.y-8,true);this.boss=null;this.victory=true;this.running=false;music.victory();}}
      if(hit)this.bullets.splice(i,1);
    }
    for(const g of this.ghosts){if(g.alive&&g.dive>0&&Math.hypot(g.x-this.player.x,g.y-this.player.y)<34){g.alive=false;this.hitPlayer(30);this.addExplosion(g.x,g.y,false);}}
  }
  drawStars(c,w,h,t){
    c.fillStyle='#000';c.fillRect(0,0,w,h);
    for(let i=0;i<125;i++){const x=(i*83+17)%w,y=(i*47+29)%h,s=1+(i%3===0);const tw=(Math.sin(t/180+i*1.71)+1)/2;c.fillStyle=i%17===0?'#18a957':`rgba(255,255,255,${.25+tw*.75})`;c.fillRect(x,y,s,s);if(i%29===0&&tw>.9){c.fillRect(x-4,y,9,1);c.fillRect(x,y-4,1,9);}}
    if(Math.sin(t/900)*.5+.5>.94){c.fillStyle='rgba(255,255,255,.18)';c.fillRect(0,40,w,2);}
  }
  drawPacman(c){
    const p=this.player,m=.16+.27*(1-p.mouth);c.save();c.translate(Math.round(p.x),Math.round(p.y));c.shadowColor='#ffe43b';c.shadowBlur=18;c.fillStyle='#ffe43b';c.beginPath();c.moveTo(0,0);c.arc(0,0,25,m,Math.PI*2-m);c.lineTo(0,0);c.fill();c.shadowBlur=0;c.fillStyle='#111';c.fillRect(-5,-15,5,7);c.fillStyle='#fff';c.fillRect(-4,-14,2,3);c.fillStyle='#e60012';c.fillRect(-1,16,2,5);if(this.shield>0){c.strokeStyle='#20b8ff';c.lineWidth=3;c.beginPath();c.arc(0,0,38,0,Math.PI*2);c.stroke();}c.restore();
  }
  drawGhost(c,g){
    if(!g.alive)return;c.save();c.translate(Math.round(g.x),Math.round(g.y));c.shadowColor=g.color;c.shadowBlur=14;c.fillStyle=g.color;c.beginPath();c.arc(0,-2,24,Math.PI,0);c.lineTo(24,22);c.lineTo(12,15);c.lineTo(0,22);c.lineTo(-12,15);c.lineTo(-24,22);c.closePath();c.fill();c.shadowBlur=0;
    const blink=(Math.sin(performance.now()/650+g.blink)>0.92);c.fillStyle='#fff';c.fillRect(-13,-9,10,13);c.fillRect(3,-9,10,13);if(blink){c.fillStyle='#111';c.fillRect(-11,-4,7,2);c.fillRect(5,-4,7,2);}else{c.fillStyle='#111';c.fillRect(-10,-5,5,7);c.fillRect(6,-5,5,7);}c.fillStyle='#111';const open=(Math.sin(performance.now()/210+g.blink)>0)?5:2;c.fillRect(-9,10,18,open);c.fillStyle='#fff';c.fillRect(-5,10,3,2);c.fillRect(3,10,3,2);c.restore();
  }
  drawBoss(c){
    const b=this.boss;if(!b)return;c.save();c.translate(Math.round(b.x),Math.round(b.y));c.shadowColor='#d83cff';c.shadowBlur=24;c.fillStyle=b.flash?'#fff':'#8b38d6';c.beginPath();c.arc(0,0,55,Math.PI,0);c.lineTo(55,45);c.lineTo(28,28);c.lineTo(0,47);c.lineTo(-28,28);c.lineTo(-55,45);c.closePath();c.fill();c.shadowBlur=0;c.fillStyle='#fff';c.fillRect(-29,-18,22,25);c.fillRect(7,-18,22,25);c.fillStyle='#111';c.fillRect(-22,-10,8,10);c.fillRect(14,-10,8,10);c.fillStyle='#111';c.fillRect(-22,16,44,7);c.fillStyle='#e60012';c.fillRect(-12,17,8,4);c.fillRect(4,17,8,4);c.restore();
  }
  drawCredits(c,w,h){
    const lines=['O PACMAN CANSOU DE COMER...','AGORA ELE ATIRA NOS FANTASMINHAS!','MOVA COM AS SETAS • A PARA ATIRAR • ESPAÇO: BOMBA','VOCÊ TEM 2 BOMBAS PARA USAR NA BATALHA','SOBREVIVA A 4 NÍVEIS DE CAOS','OS FANTASMAS FICAM MAIS RÁPIDOS E AGRESSIVOS A CADA NÍVEL','NO ÚLTIMO NÍVEL, ENFRENTE O CHEFÃO','O CHEFÃO SOLTA ALGUNS FANTASMINHAS DE REFORÇO','DESTRUA TUDO, PROTEJA SUA ENERGIA E VENÇA!'];
    c.save();c.textAlign='center';c.font='bold 17px monospace';
    lines.forEach((line,i)=>{const y=this.creditsY+i*30;if(y>-30&&y<h+30){c.fillStyle=i===0?'#ffe43b':'rgba(255,255,255,.88)';c.shadowColor=i===0?'#ffe43b':'transparent';c.shadowBlur=i===0?10:0;c.fillText(line,w/2,y);}});
    c.restore();
  }
  drawExplosion(c,e){const p=e.t/e.max,r=(e.big?15:7)+p*(e.big?80:36);c.save();c.translate(e.x,e.y);for(let i=0;i<14;i++){const a=i*Math.PI*2/14,rr=r*(.45+(i%3)*.18);c.fillStyle=i%2?'#ffe43b':'#ff5a00';c.fillRect(Math.cos(a)*rr,Math.sin(a)*rr,4+(1-p)*7,4+(1-p)*7);}c.fillStyle='#fff';c.fillRect(-5,-5,10,10);c.restore();}
  draw(){
    const c=this.ctx,w=this.c.width,h=this.c.height,t=performance.now();this.drawStars(c,w,h,t);
    c.fillStyle='#fff';c.font='bold 14px monospace';c.fillText(`PONTOS ${String(this.score).padStart(5,'0')}`,12,22);c.fillText(`VIDAS ${this.lives}`,170,22);c.fillText(`NÍVEL ${this.level}/4`,250,22);c.fillText('ENERGIA',350,22);c.strokeStyle='#fff';c.strokeRect(425,12,120,12);c.fillStyle='#18a957';c.fillRect(427,14,116*this.energy/100,8);c.fillStyle='#18a957';c.font='10px monospace';if(this.shield>0)c.fillText(`ESCUDO ${this.shield.toFixed(1)}s`,570,22);c.fillStyle='#ffe43b';c.font='bold 11px monospace';c.fillText(`BOMBAS [ESPAÇO]: ${this.bombs}`,570,40);
    this.ghosts.forEach(g=>this.drawGhost(c,g));this.drawBoss(c);this.drawPacman(c);if(!this.running&&this.intro&&this.introStarted){c.fillStyle='rgba(0,0,0,.92)';c.fillRect(0,42,w,h-42);this.drawCredits(c,w,h);c.fillStyle='#18a957';c.font='bold 12px monospace';c.textAlign='center';c.fillText('PREPARE-SE...',w/2,h-20);c.textAlign='left';return;}
    this.bullets.forEach(b=>{c.fillStyle='#ffe43b';c.shadowColor='#ffe43b';c.shadowBlur=10;c.fillRect(b.x-2,b.y-10,4,13);c.shadowBlur=0});
    this.enemyBullets.forEach(b=>{c.save();c.translate(b.x,b.y);c.rotate(b.rot);c.fillStyle='#ff3b30';c.shadowColor='#ff3b30';c.shadowBlur=10;c.fillRect(-4,-8,8,16);c.fillRect(-8,-4,16,8);c.restore()});
    this.explosions.forEach(e=>this.drawExplosion(c,e));if(this.bombExplosions.length){const p=this.bombExplosions[0].t/this.bombExplosions[0].max;c.save();c.globalAlpha=.8*(1-p);c.strokeStyle='#ffe43b';c.shadowColor='#ffe43b';c.shadowBlur=30;c.lineWidth=8;c.beginPath();c.arc(this.player.x,this.player.y,40+p*500,0,Math.PI*2);c.stroke();c.restore();}
    if(this.boss){c.fillStyle='#fff';c.font='bold 12px monospace';c.textAlign='center';c.fillText('CHEFÃO',this.boss.x,this.boss.y-70);c.strokeStyle='#fff';c.strokeRect(this.boss.x-100,this.boss.y-62,200,10);c.fillStyle='#e60012';c.fillRect(this.boss.x-98,this.boss.y-60,196*(this.boss.hp/this.boss.maxHp),6);c.textAlign='left';}
    if(this.victory){c.fillStyle='rgba(0,0,0,.84)';c.fillRect(0,0,w,h);c.textAlign='center';c.shadowColor='#ffe43b';c.shadowBlur=22;c.fillStyle='#ffe43b';c.font="30px 'Press Start 2P'";c.fillText('PARABÉNS!',w/2,h/2-24);c.fillStyle='#fff';c.shadowBlur=0;c.font="13px 'Press Start 2P'";c.fillText('VOCÊ VENCEU!',w/2,h/2+18);c.fillStyle='#18a957';c.font='12px monospace';c.fillText(`PONTUAÇÃO FINAL ${this.score}`,w/2,h/2+52);c.fillStyle='#fff';c.font='10px monospace';c.fillText('ESPAÇO OU CLIQUE PARA JOGAR NOVAMENTE',w/2,h/2+84);c.textAlign='left';return;}
    if(!this.running){c.fillStyle='rgba(0,0,0,.74)';c.fillRect(0,0,w,h);c.textAlign='center';c.shadowColor='#e60012';c.shadowBlur=20;c.fillStyle='#e60012';c.font="30px 'Press Start 2P'";c.fillText(this.lives<=0?'GAME OVER':'PAC BANG',w/2,h/2-15);c.shadowBlur=0;c.fillStyle='#fff';c.font='11px monospace';c.fillText(this.lives<=0?'ESPAÇO OU CLIQUE PARA JOGAR NOVAMENTE':'ESPAÇO OU CLIQUE PARA START',w/2,h/2+25);c.textAlign='left';}
  }
  loop(t){this.raf=0;if(this.active===false)return;const dt=Math.min(.04,(t-(this.last||t))/1000);this.last=t;this.update(dt,t);this.draw();this.raf=requestAnimationFrame(e=>this.loop(e));}
}


/* DANGER RIVER — Atari 2600 tribute, vertical river shooter. */
class DangerRiver{
  constructor(c){
    this.c=c;this.ctx=c.getContext('2d');this.ctx.imageSmoothingEnabled=false;
    this.W=c.width;this.H=c.height;this.high=Number(localStorage.getItem('dangerRiverHigh')||0);
    this.keys={};this.running=false;this.intro=false;this.gameOver=false;this.last=performance.now();this.reset();this.bind();this.loop(0);
  }
  reset(){
    this.score=0;this.lives=3;this.fuel=100;this.distance=0;this.scroll=0;this.speed=72;this.spawn=0;this.fuelSpawn=1.5;this.bridgeSpawn=3.8;this.obstacleSpawn=2.6;this.planeSpawn=2.2;this.shotCd=0;
    this.shots=[];this.enemies=[];this.planes=[];this.bridges=[];this.fuels=[];this.obstacles=[];this.explosions=[];this.shake=0;this.lowFuelWarn=0;this.extraLives=0;
    this.player={x:this.W/2,y:this.H-68,w:30,h:42,inv:0};this.intro=true;this.introT=0;this.running=false;this.gameOver=false;this.high=Math.max(this.high,this.score);
  }
  bind(){
    const start=()=>{switchGame('dangerRiver');this.c.focus();music.start();if(!this.running){if(this.gameOver)this.reset();this.intro=true;this.introT=0;this.running=false;this.gameOver=false;}};
    this.c.addEventListener('pointerdown',e=>{start();if(e.pointerType==='touch'){this.touching=true;this.moveTouch(e);}});
    this.c.addEventListener('pointermove',e=>{if(e.pointerType==='touch'&&this.touching)this.moveTouch(e);});
    this.c.addEventListener('pointerup',e=>{if(e.pointerType==='touch'){this.touching=false;this.fire();}});
    this.c.addEventListener('pointercancel',()=>this.touching=false);
    window.addEventListener('keydown',e=>{if(window.tomActiveGame!=='dangerRiver')return;const k=e.key.toLowerCase();if(['arrowleft','arrowright',' '].includes(k))e.preventDefault();this.keys[k]=true;if(k===' '){start();this.fire();}});
    window.addEventListener('keyup',e=>{if(window.tomActiveGame==='dangerRiver')delete this.keys[e.key.toLowerCase()];});
  }
  moveTouch(e){const r=this.c.getBoundingClientRect();this.player.x=clamp((e.clientX-r.left)/r.width*this.W,24,this.W-24);}
  activateRun(){this.intro=false;this.running=true;this.last=performance.now();}
  riverCenter(y=this.H/2){return this.W/2+Math.sin((this.scroll+y)*.0022)*Math.min(95,this.W*.12)+Math.sin((this.scroll+y)*.00073)*Math.min(38,this.W*.05);}
  riverWidth(y=this.H/2){return Math.min(570,this.W*.78)+Math.sin((this.scroll+y)*.0011)*18;}
  riverBounds(y){const w=this.riverWidth(y);const x=this.riverCenter(y);return [x-w/2,x+w/2];}
  fire(){if(!this.running||this.shotCd>0)return;this.shots.push({x:this.player.x,y:this.player.y-24,v:430});this.shotCd=.17;music.shoot();}
  hitPlayer(){if(this.player.inv>0)return;this.lives--;this.player.inv=1.5;this.shake=.32;this.explode(this.player.x,this.player.y,true);this.fuel=Math.max(30,this.fuel-20);if(this.lives<=0){this.running=false;this.gameOver=true;this.saveHigh();music.stop();}}
  explode(x,y,big=false){this.explosions.push({x,y,t:0,max:big?.72:.38,big,frame:0});music.explode();}
  saveHigh(){if(this.score>this.high){this.high=this.score;localStorage.setItem('dangerRiverHigh',String(this.high));}}
  spawnEnemy(){const type=['heli','ship','jet'][Math.floor(Math.random()*3)],y=-35,x=this.riverCenter(y)+(Math.random()-.5)*Math.max(30,this.riverWidth(y)-80);this.enemies.push({type,x,y,v:this.speed*(.65+Math.random()*.65),w:type==='ship'?48:type==='jet'?36:40,h:type==='ship'?20:24,phase:Math.random()*6.28,age:0,blade:0});}
  spawnCrossPlane(){const fromLeft=Math.random()<.5;this.planes.push({x:fromLeft?-70:this.W+70,y:50+Math.random()*(this.H*.58),v:(fromLeft?1:-1)*(150+Math.random()*100+this.speed*.5),dir:fromLeft?1:-1,phase:Math.random()*6.28,w:48,h:18});}
  spawnBridge(){const y=-35,c=this.riverCenter(y),w=this.riverWidth(y);this.bridges.push({y,center:c,w,h:30,hp:3,phase:Math.random()*6.28});}
  spawnObstacle(){const y=-30,c=this.riverCenter(y),w=this.riverWidth(y);const side=Math.random()<.5?-1:1;const x=c+side*(w/2-35-Math.random()*Math.min(70,w*.16));this.obstacles.push({x,y,r:15+Math.random()*14,kind:Math.random()<.38?'island':'rock',rot:Math.random()*6.28,spin:(Math.random()-.5)*1.5});}
  spawnFuel(){const y=-25,c=this.riverCenter(y),w=this.riverWidth(y);this.fuels.push({x:c+(Math.random()-.5)*(w-70),y,w:28,h:20,pulse:0});}
  collide(a,b,pad=0){return Math.abs(a.x-b.x)<(a.w||12)/2+(b.w||12)/2-pad&&Math.abs(a.y-b.y)<(a.h||12)/2+(b.h||12)/2-pad;}
  update(dt){
    if(!this.running){if(this.intro&&!this.gameOver){this.introT+=dt;if(this.introT>5.2)this.activateRun();}return;}
    const k=this.keys,s=185;if(k.arrowleft)this.player.x-=s*dt;if(k.arrowright)this.player.x+=s*dt;const [L,R]=this.riverBounds(this.player.y);if(this.player.x-this.player.w/2<L+2||this.player.x+this.player.w/2>R-2){this.hitPlayer();this.player.x=this.W/2;}this.player.x=clamp(this.player.x,Math.max(18,L+16),Math.min(this.W-18,R-16));this.player.inv=Math.max(0,(this.player.inv||0)-dt);
    this.shotCd=Math.max(0,this.shotCd-dt);if(k[' '])this.fire();
    const speedBonus=Math.floor(this.score/5000)*28;this.speed=72+Math.min(190,speedBonus);this.scroll+=this.speed*dt;this.distance+=this.speed*dt;this.fuel-=dt*(2.0+this.speed*.0055);if(this.fuel<20)this.lowFuelWarn+=dt;else this.lowFuelWarn=0;
    if(this.fuel<=0){this.fuel=0;this.hitPlayer();this.fuel=70;}
    this.spawn-=dt;if(this.spawn<=0){this.spawnEnemy();if(this.score>=5000&&Math.random()<.3)this.spawnEnemy();this.spawn=Math.max(.32,1.05-this.speed/520);}
    this.fuelSpawn-=dt;if(this.fuelSpawn<=0){if(Math.random()<.78)this.spawnFuel();this.fuelSpawn=4.0+Math.random()*2.5;}
    this.bridgeSpawn-=dt;if(this.bridgeSpawn<=0){this.spawnBridge();this.bridgeSpawn=4.4+Math.random()*2.4;}
    this.obstacleSpawn-=dt;if(this.obstacleSpawn<=0){this.spawnObstacle();if(this.score>=5000&&Math.random()<.25)this.spawnObstacle();this.obstacleSpawn=Math.max(1.1,2.5-this.speed*.004);}
    this.planeSpawn-=dt;if(this.planeSpawn<=0){this.spawnCrossPlane();this.planeSpawn=1.8+Math.random()*3.8;}
    for(const sh of this.shots)sh.y-=sh.v*dt;this.shots=this.shots.filter(s=>s.y>-30);
    for(const e of this.enemies){e.y+=e.v*dt;e.age+=dt;e.x+=Math.sin(e.age*2+e.phase)*18*dt;e.blade+=dt*18;}
    for(const p of this.planes){p.x+=p.v*dt;p.y+=Math.sin((this.scroll+p.phase*100)*.012)*10*dt;}
    for(const b of this.bridges)b.y+=this.speed*dt;
    for(const o of this.obstacles){o.y+=this.speed*dt;o.rot+=o.spin*dt;}
    for(const f of this.fuels){f.y+=this.speed*dt;f.pulse+=dt*8;}
    for(const e of this.enemies){if(this.collide(this.player,e,5)){this.hitPlayer();e.y=this.H+100;}}
    for(const p of this.planes){if(this.collide(this.player,p,5)){this.hitPlayer();p.x=p.dir>0?this.W+200:-200;}}
    for(const o of this.obstacles){if(Math.hypot(this.player.x-o.x,this.player.y-o.y)<o.r+15){this.hitPlayer();o.y=this.H+100;}}
    for(const f of this.fuels){if(this.collide(this.player,f,2)){this.fuel=Math.min(100,this.fuel+38);this.score+=5;this.explode(f.x,f.y);f.y=this.H+100;music.collect();}}
    for(let i=this.bridges.length-1;i>=0;i--){const b=this.bridges[i];if(b.y>this.H+50){this.bridges.splice(i,1);continue;}const [L,R]=this.riverBounds(b.y);if(Math.abs(this.player.y-b.y)<26&&this.player.x<L+6||Math.abs(this.player.y-b.y)<26&&this.player.x>R-6)this.hitPlayer();}
    for(let i=this.shots.length-1;i>=0;i--){const s=this.shots[i];let used=false;
      for(let j=this.enemies.length-1;j>=0;j--){const e=this.enemies[j];if(this.collide({x:s.x,y:s.y,w:7,h:14},e,0)){this.shots.splice(i,1);this.explode(e.x,e.y);this.score+=15;this.enemies.splice(j,1);used=true;break;}}
      if(used)continue;
      for(let j=this.planes.length-1;j>=0;j--){const q=this.planes[j];if(this.collide({x:s.x,y:s.y,w:7,h:14},q,0)){this.shots.splice(i,1);this.explode(q.x,q.y);this.score+=15;this.planes.splice(j,1);used=true;break;}}
      if(used)continue;
      for(let j=this.bridges.length-1;j>=0;j--){const b=this.bridges[j];const [L,R]=this.riverBounds(b.y);if(Math.abs(s.y-b.y)<17&&s.x>L&&s.x<R){const hole=38;if(Math.abs(s.x-(L+R)/2)<hole)continue;this.shots.splice(i,1);b.hp--;this.explode(s.x,s.y);if(b.hp<=0){this.score+=30;this.bridges.splice(j,1);this.shake=.2;}used=true;break;}}
    }
    this.enemies=this.enemies.filter(e=>e.y<this.H+60);this.planes=this.planes.filter(p=>p.x>-120&&p.x<this.W+120);this.fuels=this.fuels.filter(f=>f.y<this.H+50);this.obstacles=this.obstacles.filter(o=>o.y<this.H+50);
    for(const x of this.explosions){x.t+=dt;x.frame=Math.min(7,Math.floor(x.t/x.max*8));}this.explosions=this.explosions.filter(x=>x.t<x.max);this.shake=Math.max(0,this.shake-dt);
    const earned=Math.floor(this.score/10000);if(earned>this.extraLives){this.lives+=earned-this.extraLives;this.extraLives=earned;music.collect();}
    this.saveHigh();
  }
  drawRiver(c){
    c.fillStyle='#8bd65a';c.fillRect(0,0,this.W,this.H);
    for(let y=-50-(this.scroll%72);y<this.H+80;y+=72){const [L,R]=this.riverBounds(y);c.fillStyle='#6fbd48';for(let side=0;side<2;side++){const x=side?R+18:L-18;if(x>8&&x<this.W-8){c.fillRect(x,y+18,4,4);c.fillRect(x+(side?-8:8),y+35,3,3);}}}
    const top=this.riverBounds(0);c.fillStyle='#168fd1';c.beginPath();c.moveTo(top[0],0);c.lineTo(top[1],0);for(let y=0;y<=this.H;y+=12){const [L,R]=this.riverBounds(y);c.lineTo(R,y);}for(let y=this.H;y>=0;y-=12){const [L,R]=this.riverBounds(y);c.lineTo(L,y);}c.closePath();c.fill();
    for(let y=-20;y<this.H+50;y+=28){const [L,R]=this.riverBounds(y);const span=Math.max(20,R-L-50);const x=L+25+((Math.sin(y*.07+this.scroll*.02)+1)*.5)*span;c.fillStyle='rgba(190,240,255,.55)';c.fillRect(x,(y+this.scroll)%this.H,18,2);c.fillStyle='rgba(0,80,150,.28)';c.fillRect(x+28,(y+this.scroll+9)%this.H,12,2);}
    for(let y=0;y<=this.H;y+=8){const [L,R]=this.riverBounds(y);c.fillStyle='#e5e0a4';c.fillRect(L-2,y,3,7);c.fillRect(R-1,y,3,7);}
    for(let i=0;i<18;i++){const y=((i*91-this.scroll*.72)%(this.H+130)+(this.H+130))%(this.H+130)-60;const [L,R]=this.riverBounds(y);const left=i%2===0;const x=left?Math.max(28,L-48-(i%3)*10):Math.min(this.W-28,R+48+(i%3)*10);this.drawTree(c,x,y,1+(i%3)*.08);if(i%4===1)this.drawHouse(c,left?x+24:x-24,y+24,.82+(i%2)*.1);}
  }
  drawTree(c,x,y,scale=1){c.save();c.translate(x,y);c.scale(scale,scale);c.fillStyle='#70452a';c.fillRect(-4,5,8,22);c.fillStyle='#2d8b3c';c.beginPath();c.arc(0,-5,19,0,Math.PI*2);c.fill();c.fillStyle='#49ae45';c.beginPath();c.arc(-10,-12,12,0,Math.PI*2);c.fill();c.fillStyle='#78c950';c.beginPath();c.arc(8,-13,10,0,Math.PI*2);c.fill();c.restore();}
  drawHouse(c,x,y,scale=1){c.save();c.translate(x,y);c.scale(scale,scale);c.fillStyle='#f3d79b';c.fillRect(-17,-8,34,25);c.fillStyle='#c74736';c.beginPath();c.moveTo(-21,-8);c.lineTo(0,-25);c.lineTo(21,-8);c.closePath();c.fill();c.fillStyle='#6c4a33';c.fillRect(-4,7,8,10);c.fillStyle='#76b6d2';c.fillRect(-13,-2,7,7);c.fillRect(6,-2,7,7);c.restore();}

  drawPlane(c){const p=this.player;c.save();c.translate(p.x,p.y);if(p.inv>0&&Math.floor(p.inv*12)%2===0)c.globalAlpha=.35;
    c.fillStyle='#cfd9d0';c.beginPath();c.moveTo(0,-29);c.lineTo(6,-8);c.lineTo(23,5);c.lineTo(8,7);c.lineTo(5,22);c.lineTo(0,27);c.lineTo(-5,22);c.lineTo(-8,7);c.lineTo(-23,5);c.lineTo(-6,-8);c.closePath();c.fill();
    c.fillStyle='#536d62';c.fillRect(-4,-13,8,25);c.fillRect(-21,2,42,7);c.fillRect(-12,13,24,6);c.fillStyle='#2d78a8';c.fillRect(-3,-18,6,10);c.fillStyle='#e7c943';c.fillRect(-2,-29,4,5);c.fillStyle='#d53d32';c.fillRect(-3,22,6,5);c.restore();}
  drawEnemy(c,e){c.save();c.translate(e.x,e.y);
    if(e.type==='ship'){c.fillStyle='#68766e';c.beginPath();c.moveTo(-25,-5);c.lineTo(-18,10);c.lineTo(18,10);c.lineTo(25,-5);c.closePath();c.fill();c.fillStyle='#aeb7ac';c.fillRect(-19,-9,38,8);c.fillStyle='#38453f';c.fillRect(-9,-15,18,7);c.fillRect(-3,-22,6,7);c.fillStyle='#d34b35';c.fillRect(-15,-2,30,4);c.fillStyle='#e6d45b';c.fillRect(-6,-13,12,3);
    }else if(e.type==='jet'){c.fillStyle='#bfc8bf';c.beginPath();c.moveTo(0,-21);c.lineTo(6,-7);c.lineTo(18,0);c.lineTo(6,5);c.lineTo(3,17);c.lineTo(0,21);c.lineTo(-3,17);c.lineTo(-6,5);c.lineTo(-18,0);c.lineTo(-6,-7);c.closePath();c.fill();c.fillStyle='#55716b';c.fillRect(-4,-12,8,21);c.fillStyle='#e25b3a';c.fillRect(-3,13,6,7);
    }else{c.fillStyle='#65756d';c.fillRect(-18,-6,36,12);c.fillStyle='#809087';c.fillRect(-6,-12,12,24);c.fillStyle='#d7c64f';c.fillRect(-20,-3,6,6);c.fillRect(14,-3,6,6);c.strokeStyle='#d5d9c9';c.lineWidth=2;c.beginPath();const a=e.blade;c.moveTo(Math.cos(a)*20,Math.sin(a)*20);c.lineTo(-Math.cos(a)*20,-Math.sin(a)*20);c.moveTo(Math.cos(a+Math.PI/2)*14,Math.sin(a+Math.PI/2)*14);c.lineTo(-Math.cos(a+Math.PI/2)*14,-Math.sin(a+Math.PI/2)*14);c.stroke();c.fillStyle='#e2e7df';c.fillRect(-5,-3,10,6);}
    c.restore();}
  drawCrossPlane(c,p){c.save();c.translate(p.x,p.y);c.scale(p.dir,1);c.fillStyle='#c9d2ca';c.beginPath();c.moveTo(0,-12);c.lineTo(9,-2);c.lineTo(25,0);c.lineTo(9,4);c.lineTo(4,12);c.lineTo(0,8);c.lineTo(-4,12);c.lineTo(-9,4);c.lineTo(-25,0);c.lineTo(-9,-2);c.closePath();c.fill();c.fillStyle='#d94a36';c.fillRect(-3,-8,6,16);c.fillStyle='#527b9d';c.fillRect(2,-5,7,5);c.restore();}
  drawObstacle(c,o){c.save();c.translate(o.x,o.y);if(o.kind==='island'){c.fillStyle='#5c4934';c.beginPath();for(let i=0;i<10;i++){const a=i*Math.PI*2/10,r=o.r*(.82+(i%3)*.1),x=Math.cos(a)*r,y=Math.sin(a)*r;i?c.lineTo(x,y):c.moveTo(x,y);}c.closePath();c.fill();c.fillStyle='#5ba548';c.beginPath();c.arc(-2,-4,o.r*.68,0,Math.PI*2);c.fill();c.fillStyle='#79c957';c.fillRect(-8,-12,14,7);}else{c.rotate(o.rot);c.fillStyle='#6d685b';c.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4,r=o.r*(.72+(i%2)*.28),x=Math.cos(a)*r,y=Math.sin(a)*r;i?c.lineTo(x,y):c.moveTo(x,y);}c.closePath();c.fill();c.fillStyle='#aaa17e';c.fillRect(-5,-7,10,6);c.fillStyle='#4c514a';c.fillRect(-9,5,17,4);}c.restore();}

  drawBridge(c,b){const [L,R]=this.riverBounds(b.y),x=(L+R)/2,w=R-L;c.fillStyle='#604a34';c.fillRect(L,b.y-15,w,30);c.fillStyle='#b49761';for(let i=L+8;i<R-5;i+=22)c.fillRect(i,b.y-12,12,24);c.fillStyle='#173d4b';c.fillRect(x-38,b.y-17,76,34);c.strokeStyle='#d8c18b';c.strokeRect(x-38,b.y-17,76,34);c.fillStyle='#d84a36';c.fillRect(L+5,b.y-4,14,7);c.fillRect(R-19,b.y-4,14,7);}
  drawFuel(c,f){const x=f.x,y=f.y,pulse=1+Math.sin(f.pulse)*.06;c.save();c.translate(x,y);c.scale(pulse,pulse);c.shadowColor='#8cff42';c.shadowBlur=14;c.fillStyle='#f4e34d';c.fillRect(-25,-19,50,38);c.shadowBlur=0;c.fillStyle='#17451f';c.fillRect(-18,-13,36,26);c.fillStyle='#62e57b';c.fillRect(-11,-10,22,8);c.fillStyle='#dff7d5';c.fillRect(-7,2,14,7);c.fillStyle='#173515';c.font='bold 13px monospace';c.textAlign='center';c.fillText('FUEL',0,6);c.restore();}

  drawExplosion(c,e){const p=e.t/e.max,r=4+p*(e.big?36:22);c.save();c.translate(e.x,e.y);for(let i=0;i<12;i++){const a=i*Math.PI*2/12,rr=r*(.5+(i%3)*.18);c.fillStyle=i%2?'#f2d34b':'#ef6a2f';c.fillRect(Math.cos(a)*rr,Math.sin(a)*rr,4+(1-p)*5,4+(1-p)*5);}c.fillStyle='#fff';c.fillRect(-3,-3,6,6);c.restore();}
  draw(){const c=this.ctx;c.save();if(this.shake>0)c.translate((Math.random()-.5)*10,(Math.random()-.5)*10);this.drawRiver(c);this.bridges.forEach(b=>this.drawBridge(c,b));this.obstacles.forEach(o=>this.drawObstacle(c,o));this.fuels.forEach(f=>this.drawFuel(c,f));this.enemies.forEach(e=>this.drawEnemy(c,e));this.planes.forEach(p=>this.drawCrossPlane(c,p));this.shots.forEach(s=>{c.fillStyle='#ffe45b';c.fillRect(s.x-2,s.y-8,4,14);});this.explosions.forEach(e=>this.drawExplosion(c,e));if(this.running)this.drawPlane(c);c.restore();
    c.fillStyle='rgba(0,0,0,.76)';c.fillRect(0,0,this.W,38);c.fillStyle='#fff';c.font='bold 11px monospace';c.fillText(`SCORE ${String(this.score).padStart(5,'0')}`,8,14);c.fillText(`HI ${String(this.high).padStart(5,'0')}`,8,29);c.fillText(`VIDAS ${this.lives}`,150,14);c.fillText(`FUEL`,225,14);c.strokeStyle='#fff';c.strokeRect(265,6,110,10);c.fillStyle=this.fuel<20?'#e60012':'#35c76f';c.fillRect(267,8,106*this.fuel/100,6);c.fillStyle='#ffe45b';c.font='bold 9px monospace';c.fillText(`VEL ${Math.floor(this.speed)}`,390,14);
    c.fillStyle='#ffe45b';c.font='bold 10px monospace';c.fillText('ATARI 2600 TRIBUTE – V2 MELHORADO',8,this.H-10);
    if(this.intro&&!this.gameOver){c.fillStyle='rgba(0,0,0,.93)';c.fillRect(0,38,this.W,this.H-38);c.textAlign='center';c.fillStyle='#ffe45b';c.font="bold 22px 'Press Start 2P'";c.fillText('DANGER RIVER',this.W/2,130);c.fillStyle='#fff';c.font='bold 14px monospace';const lines=['SOBREVOE O RIO RIVER E DESTRUA','OS NAVIOS, HELICÓPTEROS E AVIÕES','INIMIGOS, MAS NÃO ESQUEÇA DE','REABASTECER SEU CAÇA. BOA SORTE!'];lines.forEach((t,i)=>c.fillText(t,this.W/2,190+i*27));c.fillStyle='#35c76f';c.font='bold 12px monospace';c.fillText('← → MOVER   ESPAÇO ATIRAR',this.W/2,325);c.fillText('INICIANDO...',this.W/2,355);c.textAlign='left';}
    if(this.fuel<20&&this.running){c.fillStyle='#e60012';c.font='bold 18px monospace';c.textAlign='center';c.fillText('⚠ LOW FUEL ⚠',this.W/2,62);c.textAlign='left';}
    if(this.gameOver){c.fillStyle='rgba(0,0,0,.88)';c.fillRect(0,38,this.W,this.H-38);c.textAlign='center';c.fillStyle='#e60012';c.font="bold 28px 'Press Start 2P'";c.fillText('GAME OVER',this.W/2,205);c.fillStyle='#ffe45b';c.font='bold 16px monospace';c.fillText(`SCORE ${this.score} • HI ${this.high}`,this.W/2,240);c.fillStyle='#fff';c.font='bold 13px monospace';c.fillText('ESPAÇO OU CLIQUE PARA RECOMEÇAR',this.W/2,275);c.textAlign='left';}
  }
  loop(t){this.raf=0;if(this.active===false)return;const dt=Math.min(.035,(t-this.last)/1000||0);this.last=t;this.update(dt);this.draw();this.raf=requestAnimationFrame(e=>this.loop(e));}
}

// Inicialização: todas as classes já foram declaradas antes de serem instanciadas.
window.tomActiveGame="invaders";
if($("#invaders")) window.invadersGame=new Invaders($("#invaders"));
if($("#snake")) window.snakeGame=new Snake($("#snake"));
if($("#joaoMaria")) window.joaoMariaGame=new JoaoMaria($("#joaoMaria"));
if($("#racha")) window.rachaGame=new Racha($("#racha"));
if($("#pacbang")) window.pacBangGame=new PacBang($("#pacbang"));
if($("#alienFort")) window.alienFortGame=new AlienFort($("#alienFort"));
if($("#dangerRiver")) window.dangerRiverGame=new DangerRiver($("#dangerRiver"));
// Somente o jogo ativo recebe atualização/renderização contínua.
[window.snakeGame,window.joaoMariaGame,window.rachaGame,window.pacBangGame,window.alienFortGame,window.dangerRiverGame].forEach(g=>{if(g)g.active=false;});
setupMusicButton();
