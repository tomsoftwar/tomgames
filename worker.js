export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      try { return await api(request, env, url); }
      catch (e) { return json({error:'Erro interno do servidor.'},500); }
    }
    return env.ASSETS.fetch(request);
  }
};

const cors = {'content-type':'application/json; charset=UTF-8','cache-control':'no-store'};
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:cors});}
function cookie(name,value,maxAge){return `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;}
function getCookie(req,name){const s=req.headers.get('Cookie')||''; const m=s.match(new RegExp('(?:^|;\\s*)'+name.replace(/[.*+?^${}()|[\\]\\]/g,'\\$&')+'=([^;]+)')); return m?m[1]:null;}
function hex(buf){return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('');}
async function hashPassword(password,salt){const enc=new TextEncoder(); const key=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveBits']); const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt:enc.encode(salt),iterations:120000,hash:'SHA-256'},key,256); return hex(bits);}
async function verifyPassword(password,record){return (await hashPassword(password,record.salt))===record.password_hash;}
async function requireSession(req,env){const token=getCookie(req,'tg_session'); if(!token) return null; const row=await env.DB.prepare('SELECT s.token,s.expires_at,a.id,a.username FROM sessions s JOIN admins a ON a.id=s.admin_id WHERE s.token=? AND s.expires_at>?').bind(token,Math.floor(Date.now()/1000)).first(); return row||null;}
async function api(req,env,url){
  if(req.method==='GET' && url.pathname==='/api/posts'){const rows=await env.DB.prepare('SELECT id,title,category,excerpt,content,created_at FROM posts ORDER BY created_at DESC').all(); return json({posts:rows.results||[]});}
  if(req.method==='POST' && url.pathname==='/api/login'){const b=await req.json(); const u=String(b.username||'').trim(); const p=String(b.password||''); const admin=await env.DB.prepare('SELECT id,username,password_hash,salt FROM admins WHERE username=?').bind(u).first(); if(!admin || !(await verifyPassword(p,admin))) return json({error:'Usuário ou senha inválidos.'},401); const token=crypto.randomUUID()+crypto.randomUUID(); const exp=Math.floor(Date.now()/1000)+60*60*24*7; await env.DB.prepare('INSERT INTO sessions(token,admin_id,expires_at) VALUES(?,?,?)').bind(token,admin.id,exp).run(); return new Response(JSON.stringify({ok:true}),{headers:{...cors,'Set-Cookie':cookie('tg_session',token,60*60*24*7)}});}
  if(req.method==='POST' && url.pathname==='/api/logout'){const t=getCookie(req,'tg_session'); if(t) await env.DB.prepare('DELETE FROM sessions WHERE token=?').bind(t).run(); return new Response(JSON.stringify({ok:true}),{headers:{...cors,'Set-Cookie':cookie('tg_session','',0)}});}
  const session=await requireSession(req,env); if(!session) return json({error:'Não autorizado.'},401);
  if(req.method==='GET' && url.pathname==='/api/me') return json({authenticated:true,username:session.username});
  if(req.method==='POST' && url.pathname==='/api/posts'){const b=await req.json(); const title=String(b.title||'').trim(),category=String(b.category||'').trim(),excerpt=String(b.excerpt||'').trim(),content=String(b.content||'').trim(); if(!title||!category||!excerpt||!content)return json({error:'Preencha todos os campos.'},400); const id=crypto.randomUUID(); await env.DB.prepare('INSERT INTO posts(id,title,category,excerpt,content,created_at) VALUES(?,?,?,?,?,?)').bind(id,title,category,excerpt,content,Math.floor(Date.now()/1000)).run(); return json({ok:true,id});}
  if(req.method==='DELETE' && url.pathname.startsWith('/api/posts/')){const id=url.pathname.split('/').pop(); await env.DB.prepare('DELETE FROM posts WHERE id=?').bind(id).run(); return json({ok:true});}
  if(req.method==='POST' && url.pathname==='/api/setup'){const key=req.headers.get('X-Setup-Key')||''; if(!env.SETUP_KEY || key!==env.SETUP_KEY)return json({error:'Chave de configuração inválida.'},403); const b=await req.json(); const username=String(b.username||'').trim(); const password=String(b.password||''); if(!username||password.length<8)return json({error:'Usuário obrigatório e senha com pelo menos 8 caracteres.'},400); const exists=await env.DB.prepare('SELECT id FROM admins WHERE username=?').bind(username).first(); if(exists)return json({error:'Usuário já existe.'},409); const salt=crypto.randomUUID(); const ph=await hashPassword(password,salt); await env.DB.prepare('INSERT INTO admins(username,password_hash,salt) VALUES(?,?,?)').bind(username,ph,salt).run(); return json({ok:true,message:'Administrador criado.'});}
  return json({error:'Rota não encontrada.'},404);
}
