import { useState, useEffect, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────
//  COUCHE API  (inline — pas d'import externe)
// ─────────────────────────────────────────────────────────────────
const BASE = "https://fixily-backend.onrender.com"; // ← remplacer par l'URL Render en prod

function getToken() { return localStorage.getItem("fixily_token"); }

async function request(method, path, body) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method, headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Erreur serveur.");
  return data;
}

const api = {
  register:       (d)   => request("POST", "/api/auth/register", d),
  login:          (d)   => request("POST", "/api/auth/login", d),
  me:             ()    => request("GET",  "/api/auth/me"),
  updateProfile:  (d)   => request("PUT",  "/api/auth/me", d),
  updatePassword: (d)   => request("PUT",  "/api/auth/password", d),
  getArtisans:    (q)   => request("GET",  `/api/artisans?${new URLSearchParams(q)}`),
  getArtisan:     (id)  => request("GET",  `/api/artisans/${id}`),
  createRequest:  (d)   => request("POST", "/api/requests", d),
  myRequests:     ()    => request("GET",  "/api/requests/my"),
  getRequest:     (id)  => request("GET",  `/api/requests/${id}`),
  validatePhotos: (id,d)=> request("PUT",  `/api/requests/${id}/validate`, d),
  leaveReview:    (id,d)=> request("POST", `/api/requests/${id}/review`, d),
  receivedRequests:()   => request("GET",  "/api/requests/artisan/received"),
  respondRequest: (id,d)=> request("PUT",  `/api/requests/${id}/respond`, d),
  startRequest:   (id)  => request("PUT",  `/api/requests/${id}/start`, {}),
  submitPhotos:   (id,d)=> request("POST", `/api/requests/${id}/photos`, d),
  getConfig:      ()    => request("GET",  "/api/config"),
  sendContact:    (d)   => request("POST", "/api/contact", d),
  getActiveAd:    (pos) => request("GET",  `/api/ads/active${pos ? `?position=${pos}` : ""}`),
  trackAdClick:   (id)  => request("POST", `/api/ads/${id}/click`),
  getStats:       ()    => request("GET",  "/api/stats"),
  notifyPremium:  (d)   => request("POST", "/api/notify-premium", d),
  adminCreateArtisan:(d)=> request("POST", "/api/admin/artisans/create", d),
  adminUpdateLogo:(d)   => request("PUT",  "/api/admin/logo", d),
  adminSeedData:  ()    => request("POST", "/api/admin/seed-test-data"),
  adminAds:       ()    => request("GET",    "/api/ads/admin"),
  adminAdStats:   ()    => request("GET",    "/api/ads/admin/stats"),
  adminCreateAd:  (d)   => request("POST",   "/api/ads/admin", d),
  adminUpdateAd:  (id,d)=> request("PUT",    `/api/ads/admin/${id}`, d),
  adminAdStatus:  (id,s)=> request("PUT",    `/api/ads/admin/${id}/status`, { status: s }),
  adminAdReset:   (id)  => request("PUT",    `/api/ads/admin/${id}/reset`),
  adminDeleteAd:  (id)  => request("DELETE", `/api/ads/admin/${id}`),
  adminDashboard: ()    => request("GET",  "/api/admin/dashboard"),
  adminArtisans:  ()    => request("GET",  "/api/admin/artisans"),
  adminClients:   ()    => request("GET",  "/api/admin/clients"),
  adminRequests:  (s)   => request("GET",  `/api/admin/requests${s ? `?status=${s}` : ""}`),
  adminWorks:     ()    => request("GET",  "/api/admin/works/pending"),
  adminReports:   ()    => request("GET",  "/api/admin/reports"),
  adminSubs:      ()    => request("GET",  "/api/admin/subscriptions"),
  adminMessages:  ()    => request("GET",  "/api/admin/messages"),
  adminConfig:    ()    => request("GET",  "/api/admin/config"),
  adminSaveConfig:(d)   => request("PUT",  "/api/admin/config", d),
  adminValidateArtisan:(id)   => request("PUT", `/api/admin/artisans/${id}/validate`),
  adminSuspend:   (id)  => request("PUT",  `/api/admin/artisans/${id}/suspend`),
  adminSetPlan:   (id,d)      => request("PUT", `/api/admin/artisans/${id}/plan`, d),
  adminValidateWork:(id,s)    => request("PUT", `/api/admin/works/${id}`, { status: s }),
  adminResolveReport:(id,d)   => request("PUT", `/api/admin/reports/${id}`, d),
  adminRecalcBadges:()  => request("POST", "/api/admin/recalc-badges"),
  adminMarkRead:  (id)  => request("PUT",  `/api/admin/messages/${id}/read`),
  adminDeleteUser:(id)  => request("DELETE", `/api/admin/users/${id}`),
  adminViewStats: ()    => request("GET",    "/api/admin/stats/views"),
};

// ─────────────────────────────────────────────────────────────────
//  DESIGN TOKENS
// ─────────────────────────────────────────────────────────────────
const C = {
  orange:"#E8470A", og:"rgba(232,71,10,0.09)",
  bg:"#F0EDE8", card:"#FFFFFF", cardAlt:"#FAF8F5",
  border:"#E2DDD7", text:"#1A1714", textSub:"#5C574F",
  muted:"#8A8479", green:"#16A34A", gbg:"rgba(22,163,74,0.09)",
  yellow:"#D97706", red:"#DC2626", rbg:"rgba(220,38,38,0.08)",
  blue:"#2563EB", purple:"#7C3AED", pbg:"rgba(124,58,237,0.08)",
};

const TN_CITIES = [
  "Tunis","Ariana","Ben Arous","Manouba","Nabeul","Hammamet","Zaghouan",
  "Bizerte","Béja","Jendouba","Kef","Siliana","Sousse","Monastir","Mahdia",
  "Sfax","Kairouan","Kasserine","Sidi Bouzid","Gabès","Medenine","Tataouine",
  "Gafsa","Tozeur","Kébili","La Marsa","La Goulette","Carthage","Hammam-Lif",
  "Radès","Grombalia","Menzel Bourguiba","Tabarka","Ain Draham","Djerba",
  "Zarzis","Ben Gardane","Matmata","Douz","Nefta","El Fahs","Bou Salem",
];

const CATEGORIES = [
  {id:"plomberie",label:"Plomberie",icon:"🔧"},{id:"electricite",label:"Électricité",icon:"⚡"},
  {id:"climatisation",label:"Climatisation",icon:"❄️"},{id:"menage",label:"Ménage",icon:"🧹"},
  {id:"peinture",label:"Peinture",icon:"🎨"},{id:"jardinage",label:"Jardinage",icon:"🌿"},
  {id:"serrurerie",label:"Serrurerie",icon:"🔑"},{id:"informatique",label:"Informatique",icon:"💻"},
  {id:"maconnerie",label:"Maçonnerie",icon:"🧱"},{id:"menuiserie",label:"Menuiserie",icon:"🪵"},
];

const GS = `
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  html{-webkit-text-size-adjust:100%;scroll-behavior:smooth}
  body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;
    background:#F0EDE8;color:#1A1714;min-height:100vh;-webkit-font-smoothing:antialiased}
  input,select,textarea,button{font-family:inherit}
  ::placeholder{color:#A09890}
  ::-webkit-scrollbar{width:5px;height:5px}
  ::-webkit-scrollbar-track{background:#EAE5DE}
  ::-webkit-scrollbar-thumb{background:#C4BDB4;border-radius:4px}
  .hcard{transition:transform .22s,box-shadow .22s,border-color .22s}
  .hcard:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(232,71,10,.1)!important;border-color:rgba(232,71,10,.35)!important}
  @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes adSkeleton{0%{background-position:200% 0}100%{background-position:-200% 0}}
  .fu{animation:fadeUp .38s ease both}
  .fi{animation:fadeIn .2s ease both}
  .spin{animation:spin 1s linear infinite}
  .desk{display:flex!important}.mob{display:none!important}
  @media(max-width:680px){.desk{display:none!important}.mob{display:flex!important}}
`;

// ─────────────────────────────────────────────────────────────────
//  AD BANNER — Régie pub responsive
//  → pub active depuis l'API, "Votre pub ici" si vide
// ─────────────────────────────────────────────────────────────────
const AD_HEIGHTS = { banner:"80px", wide:"120px", square:"250px" };

function AdBanner({ position = "both", style: s = {} }) {
  const [adData, setAdData] = useState(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // Vérifier si cet emplacement a déjà été vu aujourd'hui (localStorage)
    const today = new Date().toISOString().slice(0,10);
    const seenKey = `fixily_ad_seen_${position}_${today}`;
    const alreadySeen = localStorage.getItem(seenKey) === '1';

    fetch(`${BASE}/api/ads/active${position ? `?position=${position}` : ''}`, {
      headers: { 'x-count-impression': alreadySeen ? 'false' : 'true' }
    })
      .then(r=>r.json())
      .then(res => {
        if(!cancelled){
          setAdData(res);
          // Marquer comme vu aujourd'hui si une pub a été affichée
          if(res && !res.empty && !alreadySeen){
            localStorage.setItem(seenKey, '1');
          }
        }
      })
      .catch(() => { if (!cancelled) setAdData({ empty: true }); });
    return () => { cancelled = true; };
  }, [position]);

  // Skeleton
  if (adData === null) {
    return (
      <div style={{
        height:80, borderRadius:10, margin:"14px 0",
        background:`linear-gradient(90deg,${C.border} 25%,${C.cardAlt} 50%,${C.border} 75%)`,
        backgroundSize:"200% 100%", animation:"adSkeleton 1.4s ease infinite", ...s,
      }}/>
    );
  }

  // Vide → "Votre pub ici"
  if (adData.empty) {
    return (
      <a href="mailto:contact@fixily.tn?subject=Publicité sur Fixily.tn"
        style={{ textDecoration:"none", display:"block", margin:"14px 0", ...s }}>
        <div
          onMouseEnter={e=>{e.currentTarget.style.borderColor=C.orange;e.currentTarget.style.background=`${C.orange}06`;}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.background=C.cardAlt;}}
          style={{ border:`2px dashed ${C.border}`, borderRadius:10, padding:"16px 20px",
            display:"flex", alignItems:"center", justifyContent:"space-between",
            gap:16, background:C.cardAlt, flexWrap:"wrap", transition:"border-color .2s,background .2s" }}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{ width:42,height:42,borderRadius:9,background:`${C.orange}12`,
              border:`1.5px solid ${C.orange}25`,display:"flex",alignItems:"center",
              justifyContent:"center",fontSize:20,flexShrink:0 }}>📢</div>
            <div>
              <div style={{fontWeight:700,fontSize:14,color:C.text}}>Votre pub ici</div>
              <div style={{fontSize:12,color:C.muted,marginTop:2}}>
                Atteignez des milliers de clients en Tunisie — Contactez-nous
              </div>
            </div>
          </div>
          <div style={{ background:C.orange,color:"#fff",borderRadius:7,
            padding:"7px 14px",fontSize:12,fontWeight:700,whiteSpace:"nowrap",flexShrink:0 }}>
            Réserver →
          </div>
        </div>
      </a>
    );
  }

  const ad = adData.ad;
  const h = AD_HEIGHTS[ad.size] || "80px";

  const handleClick = () => {
    api.trackAdClick(ad.id).catch(()=>{});
    window.open(ad.target_url, "_blank", "noopener,noreferrer");
  };

  // Avec image
  if (ad.image_url) {
    return (
      <div onClick={handleClick} onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)}
        style={{ margin:"14px 0", cursor:"pointer", borderRadius:10, overflow:"hidden",
          position:"relative", height:h, border:`1px solid ${C.border}`,
          boxShadow:hovered?"0 4px 20px rgba(0,0,0,.12)":"0 1px 6px rgba(0,0,0,.05)",
          transition:"box-shadow .2s,transform .2s", transform:hovered?"translateY(-1px)":"none", ...s }}
        title={ad.alt_text||ad.advertiser}>
        <img src={ad.image_url} alt={ad.alt_text||"Publicité"}
          style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}
          onError={e=>e.target.style.display="none"}/>
        <div style={{ position:"absolute",bottom:4,right:6,background:"rgba(0,0,0,.45)",color:"#fff",
          fontSize:9,fontWeight:600,padding:"2px 6px",borderRadius:4,letterSpacing:.5,textTransform:"uppercase" }}>
          Publicité
        </div>
      </div>
    );
  }

  // Texte seul
  return (
    <div onClick={handleClick} onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)}
      style={{ margin:"14px 0", cursor:"pointer", borderRadius:10,
        background:`linear-gradient(135deg,${C.og},${C.cardAlt})`,
        border:`1.5px solid ${C.orange}22`, padding:"14px 20px",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        gap:14, flexWrap:"wrap", position:"relative",
        boxShadow:hovered?"0 4px 20px rgba(232,71,10,.12)":"none", transition:"all .2s", ...s }}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:38,height:38,borderRadius:8,background:`${C.orange}16`,
          border:`1.5px solid ${C.orange}28`,display:"flex",alignItems:"center",
          justifyContent:"center",fontSize:18}}>📢</div>
        <div>
          <div style={{fontWeight:700,fontSize:14,color:C.text}}>{ad.advertiser}</div>
          <div style={{fontSize:12,color:C.muted}}>{ad.alt_text||"Cliquez pour en savoir plus"}</div>
        </div>
      </div>
      <div style={{background:C.orange,color:"#fff",borderRadius:7,padding:"7px 14px",fontSize:12,fontWeight:700,whiteSpace:"nowrap"}}>
        Découvrir →
      </div>
      <div style={{position:"absolute",top:4,right:8,fontSize:9,color:C.muted,fontWeight:600,letterSpacing:.4,textTransform:"uppercase"}}>
        Publicité
      </div>
    </div>
  );
}

// ── Atoms ─────────────────────────────────────────────────────────
const Av = ({name,size=42}) => {
  const ini=name?.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()||"?";
  const pal=["#E8470A","#2563EB","#16A34A","#7C3AED","#D97706","#0891B2"];
  const col=pal[(name?.charCodeAt(0)||0)%pal.length];
  return <div style={{width:size,height:size,borderRadius:"50%",background:`${col}18`,
    display:"flex",alignItems:"center",justifyContent:"center",color:col,
    fontWeight:700,fontSize:size*.36,flexShrink:0,border:`1.5px solid ${col}28`}}>{ini}</div>;
};
const Stars=({rating,interactive,onRate})=>(
  <span>{[...Array(5)].map((_,i)=>(
    <span key={i} onClick={interactive?()=>onRate(i+1):undefined}
      style={{color:i<Math.round(rating)?C.yellow:C.border,fontSize:13,cursor:interactive?"pointer":"default"}}>★</span>
  ))}</span>
);
const Chip=({children,color=C.orange})=>(
  <span style={{background:`${color}14`,color,border:`1px solid ${color}22`,
    borderRadius:4,padding:"2px 8px",fontSize:11,fontWeight:700,letterSpacing:.3}}>{children}</span>
);
const Btn=({children,onClick,variant="primary",size="md",style:s={},disabled,loading})=>{
  const sz={sm:"6px 13px",md:"10px 20px",lg:"12px 28px"};
  const fsz={sm:12,md:14,lg:15};
  const v={
    primary:{background:C.orange,color:"#fff",boxShadow:"0 2px 10px rgba(232,71,10,.22)"},
    secondary:{background:C.card,color:C.textSub,border:`1.5px solid ${C.border}`},
    danger:{background:C.rbg,color:C.red,border:`1px solid ${C.red}28`},
    green:{background:C.gbg,color:C.green,border:`1px solid ${C.green}28`},
    purple:{background:C.pbg,color:C.purple,border:`1px solid ${C.purple}28`},
    ghost:{background:"transparent",color:C.textSub},
  };
  return <button disabled={disabled||loading} onClick={onClick} style={{
    ...v[variant],padding:sz[size],fontSize:fsz[size],border:"none",outline:"none",
    cursor:(disabled||loading)?"not-allowed":"pointer",borderRadius:9,fontWeight:600,
    transition:"all .18s",display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6,
    opacity:(disabled||loading)?.55:1,...s,
  }}>{loading?<span className="spin" style={{display:"inline-block",width:14,height:14,border:"2px solid currentColor",borderTopColor:"transparent",borderRadius:"50%"}}/>:children}</button>;
};
const Card=({children,style:s={}})=>(
  <div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:16,padding:22,boxShadow:"0 1px 6px rgba(0,0,0,.05)",...s}}>{children}</div>
);
const Fld=({label,error,...p})=>(
  <div style={{display:"flex",flexDirection:"column",gap:5}}>
    {label&&<label style={{fontSize:12,color:C.muted,fontWeight:600,letterSpacing:.3}}>{label}</label>}
    <input {...p} style={{background:C.cardAlt,border:`1.5px solid ${error?C.red:C.border}`,
      borderRadius:9,padding:"10px 13px",fontSize:14,color:C.text,outline:"none",width:"100%",...(p.style||{})}}/>
    {error&&<span style={{fontSize:11,color:C.red}}>{error}</span>}
  </div>
);
const Sel=({label,children,...p})=>(
  <div style={{display:"flex",flexDirection:"column",gap:5}}>
    {label&&<label style={{fontSize:12,color:C.muted,fontWeight:600,letterSpacing:.3}}>{label}</label>}
    <select {...p} style={{background:C.cardAlt,border:`1.5px solid ${C.border}`,borderRadius:9,
      padding:"10px 13px",fontSize:14,color:C.text,outline:"none",...(p.style||{})}}>{children}</select>
  </div>
);
const Pill=({active,onClick,children})=>(
  <button onClick={onClick} style={{background:active?C.orange:C.card,color:active?"#fff":C.textSub,
    border:`1.5px solid ${active?C.orange:C.border}`,borderRadius:100,padding:"6px 16px",fontSize:13,
    cursor:"pointer",whiteSpace:"nowrap",fontWeight:active?700:400,transition:"all .18s"}}>{children}</button>
);
const Modal=({open,onClose,title,children,wide})=>{
  if(!open) return null;
  return <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.38)",
    zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:16,backdropFilter:"blur(4px)"}}>
    <div onClick={e=>e.stopPropagation()} style={{background:C.card,borderRadius:20,padding:26,
      width:"100%",maxWidth:wide?680:460,maxHeight:"90vh",overflowY:"auto",
      boxShadow:"0 20px 60px rgba(0,0,0,.18)",animation:"fadeUp .22s ease"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <h3 style={{fontWeight:700,fontSize:17}}>{title}</h3>
        <button onClick={onClose} style={{background:C.cardAlt,border:`1px solid ${C.border}`,
          borderRadius:"50%",width:28,height:28,cursor:"pointer",fontSize:13,
          display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
      </div>
      {children}
    </div>
  </div>;
};
const Toast=({msg,type="success"})=>(
  msg?<div className="fi" style={{position:"fixed",bottom:20,right:20,zIndex:400,
    background:type==="error"?C.red:C.green,color:"#fff",borderRadius:10,
    padding:"12px 20px",fontSize:14,fontWeight:600,boxShadow:"0 4px 20px rgba(0,0,0,.2)",maxWidth:320}}>{msg}</div>:null
);
const Spinner=()=>(
  <div style={{display:"flex",justifyContent:"center",padding:60}}>
    <div className="spin" style={{width:36,height:36,border:`3px solid ${C.border}`,borderTopColor:C.orange,borderRadius:"50%"}}/>
  </div>
);
const STATUS_MAP={
  pending:{label:"En attente",color:C.yellow},accepted:{label:"Acceptée",color:C.green},
  in_progress:{label:"En cours",color:C.blue},awaiting_validation:{label:"À valider",color:C.orange},
  completed:{label:"Terminée",color:C.green},rejected:{label:"Photos rejetées",color:C.red},
  cancelled:{label:"Annulée",color:C.muted},
};
const StatusChip=({status})=>{const s=STATUS_MAP[status]||{label:status,color:C.muted};return <Chip color={s.color}>{s.label}</Chip>;};

// ─────────────────────────────────────────────────────────────────
//  AUTH MODAL
// ─────────────────────────────────────────────────────────────────
function AuthModal({mode:initMode,onClose,onAuth}){
  const [mode,setMode]=useState(initMode);
  const [type,setType]=useState("client");
  const [form,setForm]=useState({name:"",email:"",phone:"",city:"",region:"",address:"",password:"",confirm_password:"",category:"plomberie",whatsapp:"",bio:""});
  const [err,setErr]=useState({});
  const [loading,setLoading]=useState(false);
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const submit=async()=>{
    const e={};
    if(mode==="register"){
      if(!form.name.trim())e.name="Nom requis";
      if(!form.email.trim())e.email="Email requis";
      if(!form.phone.trim())e.phone="Téléphone requis";
      if(!form.city.trim())e.city="Ville requise";
      if(form.password.length<6)e.password="Minimum 6 caractères";
      if(form.password!==form.confirm_password)e.confirm_password="Mots de passe différents";
    }else{
      if(!form.email.trim())e.email="Email requis";
      if(!form.password)e.password="Requis";
    }
    if(Object.keys(e).length){setErr(e);return;}
    setLoading(true);
    try{
      const res=mode==="login"?await api.login({email:form.email,password:form.password}):await api.register({...form,type});
      localStorage.setItem("fixily_token",res.token);
      onAuth(res.user);
    }catch(ex){setErr({global:ex.message});}
    finally{setLoading(false);}
  };
  return(
    <Modal open onClose={onClose} title={mode==="login"?"Connexion":"Créer un compte"}>
      {mode==="register"&&(
        <div style={{marginBottom:18}}>
          <p style={{fontSize:13,color:C.muted,marginBottom:10}}>Je suis un(e) :</p>
          <div style={{display:"flex",gap:9}}>
            {[["client","👤 Client"],["artisan","🔧 Artisan"]].map(([v,l])=>(
              <button key={v} onClick={()=>setType(v)} style={{flex:1,padding:"11px 0",borderRadius:10,cursor:"pointer",
                background:type===v?`${C.orange}12`:C.cardAlt,border:`2px solid ${type===v?C.orange:C.border}`,
                color:type===v?C.orange:C.textSub,fontWeight:type===v?700:500,fontSize:14}}>{l}</button>
            ))}
          </div>
        </div>
      )}
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {mode==="register"&&<>
          <Fld label="Nom complet *" value={form.name} onChange={e=>set("name",e.target.value)} error={err.name}/>
          <Fld label="Téléphone *" type="tel" value={form.phone} onChange={e=>set("phone",e.target.value)} placeholder="+216 XX XXX XXX" error={err.phone}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <Sel label="Ville *" value={form.city} onChange={e=>set("city",e.target.value)}>
              <option value="">Choisir…</option>{TN_CITIES.map(c=><option key={c} value={c}>{c}</option>)}
            </Sel>
            <Fld label="Région" value={form.region} onChange={e=>set("region",e.target.value)}/>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:5}}>
            <label style={{fontSize:12,color:C.muted,fontWeight:600}}>Adresse complète</label>
            <textarea value={form.address} onChange={e=>set("address",e.target.value)} placeholder="Rue, bâtiment…"
              style={{background:C.cardAlt,border:`1.5px solid ${C.border}`,borderRadius:9,color:C.text,padding:"9px 13px",fontSize:14,outline:"none",resize:"vertical",minHeight:60,fontFamily:"inherit"}}/>
          </div>
          {type==="artisan"&&<>
            <Sel label="Catégorie *" value={form.category} onChange={e=>set("category",e.target.value)}>
              {CATEGORIES.map(c=><option key={c.id} value={c.label}>{c.icon} {c.label}</option>)}
            </Sel>
            <Fld label="WhatsApp pro" value={form.whatsapp} onChange={e=>set("whatsapp",e.target.value)} placeholder="+216 XX XXX XXX"/>
          </>}
        </>}
        <Fld label="Email *" type="email" value={form.email} onChange={e=>set("email",e.target.value)} error={err.email}/>
        <Fld label="Mot de passe *" type="password" value={form.password} onChange={e=>set("password",e.target.value)} error={err.password}/>
        {mode==="register"&&<Fld label="Confirmer *" type="password" value={form.confirm_password} onChange={e=>set("confirm_password",e.target.value)} error={err.confirm_password}/>}
        {err.global&&<p style={{fontSize:12,color:C.red,background:C.rbg,padding:"8px 12px",borderRadius:8}}>{err.global}</p>}
        {mode==="login"&&<div style={{fontSize:12,color:C.muted,background:C.cardAlt,padding:"10px 13px",borderRadius:9}}><strong style={{color:C.text}}>Démo :</strong> admin@fixily.tn / admin123</div>}
        <Btn variant="primary" size="lg" onClick={submit} loading={loading} style={{width:"100%",marginTop:4}}>
          {mode==="login"?"Se connecter":"Créer mon compte"}
        </Btn>
        <p style={{fontSize:13,color:C.muted,textAlign:"center"}}>
          {mode==="login"?"Pas encore de compte ?":"Déjà inscrit ?"}{" "}
          <button onClick={()=>{setMode(mode==="login"?"register":"login");setErr({});}}
            style={{background:"none",border:"none",color:C.orange,fontWeight:700,cursor:"pointer",fontSize:13}}>
            {mode==="login"?"S'inscrire":"Se connecter"}
          </button>
        </p>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────
//  NAVBAR
// ─────────────────────────────────────────────────────────────────
function Navbar({view,setView,user,onLogout,setAuthModal,siteConfig}){
  const [sc,setSc]=useState(false);
  const [open,setOpen]=useState(false);
  useEffect(()=>{const fn=()=>setSc(window.scrollY>8);window.addEventListener("scroll",fn);return()=>window.removeEventListener("scroll",fn);},[]);
  const links=[["home","Accueil"],["artisans","Artisans"],["pricing","Tarifs"],["contact","Contact"],
    ...(user?.type==="artisan"?[["dashboard","Mon espace"]]:user?.type==="client"?[["client-dash","Mon espace"]]:[]) ];
  // Admin accessible via URL secrète /fixily-admin-2025
  return(
    <nav style={{position:"sticky",top:0,zIndex:100,background:sc?"rgba(240,237,232,.97)":"rgba(240,237,232,.88)",
      backdropFilter:"blur(16px)",borderBottom:`1px solid ${sc?C.border:"transparent"}`,
      boxShadow:sc?"0 1px 12px rgba(0,0,0,.07)":"none",transition:"all .3s",padding:"0 20px"}}>
      <div style={{maxWidth:1140,margin:"0 auto",display:"flex",alignItems:"center",height:60,gap:8}}>
        <button onClick={()=>setView("home")} style={{background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:8}}>
          {siteConfig?.logo_url
            ? <img src={siteConfig.logo_url} alt="Logo" style={{height:36,maxWidth:140,objectFit:"contain"}}/>
            : <span style={{fontWeight:800,fontSize:20,color:C.text}}>Fixily<span style={{color:C.orange}}>.tn</span></span>
          }
        </button>
        <div style={{display:"flex",gap:2,marginLeft:20,flex:1}} className="desk">
          {links.map(([v,l])=>(
            <button key={v} onClick={()=>setView(v)} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,
              color:view===v?C.orange:C.muted,fontWeight:view===v?700:500,padding:"6px 13px",
              borderBottom:view===v?`2px solid ${C.orange}`:"2px solid transparent",transition:"all .15s"}}>{l}</button>
          ))}
        </div>
        <div style={{flex:1}} className="desk"/>
        <div style={{display:"flex",gap:9,alignItems:"center"}} className="desk">
          {user?(<><Av name={user.name} size={30}/>
            <div style={{lineHeight:1.2}}>
              <div style={{fontSize:13,fontWeight:600,color:C.text}}>{user.name.split(" ")[0]}</div>
              <div style={{fontSize:11,color:C.muted,textTransform:"capitalize"}}>{user.type}</div>
            </div>
            <Btn variant="secondary" size="sm" onClick={onLogout}>Déconnexion</Btn>
          </>):(<>
            <Btn variant="secondary" size="sm" onClick={()=>setAuthModal("login")}>Connexion</Btn>
            <Btn variant="primary" size="sm" onClick={()=>setAuthModal("register")}>S'inscrire</Btn>
          </>)}
        </div>
        <button onClick={()=>setOpen(!open)} className="mob" style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:C.text,marginLeft:"auto"}}>{open?"✕":"☰"}</button>
      </div>
      {open&&(
        <div style={{background:C.card,borderTop:`1px solid ${C.border}`,padding:"10px 20px 18px"}}>
          {links.map(([v,l])=>(
            <button key={v} onClick={()=>{setView(v);setOpen(false);}} style={{display:"block",width:"100%",textAlign:"left",background:"none",border:"none",borderBottom:`1px solid ${C.border}`,color:view===v?C.orange:C.textSub,padding:"12px 0",fontSize:15,cursor:"pointer",fontWeight:view===v?700:400}}>{l}</button>
          ))}
          <div style={{display:"flex",gap:9,marginTop:14}}>
            {user?<Btn variant="danger" size="sm" onClick={()=>{onLogout();setOpen(false);}} style={{flex:1}}>Déconnexion</Btn>
              :<><Btn variant="secondary" size="sm" onClick={()=>{setAuthModal("login");setOpen(false);}} style={{flex:1}}>Connexion</Btn>
                <Btn variant="primary" size="sm" onClick={()=>{setAuthModal("register");setOpen(false);}} style={{flex:1}}>S'inscrire</Btn></>}
          </div>
        </div>
      )}
    </nav>
  );
}

// ─────────────────────────────────────────────────────────────────
//  HOME PAGE
// ─────────────────────────────────────────────────────────────────
function HomePage({setView,setFilterCat,setAuthModal}){
  const [city,setCity]=useState("");
  const [search,setSearch]=useState("");
  const [stats,setStats]=useState({artisans:"...",clients:"...",rating:"..."});
  useEffect(()=>{
    api.getStats().then(s=>setStats({
      artisans: s.artisans>0?`${s.artisans}+`:"0",
      clients:  s.clients>0?`${s.clients}+`:"0",
      rating:   s.rating>0?`${s.rating}★`:"—",
    })).catch(()=>{});
  },[]);
  return(
    <div>
      <div style={{minHeight:"88vh",display:"flex",flexDirection:"column",alignItems:"center",
        justifyContent:"center",padding:"60px 20px 40px",textAlign:"center",
        background:"radial-gradient(ellipse 100% 70% at 50% -5%,rgba(232,71,10,.13),transparent 65%)"}}>
        <div className="fu" style={{animationDelay:".05s"}}>
          <span style={{background:`${C.orange}14`,color:C.orange,border:`1px solid ${C.orange}25`,borderRadius:100,
            padding:"5px 18px",fontSize:12,fontWeight:700,letterSpacing:1,textTransform:"uppercase",display:"inline-block",marginBottom:22}}>
            🇹🇳 La plateforme N°1 en Tunisie
          </span>
        </div>
        <h1 className="fu" style={{fontSize:"clamp(32px,7vw,64px)",fontWeight:800,lineHeight:1.1,
          marginBottom:16,color:C.text,animationDelay:".1s",maxWidth:700,letterSpacing:"-.5px"}}>
          Trouvez l'artisan<br/><span style={{color:C.orange}}>qu'il vous faut</span>,<br/>près de chez vous.
        </h1>
        <p className="fu" style={{fontSize:17,color:C.muted,maxWidth:460,marginBottom:34,lineHeight:1.65,animationDelay:".15s"}}>
          Plombiers, électriciens, ménage… Contactez directement. Rapide, fiable, sans commission.
        </p>
        <div className="fu" style={{display:"flex",width:"100%",maxWidth:570,background:C.card,
          border:`1.5px solid ${C.border}`,borderRadius:13,overflow:"hidden",
          animationDelay:".2s",boxShadow:"0 4px 24px rgba(0,0,0,.09)",flexWrap:"wrap"}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Quel service ? (plomberie, ménage…)"
            style={{flex:1,minWidth:150,background:"none",border:"none",outline:"none",color:C.text,padding:"14px 16px",fontSize:14}}/>
          <div style={{width:1,background:C.border,alignSelf:"stretch"}}/>
          <select value={city} onChange={e=>setCity(e.target.value)}
            style={{background:"none",border:"none",outline:"none",padding:"14px 13px",fontSize:14,color:city?C.text:C.muted,minWidth:110,cursor:"pointer"}}>
            <option value="">📍 Ville</option>{TN_CITIES.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={()=>setView("artisans")} style={{background:C.orange,color:"#fff",border:"none",padding:"14px 22px",fontWeight:700,fontSize:14,cursor:"pointer"}}>Chercher</button>
        </div>
        <div className="fu" style={{display:"flex",gap:36,marginTop:42,flexWrap:"wrap",justifyContent:"center",animationDelay:".25s"}}>
          {[
            [stats.artisans,"Artisans vérifiés"],
            [stats.clients,"Clients satisfaits"],
            [stats.rating,"Note moyenne"]
          ].map(([v,l])=>(
            <div key={l} style={{textAlign:"center"}}>
              <div style={{fontWeight:800,fontSize:26,color:C.orange}}>{v}</div>
              <div style={{fontSize:12,color:C.muted}}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{padding:"50px 20px",maxWidth:1140,margin:"0 auto"}}>
        <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",marginBottom:26,flexWrap:"wrap",gap:10}}>
          <h2 style={{fontWeight:700,fontSize:22,letterSpacing:"-.3px"}}>Parcourir par catégorie</h2>
          <button onClick={()=>setView("artisans")} style={{background:"none",border:"none",color:C.orange,fontSize:14,fontWeight:600,cursor:"pointer"}}>Voir tous →</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(115px,1fr))",gap:10}}>
          {CATEGORIES.map(cat=>(
            <button key={cat.id} onClick={()=>{setFilterCat(cat.label);setView("artisans");}}
              className="hcard" style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:13,
                padding:"18px 10px",textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",gap:7,cursor:"pointer"}}>
              <span style={{fontSize:26}}>{cat.icon}</span>
              <span style={{fontSize:12,fontWeight:600,color:C.text}}>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── BANNIÈRE PUB ACCUEIL ── */}
      <div style={{maxWidth:1140,margin:"0 auto",padding:"0 20px"}}>
        <AdBanner position="home"/>
      </div>

      <div style={{background:"#E8E3DB",borderTop:`1px solid ${C.border}`,borderBottom:`1px solid ${C.border}`,padding:"50px 20px"}}>
        <div style={{maxWidth:840,margin:"0 auto",textAlign:"center"}}>
          <h2 style={{fontWeight:700,fontSize:22,marginBottom:8}}>Comment ça marche ?</h2>
          <p style={{color:C.muted,marginBottom:40,fontSize:14}}>Du premier contact à la validation de l'intervention</p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:22}}>
            {[["🔍","Recherchez","Trouvez l'artisan qui correspond à votre besoin"],
              ["📝","Demandez","Envoyez une demande directement à l'artisan"],
              ["🔧","Intervention","L'artisan réalise le travail et poste les photos"],
              ["✅","Validez","Vous validez les photos et laissez un avis"]
            ].map(([icon,title,desc])=>(
              <div key={title}>
                <div style={{width:52,height:52,borderRadius:"50%",background:`${C.orange}14`,border:`2px solid ${C.orange}28`,
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,margin:"0 auto 13px"}}>{icon}</div>
                <div style={{fontWeight:700,fontSize:15,marginBottom:6}}>{title}</div>
                <div style={{color:C.muted,fontSize:13,lineHeight:1.55}}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{padding:"50px 20px",maxWidth:660,margin:"0 auto",textAlign:"center"}}>
        <h2 style={{fontWeight:700,fontSize:"clamp(20px,4vw,32px)",marginBottom:13}}>
          Vous êtes artisan ?<br/><span style={{color:C.orange}}>Développez votre activité</span>
        </h2>
        <p style={{color:C.muted,fontSize:15,marginBottom:26,lineHeight:1.6}}>
          Créez votre profil, recevez des demandes clients, publiez vos réalisations. 100% gratuit au lancement.
        </p>
        <Btn variant="primary" size="lg" onClick={()=>setAuthModal("register")}>Créer mon profil artisan →</Btn>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  ARTISANS PAGE
// ─────────────────────────────────────────────────────────────────
function ArtisansPage({setView,setSelectedArtisan,filterCat,setFilterCat,user,setAuthModal}){
  const [artisans,setArtisans]=useState([]);
  const [loading,setLoading]=useState(true);
  const [search,setSearch]=useState("");
  const [city,setCity]=useState("");
  const [activeCat,setActiveCat]=useState(filterCat||"");
  const [sort,setSort]=useState("rating");

  useEffect(()=>{if(filterCat)setActiveCat(filterCat);},[filterCat]);
  useEffect(()=>{
    setLoading(true);
    const params={};
    if(activeCat)params.category=activeCat;
    if(city)params.city=city;
    if(sort)params.sort=sort;
    api.getArtisans(params).then(setArtisans).catch(()=>setArtisans([])).finally(()=>setLoading(false));
  },[activeCat,city,sort]);

  const filtered=artisans.filter(a=>!search||[a.name,a.city,a.category,...(a.services||[]),...(a.tags||[])].some(t=>t?.toLowerCase().includes(search.toLowerCase())));

  return(
    <div style={{padding:"26px 20px",maxWidth:1140,margin:"0 auto"}}>
      <h1 style={{fontWeight:700,fontSize:24,marginBottom:4}}>Tous les artisans</h1>
      <p style={{color:C.muted,marginBottom:20,fontSize:14}}>{filtered.length} artisan(s)</p>
      <div style={{display:"flex",gap:9,marginBottom:16,flexWrap:"wrap"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Nom, service…"
          style={{flex:1,minWidth:170,background:C.card,border:`1.5px solid ${C.border}`,borderRadius:9,color:C.text,padding:"9px 14px",fontSize:14,outline:"none"}}/>
        <select value={city} onChange={e=>setCity(e.target.value)} style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:9,color:city?C.text:C.muted,padding:"9px 14px",fontSize:14,outline:"none",minWidth:130}}>
          <option value="">📍 Toutes les villes</option>{TN_CITIES.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
        <select value={sort} onChange={e=>setSort(e.target.value)} style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:9,color:C.textSub,padding:"9px 14px",fontSize:14,outline:"none"}}>
          <option value="rating">⭐ Mieux notés</option>
          <option value="reviews">💬 Plus d'avis</option>
          <option value="newest">🆕 Plus récents</option>
        </select>
      </div>
      <div style={{display:"flex",gap:7,marginBottom:24,overflowX:"auto",paddingBottom:4}}>
        <Pill active={!activeCat} onClick={()=>{setActiveCat("");setFilterCat(null);}}>Tous</Pill>
        {CATEGORIES.map(c=>(
          <Pill key={c.id} active={activeCat===c.label} onClick={()=>{setActiveCat(c.label);setFilterCat(c.label);}}>
            {c.icon} {c.label}
          </Pill>
        ))}
      </div>
      {!user&&(
        <div style={{background:`${C.orange}10`,border:`1.5px solid ${C.orange}28`,borderRadius:11,
          padding:"11px 16px",marginBottom:20,display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
          <span>🔒</span>
          <span style={{fontSize:13,color:C.textSub,flex:1}}>Connectez-vous pour accéder aux coordonnées et faire une demande.</span>
          <Btn variant="primary" size="sm" onClick={()=>setAuthModal("login")}>Se connecter</Btn>
        </div>
      )}

      {/* ── BANNIÈRE PUB ARTISANS ── */}
      <AdBanner position="artisans"/>

      {loading?<Spinner/>:(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(265px,1fr))",gap:13}}>
          {filtered.map(a=>(
            <div key={a.id} onClick={()=>{setSelectedArtisan(a);setView("profile");}}
              className="hcard" style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:15,padding:18,cursor:"pointer"}}>
              <div style={{display:"flex",gap:12,alignItems:"flex-start",marginBottom:11}}>
                <Av name={a.name} size={44}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:5,flexWrap:"wrap"}}>
                    <span style={{fontWeight:700,fontSize:14}}>{a.name}</span>
                    {a.badge_recommended?<span>🏅</span>:null}
                    {a.plan==="premium"?<Chip color={C.purple}>Premium</Chip>:null}
                  </div>
                  <div style={{fontSize:12,color:C.muted,marginTop:2}}>{a.category} • {a.city}</div>
                  <div style={{display:"flex",alignItems:"center",gap:5,marginTop:3}}>
                    <Stars rating={a.rating||0}/>
                    <span style={{fontSize:12,color:C.textSub}}>{a.rating||"—"} ({a.reviews_count||0})</span>
                  </div>
                </div>
              </div>
              {!user?(
                <div style={{background:`${C.orange}08`,border:`1px dashed ${C.border}`,borderRadius:8,padding:"9px 12px",display:"flex",alignItems:"center",gap:7}}>
                  <span>🔒</span><span style={{fontSize:12,color:C.muted}}>Connectez-vous pour contacter</span>
                </div>
              ):<Btn variant="primary" size="sm" style={{width:"100%"}}>Voir le profil & Contacter</Btn>}
            </div>
          ))}
          {filtered.length===0&&<div style={{gridColumn:"1/-1",textAlign:"center",padding:60,color:C.muted}}><div style={{fontSize:40,marginBottom:14}}>🔍</div><p>Aucun artisan trouvé.</p></div>}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  PROFILE PAGE
// ─────────────────────────────────────────────────────────────────
function ProfilePage({artisan:aInit,setView,user,setAuthModal,setToast}){
  const [a,setA]=useState(aInit);
  const [reqModal,setReqModal]=useState(false);
  useEffect(()=>{if(!aInit?.id)return;api.getArtisan(aInit.id).then(setA).catch(()=>{});},[aInit?.id]);
  if(!a) return null;
  return(
    <div style={{padding:"28px 20px",maxWidth:820,margin:"0 auto"}}>
      <button onClick={()=>setView("artisans")} style={{background:"none",border:"none",color:C.muted,fontSize:14,marginBottom:18,cursor:"pointer"}}>← Retour</button>
      <Card style={{marginBottom:14}}>
        <div style={{display:"flex",gap:20,alignItems:"flex-start",flexWrap:"wrap"}}>
          <Av name={a.name} size={70}/>
          <div style={{flex:1}}>
            <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginBottom:4}}>
              <h1 style={{fontWeight:800,fontSize:22}}>{a.name}</h1>
              {a.badge_recommended?<span style={{fontSize:18}}>🏅</span>:null}
              {a.plan==="premium"?<Chip color={C.purple}>Premium</Chip>:null}
            </div>
            <div style={{fontSize:14,color:C.muted,marginBottom:8}}>{a.category} • 📍 {a.city}</div>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:14}}>
              <Stars rating={a.rating||0}/><span style={{fontWeight:700}}>{a.rating||"—"}</span>
              <span style={{color:C.muted,fontSize:13}}>({a.reviews_count||0} avis)</span>
            </div>
            {a.bio&&<p style={{color:C.textSub,lineHeight:1.65,marginBottom:16,fontSize:14}}>{a.bio}</p>}
          </div>
        </div>
        <div style={{borderTop:`1px solid ${C.border}`,marginTop:16,paddingTop:16}}>
          {user?.type==="client"?(
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              <Btn variant="primary" size="lg" onClick={()=>setReqModal(true)}>📝 Faire une demande</Btn>
              {a.whatsapp&&<a href={`https://wa.me/${a.whatsapp.replace(/\D/g,"")}`} target="_blank" rel="noreferrer" style={{textDecoration:"none"}}><Btn variant="primary" size="lg" style={{background:"#25D366",boxShadow:"none"}}>📲 WhatsApp</Btn></a>}
              {a.phone&&<a href={`tel:${a.phone}`} style={{textDecoration:"none"}}><Btn variant="secondary" size="lg">📞 {a.phone}</Btn></a>}
            </div>
          ):!user?(
            <div style={{background:`${C.orange}08`,border:`1px dashed ${C.border}`,borderRadius:10,padding:"18px 20px",textAlign:"center"}}>
              <p style={{color:C.muted,marginBottom:14,fontSize:14}}>🔒 Connectez-vous pour contacter cet artisan.</p>
              <div style={{display:"flex",gap:9,justifyContent:"center"}}>
                <Btn variant="primary" onClick={()=>setAuthModal("register")}>Créer un compte</Btn>
                <Btn variant="secondary" onClick={()=>setAuthModal("login")}>Se connecter</Btn>
              </div>
            </div>
          ):null}
        </div>
      </Card>
      {a.works?.length>0&&(
        <Card style={{marginBottom:14}}>
          <h3 style={{fontWeight:700,marginBottom:16}}>Réalisations</h3>
          {a.works.map(w=>(
            <div key={w.id} style={{marginBottom:20}}>
              <div style={{fontWeight:600,fontSize:15,marginBottom:4}}>{w.title}</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                {[["⚠️ Avant",w.before_url,"#FEF3C7","#92400E"],["✅ Après",w.after_url,"#D1FAE5","#065F46"]].map(([lbl,src,bg,col])=>(
                  <div key={lbl}>
                    <div style={{fontSize:11,fontWeight:700,color:col,background:bg,borderRadius:"6px 6px 0 0",padding:"4px 8px",textAlign:"center"}}>{lbl}</div>
                    <img src={src} alt={lbl} style={{width:"100%",display:"block",borderRadius:"0 0 8px 8px",border:`1px solid ${C.border}`,maxHeight:180,objectFit:"cover"}} onError={e=>e.target.style.display="none"}/>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </Card>
      )}
      {a.reviews?.length>0&&(
        <Card>
          <h3 style={{fontWeight:700,marginBottom:16}}>Avis clients</h3>
          {a.reviews.map((r,i)=>(
            <div key={i} style={{paddingBottom:14,marginBottom:14,borderBottom:i<a.reviews.length-1?`1px solid ${C.border}`:"none"}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <span style={{fontWeight:600,fontSize:14}}>{r.client_name}</span>
                  <Stars rating={r.rating}/>
                </div>
                <span style={{fontSize:12,color:C.muted}}>{new Date(r.created_at).toLocaleDateString("fr-TN")}</span>
              </div>
              {r.comment&&<p style={{fontSize:14,color:C.textSub,lineHeight:1.5}}>{r.comment}</p>}
            </div>
          ))}
        </Card>
      )}
      <RequestModal open={reqModal} artisan={a} user={user} onClose={()=>setReqModal(false)}
        onSuccess={()=>{setReqModal(false);setToast({msg:"Demande envoyée !",type:"success"});}}/>
    </div>
  );
}

function RequestModal({open,onClose,artisan,user,onSuccess}){
  const [form,setForm]=useState({service:"",description:"",address:"",preferred_date:"",contact_method:"whatsapp"});
  const [loading,setLoading]=useState(false);
  const [err,setErr]=useState("");
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const submit=async()=>{
    if(!form.service.trim()){setErr("Décrivez le service souhaité.");return;}
    setLoading(true);
    try{await api.createRequest({artisan_user_id:artisan.id,...form,city:user?.city});onSuccess();}
    catch(e){setErr(e.message);}
    finally{setLoading(false);}
  };
  return(
    <Modal open={open} onClose={onClose} title={`Demande à ${artisan?.name||""}`}>
      <div style={{display:"flex",flexDirection:"column",gap:13}}>
        <Fld label="Service souhaité *" placeholder="Ex: Réparation fuite d'eau…" value={form.service} onChange={e=>set("service",e.target.value)}/>
        <div style={{display:"flex",flexDirection:"column",gap:5}}>
          <label style={{fontSize:12,color:C.muted,fontWeight:600}}>Description</label>
          <textarea value={form.description} onChange={e=>set("description",e.target.value)} placeholder="Décrivez le problème…"
            style={{background:C.cardAlt,border:`1.5px solid ${C.border}`,borderRadius:9,color:C.text,padding:"9px 13px",fontSize:14,outline:"none",resize:"vertical",minHeight:70,fontFamily:"inherit"}}/>
        </div>
        <Fld label="Adresse d'intervention" value={form.address} onChange={e=>set("address",e.target.value)}/>
        <Fld label="Date souhaitée" type="date" value={form.preferred_date} onChange={e=>set("preferred_date",e.target.value)}/>
        {err&&<p style={{fontSize:12,color:C.red,background:C.rbg,padding:"8px 12px",borderRadius:8}}>{err}</p>}
        <div style={{display:"flex",gap:9}}>
          <Btn variant="primary" onClick={submit} loading={loading} style={{flex:1}}>Envoyer la demande</Btn>
          <Btn variant="secondary" onClick={onClose}>Annuler</Btn>
        </div>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────
//  CLIENT DASHBOARD
// ─────────────────────────────────────────────────────────────────
function ClientDash({user,setUser,setView,setToast}){
  const [tab,setTab]=useState("requests");
  const [requests,setRequests]=useState([]);
  const [loading,setLoading]=useState(true);
  const loadReqs=useCallback(()=>{setLoading(true);api.myRequests().then(setRequests).catch(()=>{}).finally(()=>setLoading(false));},[]);
  useEffect(()=>{loadReqs();},[loadReqs]);
  const pending=requests.filter(r=>r.status==="awaiting_validation");
  const tabs=[{id:"requests",l:"📋 Mes demandes"},{id:"validate",l:`✅ À valider (${pending.length})`},{id:"profile",l:"👤 Mon profil"}];
  return(
    <div style={{padding:"26px 20px",maxWidth:960,margin:"0 auto"}}>
      <Card style={{marginBottom:20,padding:"16px 20px"}}>
        <div style={{display:"flex",gap:12,alignItems:"center",flexWrap:"wrap"}}>
          <Av name={user.name} size={44}/>
          <div>
            <div style={{fontWeight:700,fontSize:16}}>Bonjour, {user.name.split(" ")[0]} 👋</div>
            <div style={{fontSize:13,color:C.muted}}>Client • {user.city||"Tunisie"}</div>
          </div>
          {pending.length>0&&<div style={{marginLeft:"auto",background:`${C.orange}14`,border:`1px solid ${C.orange}30`,borderRadius:9,padding:"8px 14px",textAlign:"center"}}>
            <div style={{fontWeight:700,fontSize:16,color:C.orange}}>{pending.length}</div>
            <div style={{fontSize:11,color:C.muted}}>à valider</div>
          </div>}
        </div>
      </Card>
      <div style={{display:"flex",gap:7,marginBottom:20,overflowX:"auto",paddingBottom:4}}>
        {tabs.map(t=><Pill key={t.id} active={tab===t.id} onClick={()=>setTab(t.id)}>{t.l}</Pill>)}
      </div>
      {tab==="requests"&&(loading?<Spinner/>:(
        requests.length===0?<Card style={{textAlign:"center",padding:48}}>
          <div style={{fontSize:40,marginBottom:14}}>📋</div>
          <h3 style={{fontWeight:700,marginBottom:8}}>Aucune demande</h3>
          <Btn variant="primary" onClick={()=>setView("artisans")}>Trouver un artisan</Btn>
        </Card>:requests.map(r=>(
          <Card key={r.id} style={{marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:8,marginBottom:10}}>
              <div>
                <div style={{fontWeight:700,fontSize:15,marginBottom:3}}>{r.service}</div>
                <div style={{fontSize:13,color:C.muted}}>🔧 {r.artisan_name} • {r.category}</div>
                <div style={{fontSize:12,color:C.muted,marginTop:2}}>📅 {new Date(r.created_at).toLocaleDateString("fr-TN")}</div>
              </div>
              <StatusChip status={r.status}/>
            </div>
            {r.status==="awaiting_validation"&&r.before_url&&(
              <div style={{background:`${C.orange}08`,border:`1px solid ${C.orange}30`,borderRadius:9,padding:"10px 14px"}}>
                <p style={{fontSize:13,color:C.orange,fontWeight:600,marginBottom:8}}>📷 Photos à valider.</p>
              </div>
            )}
          </Card>
        ))
      ))}
      {tab==="validate"&&(
        pending.length===0?<Card style={{textAlign:"center",padding:48}}><div style={{fontSize:36,marginBottom:12}}>✅</div><p style={{color:C.muted}}>Aucune validation en attente.</p></Card>
          :pending.map(r=><ValidationCard key={r.id} request={r} onDone={()=>{loadReqs();setToast({msg:"Validé !",type:"success"});}}/>)
      )}
      {tab==="profile"&&<ClientProfileEditor user={user} setUser={setUser} setToast={setToast}/>}
    </div>
  );
}

function ValidationCard({request:r,onDone}){
  const [loading,setLoading]=useState(false);
  const [rejReason,setRejReason]=useState("");
  const [showReject,setShowReject]=useState(false);
  const [rating,setRating]=useState(5);
  const [comment,setComment]=useState("");
  const [step,setStep]=useState("photos");
  const validate=async(decision)=>{
    if(decision==="reject"&&!rejReason.trim())return;
    setLoading(true);
    try{
      await api.validatePhotos(r.id,{decision,rejection_reason:decision==="reject"?rejReason:undefined});
      if(decision==="approve")setStep("review");else onDone();
    }catch(e){alert(e.message);}
    finally{setLoading(false);}
  };
  const submitReview=async()=>{
    setLoading(true);
    try{await api.leaveReview(r.id,{rating,comment});setStep("done");setTimeout(onDone,1500);}
    catch(e){alert(e.message);}
    finally{setLoading(false);}
  };
  return(
    <Card style={{marginBottom:14}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:8}}>
        <div><div style={{fontWeight:700,fontSize:15}}>{r.service}</div><div style={{fontSize:13,color:C.muted}}>Par {r.artisan_name}</div></div>
        <StatusChip status={r.status}/>
      </div>
      {step==="photos"&&<>
        {r.artisan_note&&<div style={{background:C.cardAlt,borderRadius:9,padding:"10px 14px",marginBottom:14,fontSize:13,color:C.textSub}}>💬 {r.artisan_note}</div>}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
          {[["⚠️ Avant",r.before_url,"#FEF3C7","#92400E"],["✅ Après",r.after_url,"#D1FAE5","#065F46"]].map(([lbl,src,bg,col])=>(
            <div key={lbl}>
              <div style={{fontSize:11,fontWeight:700,color:col,background:bg,borderRadius:"6px 6px 0 0",padding:"4px 8px",textAlign:"center"}}>{lbl}</div>
              <img src={src} alt={lbl} style={{width:"100%",display:"block",borderRadius:"0 0 8px 8px",border:`1px solid ${C.border}`,maxHeight:200,objectFit:"cover"}} onError={e=>e.target.style.display="none"}/>
            </div>
          ))}
        </div>
        {!showReject?(
          <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
            <Btn variant="green" loading={loading} onClick={()=>validate("approve")} style={{flex:1}}>✓ Approuver</Btn>
            <Btn variant="danger" onClick={()=>setShowReject(true)}>✕ Rejeter</Btn>
          </div>
        ):(
          <div style={{background:C.rbg,border:`1px solid ${C.red}30`,borderRadius:10,padding:14}}>
            <textarea value={rejReason} onChange={e=>setRejReason(e.target.value)} placeholder="Motif du rejet…"
              style={{width:"100%",background:C.card,border:`1.5px solid ${C.border}`,borderRadius:9,color:C.text,padding:"9px 13px",fontSize:14,outline:"none",resize:"vertical",minHeight:70,fontFamily:"inherit",marginBottom:10}}/>
            <div style={{display:"flex",gap:9}}>
              <Btn variant="danger" size="sm" loading={loading} onClick={()=>validate("reject")}>Confirmer</Btn>
              <Btn variant="secondary" size="sm" onClick={()=>setShowReject(false)}>Annuler</Btn>
            </div>
          </div>
        )}
      </>}
      {step==="review"&&(
        <div style={{background:C.gbg,border:`1px solid ${C.green}30`,borderRadius:10,padding:16}}>
          <p style={{fontWeight:700,color:C.green,marginBottom:14}}>✅ Approuvé ! Laissez un avis :</p>
          <div style={{display:"flex",gap:4,marginBottom:12}}>
            {[1,2,3,4,5].map(n=>(
              <button key={n} onClick={()=>setRating(n)} style={{background:"none",border:"none",fontSize:26,cursor:"pointer",color:n<=rating?C.yellow:C.border}}>{n<=rating?"★":"☆"}</button>
            ))}
          </div>
          <textarea value={comment} onChange={e=>setComment(e.target.value)} placeholder="Votre expérience…"
            style={{width:"100%",background:C.card,border:`1.5px solid ${C.border}`,borderRadius:9,color:C.text,padding:"9px 13px",fontSize:14,outline:"none",resize:"vertical",minHeight:70,fontFamily:"inherit",marginBottom:10}}/>
          <div style={{display:"flex",gap:9}}>
            <Btn variant="primary" size="sm" loading={loading} onClick={submitReview}>Publier</Btn>
            <Btn variant="ghost" size="sm" onClick={()=>{setStep("done");setTimeout(onDone,500);}}>Plus tard</Btn>
          </div>
        </div>
      )}
      {step==="done"&&<div style={{textAlign:"center",padding:"20px 0"}}><div style={{fontSize:40,marginBottom:10}}>🎉</div><p style={{fontWeight:700,color:C.green}}>Merci !</p></div>}
    </Card>
  );
}

function ClientProfileEditor({user,setUser,setToast}){
  const [form,setForm]=useState({name:user.name||"",phone:user.phone||"",city:user.city||"",region:user.region||"",address:user.address||"",bio:user.bio||""});
  const [loading,setLoading]=useState(false);
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const save=async()=>{
    setLoading(true);
    try{await api.updateProfile(form);setUser({...user,...form});setToast({msg:"Profil mis à jour !",type:"success"});}
    catch(e){setToast({msg:e.message,type:"error"});}
    finally{setLoading(false);}
  };
  return(
    <Card>
      <h3 style={{fontWeight:700,fontSize:15,marginBottom:18}}>Informations personnelles</h3>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:13}}>
        <Fld label="Nom complet" value={form.name} onChange={e=>set("name",e.target.value)}/>
        <Fld label="Téléphone" type="tel" value={form.phone} onChange={e=>set("phone",e.target.value)}/>
        <Sel label="Ville" value={form.city} onChange={e=>set("city",e.target.value)}>
          <option value="">Choisir…</option>{TN_CITIES.map(c=><option key={c} value={c}>{c}</option>)}
        </Sel>
        <Fld label="Région / Quartier" value={form.region} onChange={e=>set("region",e.target.value)}/>
      </div>
      <div style={{marginTop:13,display:"flex",flexDirection:"column",gap:5}}>
        <label style={{fontSize:12,color:C.muted,fontWeight:600}}>Adresse complète</label>
        <textarea value={form.address} onChange={e=>set("address",e.target.value)} placeholder="Rue, bâtiment…"
          style={{background:C.cardAlt,border:`1.5px solid ${C.border}`,borderRadius:9,color:C.text,padding:"9px 13px",fontSize:14,outline:"none",resize:"vertical",minHeight:70,fontFamily:"inherit"}}/>
      </div>
      <div style={{marginTop:16}}><Btn variant="primary" loading={loading} onClick={save}>Sauvegarder</Btn></div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────
//  ARTISAN DASHBOARD
// ─────────────────────────────────────────────────────────────────
function ArtisanDash({user,setUser,setToast}){
  const [tab,setTab]=useState("requests");
  const [requests,setRequests]=useState([]);
  const [loading,setLoading]=useState(true);
  const [photoModal,setPhotoModal]=useState(null);
  const loadReqs=useCallback(()=>{setLoading(true);api.receivedRequests().then(setRequests).catch(()=>{}).finally(()=>setLoading(false));},[]);
  useEffect(()=>loadReqs(),[loadReqs]);
  const pending=requests.filter(r=>r.status==="pending");
  const active=requests.filter(r=>["accepted","in_progress"].includes(r.status));
  const done=requests.filter(r=>["completed","cancelled","rejected"].includes(r.status));
  const respond=async(id,action)=>{
    try{await api.respondRequest(id,{action});loadReqs();setToast({msg:action==="accept"?"Acceptée":"Refusée",type:"success"});}
    catch(e){setToast({msg:e.message,type:"error"});}
  };
  const start=async(id)=>{
    try{await api.startRequest(id);loadReqs();setToast({msg:"Démarrée",type:"success"});}
    catch(e){setToast({msg:e.message,type:"error"});}
  };
  const tabs=[{id:"requests",l:`📥 Demandes (${pending.length})`},{id:"active",l:`🔧 En cours (${active.length})`},{id:"history",l:"📋 Historique"},{id:"profile",l:"👤 Mon profil"},{id:"plan",l:"💳 Plan"}];
  const RRow=({r})=>(
    <Card style={{marginBottom:12}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:8,marginBottom:12}}>
        <div>
          <div style={{fontWeight:700,fontSize:15,marginBottom:3}}>{r.service}</div>
          <div style={{fontSize:13,color:C.muted}}>👤 {r.client_name} • {r.client_city||"—"}</div>
          <div style={{fontSize:12,color:C.muted}}>📅 {new Date(r.created_at).toLocaleDateString("fr-TN")}</div>
        </div>
        <StatusChip status={r.status}/>
      </div>
      {r.description&&<p style={{fontSize:13,color:C.textSub,marginBottom:12,background:C.cardAlt,padding:"8px 12px",borderRadius:8}}>{r.description}</p>}
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {r.status==="pending"&&<><Btn variant="green" size="sm" onClick={()=>respond(r.id,"accept")}>✓ Accepter</Btn><Btn variant="danger" size="sm" onClick={()=>respond(r.id,"decline")}>✕ Refuser</Btn></>}
        {r.status==="accepted"&&<Btn variant="primary" size="sm" onClick={()=>start(r.id)}>🔧 Démarrer</Btn>}
        {r.status==="in_progress"&&<Btn variant="primary" size="sm" onClick={()=>setPhotoModal(r)}>📷 Soumettre photos</Btn>}
      </div>
    </Card>
  );
  return(
    <div style={{padding:"26px 20px",maxWidth:1000,margin:"0 auto"}}>
      <Card style={{marginBottom:20,padding:"16px 20px"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
          <Av name={user.name} size={44}/>
          <div>
            <div style={{fontWeight:700,fontSize:16}}>{user.name}</div>
            <div style={{fontSize:13,color:C.muted}}>{user.category} • Plan <span style={{color:user.plan==="premium"?C.purple:C.green,fontWeight:700}}>{user.plan||"Gratuit"}</span></div>
          </div>
        </div>
      </Card>
      <div style={{display:"flex",gap:7,marginBottom:20,overflowX:"auto",paddingBottom:4}}>
        {tabs.map(t=><Pill key={t.id} active={tab===t.id} onClick={()=>setTab(t.id)}>{t.l}</Pill>)}
      </div>
      {tab==="requests"&&(loading?<Spinner/>:(pending.length===0?<Card style={{textAlign:"center",padding:48}}><p style={{color:C.muted}}>Aucune nouvelle demande.</p></Card>:pending.map(r=><RRow key={r.id} r={r}/>)))}
      {tab==="active"&&(loading?<Spinner/>:(active.length===0?<Card style={{textAlign:"center",padding:48}}><p style={{color:C.muted}}>Aucune intervention en cours.</p></Card>:active.map(r=><RRow key={r.id} r={r}/>)))}
      {tab==="history"&&(loading?<Spinner/>:(done.length===0?<Card style={{textAlign:"center",padding:48}}><p style={{color:C.muted}}>Historique vide.</p></Card>:done.map(r=><RRow key={r.id} r={r}/>)))}
      {tab==="profile"&&<ArtisanProfileEditor user={user} setUser={setUser} setToast={setToast}/>}
      {tab==="plan"&&(
        <Card>
          <h3 style={{fontWeight:700,marginBottom:18}}>Mon abonnement</h3>
          <div style={{background:user.plan==="premium"?C.pbg:C.og,border:`2px solid ${user.plan==="premium"?C.purple:C.orange}44`,borderRadius:13,padding:18,marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
            <div><div style={{fontWeight:700,fontSize:18,color:user.plan==="premium"?C.purple:C.orange}}>Plan {user.plan==="premium"?"Premium":"Gratuit"}</div></div>
            <div><span style={{fontWeight:700,fontSize:26}}>{user.plan==="premium"?"19":"0"}</span><span style={{color:C.muted}}> DT/mois</span></div>
          </div>
        </Card>
      )}
      <PhotoSubmitModal open={!!photoModal} request={photoModal} onClose={()=>setPhotoModal(null)}
        onSuccess={()=>{setPhotoModal(null);loadReqs();setToast({msg:"Photos soumises !",type:"success"});}}/>
    </div>
  );
}

function PhotoSubmitModal({open,request:r,onClose,onSuccess}){
  const [form,setForm]=useState({before_url:"",after_url:"",note:""});
  const [loading,setLoading]=useState(false);
  const [err,setErr]=useState("");
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const submit=async()=>{
    if(!form.before_url.trim()||!form.after_url.trim()){setErr("Photos requises.");return;}
    setLoading(true);
    try{await api.submitPhotos(r.id,form);onSuccess();}
    catch(e){setErr(e.message);}
    finally{setLoading(false);}
  };
  return(
    <Modal open={open} onClose={onClose} title="Soumettre photos d'intervention" wide>
      {r&&<div style={{marginBottom:14,background:C.cardAlt,borderRadius:9,padding:"10px 14px",fontSize:13,color:C.textSub}}><strong>Demande :</strong> {r.service} — <strong>Client :</strong> {r.client_name}</div>}
      <div style={{display:"flex",flexDirection:"column",gap:13}}>
        <div style={{background:`${C.orange}08`,border:`1px solid ${C.orange}28`,borderRadius:9,padding:"10px 14px",fontSize:13,color:C.textSub}}>ℹ️ Ces photos seront envoyées <strong>uniquement au client</strong> de cette demande pour validation.</div>
        <Fld label="🔴 URL photo AVANT" placeholder="https://…/avant.jpg" value={form.before_url} onChange={e=>set("before_url",e.target.value)}/>
        <Fld label="🟢 URL photo APRÈS" placeholder="https://…/apres.jpg" value={form.after_url} onChange={e=>set("after_url",e.target.value)}/>
        {form.before_url&&form.after_url&&(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {[["⚠️ Avant",form.before_url,"#FEF3C7","#92400E"],["✅ Après",form.after_url,"#D1FAE5","#065F46"]].map(([lbl,src,bg,col])=>(
              <div key={lbl}>
                <div style={{fontSize:11,fontWeight:700,color:col,background:bg,borderRadius:"6px 6px 0 0",padding:"4px 8px",textAlign:"center"}}>{lbl}</div>
                <img src={src} alt={lbl} style={{width:"100%",borderRadius:"0 0 8px 8px",border:`1px solid ${C.border}`,maxHeight:150,objectFit:"cover",display:"block"}} onError={e=>e.target.style.display="none"}/>
              </div>
            ))}
          </div>
        )}
        <div style={{display:"flex",flexDirection:"column",gap:5}}>
          <label style={{fontSize:12,color:C.muted,fontWeight:600}}>Note pour le client</label>
          <textarea value={form.note} onChange={e=>set("note",e.target.value)} placeholder="Décrivez ce que vous avez fait…"
            style={{background:C.cardAlt,border:`1.5px solid ${C.border}`,borderRadius:9,color:C.text,padding:"9px 13px",fontSize:14,outline:"none",resize:"vertical",minHeight:60,fontFamily:"inherit"}}/>
        </div>
        {err&&<p style={{fontSize:12,color:C.red,background:C.rbg,padding:"8px 12px",borderRadius:8}}>{err}</p>}
        <div style={{display:"flex",gap:9}}>
          <Btn variant="primary" loading={loading} onClick={submit} style={{flex:1}}>📤 Soumettre au client</Btn>
          <Btn variant="secondary" onClick={onClose}>Annuler</Btn>
        </div>
      </div>
    </Modal>
  );
}



// ─────────────────────────────────────────────────────────────────
//  EXPORT CSV — Admin
// ─────────────────────────────────────────────────────────────────
function ExportPanel({artisans, clients}){
  const [filterRegion, setFilterRegion] = useState("");
  const [filterSpec,   setFilterSpec]   = useState("");
  const [filterType,   setFilterType]   = useState("all"); // all | artisans | clients

  // Listes uniques pour les filtres
  const regions  = [...new Set([
    ...artisans.map(a=>a.city).filter(Boolean),
    ...clients.map(c=>c.city).filter(Boolean),
  ])].sort();
  const specs = [...new Set(artisans.map(a=>a.category).filter(Boolean))].sort();

  // Données filtrées
  const filteredArtisans = artisans
    .filter(a=>!filterRegion || a.city===filterRegion)
    .filter(a=>!filterSpec   || a.category===filterSpec);

  const filteredClients = clients
    .filter(c=>!filterRegion || c.city===filterRegion);

  // Générer et télécharger un CSV
  const downloadCSV = (rows, filename, headers) => {
    if(!rows.length){ alert("Aucune donnée à exporter."); return; }
    const escape = v => `"${String(v||"").replace(/"/g,'""')}"`;
    const lines  = [
      headers.join(";"),
      ...rows.map(r=>headers.map(h=>escape(r[h.toLowerCase().replace(/ /g,"_")]||r[Object.keys(r)[headers.indexOf(h)]]||"")).join(";")),
    ];
    const blob = new Blob(["﻿"+lines.join("\n")], {type:"text/csv;charset=utf-8;"});
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href=url; a.download=filename; a.click();
    URL.revokeObjectURL(url);
  };

  // Export artisans
  const exportArtisans = () => {
    const rows = filteredArtisans.map(a=>({
      "Nom":          a.name||"",
      "Email":        a.email||"",
      "Téléphone":    a.phone||"",
      "Ville":        a.city||"",
      "Spécialité":   a.category||"",
      "Plan":         a.plan||"free",
      "Note":         a.rating||"",
      "Interventions":a.jobs_count||0,
      "Avis":         a.reviews_count||0,
      "Validé":       a.is_validated?"Oui":"Non",
      "Inscrit":      a.created_at?new Date(a.created_at).toLocaleDateString("fr-TN"):"",
    }));
    const headers=["Nom","Email","Téléphone","Ville","Spécialité","Plan","Note","Interventions","Avis","Validé","Inscrit"];
    const suffix = [filterRegion,filterSpec].filter(Boolean).join("_")||"tous";
    downloadCSV(rows, `fixily_artisans_${suffix}_${new Date().toISOString().slice(0,10)}.csv`, headers);
  };

  // Export clients
  const exportClients = () => {
    const rows = filteredClients.map(c=>({
      "Nom":      c.name||"",
      "Email":    c.email||"",
      "Téléphone":c.phone||"",
      "Ville":    c.city||"",
      "Région":   c.region||"",
      "Demandes": c.requests_count||0,
      "Avis":     c.reviews_count||0,
      "Inscrit":  c.created_at?new Date(c.created_at).toLocaleDateString("fr-TN"):"",
    }));
    const headers=["Nom","Email","Téléphone","Ville","Région","Demandes","Avis","Inscrit"];
    const suffix = filterRegion||"tous";
    downloadCSV(rows, `fixily_clients_${suffix}_${new Date().toISOString().slice(0,10)}.csv`, headers);
  };

  // Export tout
  const exportAll = () => {
    exportArtisans();
    setTimeout(exportClients, 500);
  };

  const C2=C; // alias local
  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      {/* Filtres */}
      <Card>
        <h3 style={{fontWeight:700,fontSize:15,marginBottom:16}}>📥 Export CSV</h3>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:13,marginBottom:16}}>
          <Sel label="Filtrer par ville/région" value={filterRegion} onChange={e=>setFilterRegion(e.target.value)}>
            <option value="">Toutes les villes</option>
            {regions.map(r=><option key={r} value={r}>{r}</option>)}
          </Sel>
          <Sel label="Filtrer par spécialité" value={filterSpec} onChange={e=>setFilterSpec(e.target.value)}>
            <option value="">Toutes les spécialités</option>
            {specs.map(s=><option key={s} value={s}>{s}</option>)}
          </Sel>
          <Sel label="Type d'export" value={filterType} onChange={e=>setFilterType(e.target.value)}>
            <option value="all">Artisans + Clients</option>
            <option value="artisans">Artisans seulement</option>
            <option value="clients">Clients seulement</option>
          </Sel>
        </div>

        {/* Stats du filtre courant */}
        <div style={{display:"flex",gap:12,marginBottom:20,flexWrap:"wrap"}}>
          {(filterType==="all"||filterType==="artisans")&&(
            <div style={{background:C2.og,border:`1px solid ${C2.orange}28`,borderRadius:9,padding:"10px 16px",fontSize:13}}>
              🔧 <strong style={{color:C2.orange}}>{filteredArtisans.length}</strong> artisan(s) sélectionné(s)
              {filterSpec&&<span style={{color:C2.muted}}> • {filterSpec}</span>}
              {filterRegion&&<span style={{color:C2.muted}}> • {filterRegion}</span>}
            </div>
          )}
          {(filterType==="all"||filterType==="clients")&&(
            <div style={{background:C2.gbg,border:`1px solid ${C2.green}28`,borderRadius:9,padding:"10px 16px",fontSize:13}}>
              👥 <strong style={{color:C2.green}}>{filteredClients.length}</strong> client(s) sélectionné(s)
              {filterRegion&&<span style={{color:C2.muted}}> • {filterRegion}</span>}
            </div>
          )}
        </div>

        {/* Boutons export */}
        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
          {(filterType==="all"||filterType==="artisans")&&(
            <Btn variant="primary" onClick={exportArtisans}>
              ⬇️ Exporter Artisans ({filteredArtisans.length})
            </Btn>
          )}
          {(filterType==="all"||filterType==="clients")&&(
            <Btn variant="green" onClick={exportClients}>
              ⬇️ Exporter Clients ({filteredClients.length})
            </Btn>
          )}
          {filterType==="all"&&(
            <Btn variant="secondary" onClick={exportAll}>
              ⬇️ Exporter Tout
            </Btn>
          )}
        </div>
      </Card>

      {/* Aperçu artisans */}
      {(filterType==="all"||filterType==="artisans")&&filteredArtisans.length>0&&(
        <Card style={{padding:0,overflow:"hidden"}}>
          <div style={{padding:"14px 18px",borderBottom:`1px solid ${C2.border}`,fontWeight:700,fontSize:14}}>
            🔧 Aperçu artisans ({filteredArtisans.length})
          </div>
          <div style={{overflowX:"auto",maxHeight:300}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead><tr style={{background:C2.cardAlt}}>
                {["Nom","Email","Ville","Spécialité","Plan","Note"].map(h=>(
                  <th key={h} style={{padding:"8px 12px",textAlign:"left",fontWeight:700,color:C2.muted,whiteSpace:"nowrap"}}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {filteredArtisans.slice(0,50).map((a,i)=>(
                  <tr key={a.id} style={{borderBottom:`1px solid ${C2.border}`,background:i%2?C2.cardAlt:C2.card}}>
                    <td style={{padding:"7px 12px",fontWeight:600}}>{a.name}</td>
                    <td style={{padding:"7px 12px",color:C2.muted}}>{a.email}</td>
                    <td style={{padding:"7px 12px"}}>{a.city}</td>
                    <td style={{padding:"7px 12px"}}>{a.category}</td>
                    <td style={{padding:"7px 12px"}}><Chip color={a.plan==="premium"?C2.purple:C2.muted}>{a.plan||"free"}</Chip></td>
                    <td style={{padding:"7px 12px",color:C2.yellow}}>⭐ {a.rating||"—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredArtisans.length>50&&<div style={{padding:"8px 12px",fontSize:12,color:C2.muted}}>... et {filteredArtisans.length-50} autres dans le fichier CSV</div>}
          </div>
        </Card>
      )}

      {/* Aperçu clients */}
      {(filterType==="all"||filterType==="clients")&&filteredClients.length>0&&(
        <Card style={{padding:0,overflow:"hidden"}}>
          <div style={{padding:"14px 18px",borderBottom:`1px solid ${C2.border}`,fontWeight:700,fontSize:14}}>
            👥 Aperçu clients ({filteredClients.length})
          </div>
          <div style={{overflowX:"auto",maxHeight:300}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead><tr style={{background:C2.cardAlt}}>
                {["Nom","Email","Téléphone","Ville","Région","Demandes"].map(h=>(
                  <th key={h} style={{padding:"8px 12px",textAlign:"left",fontWeight:700,color:C2.muted,whiteSpace:"nowrap"}}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {filteredClients.slice(0,50).map((c,i)=>(
                  <tr key={c.id} style={{borderBottom:`1px solid ${C2.border}`,background:i%2?C2.cardAlt:C2.card}}>
                    <td style={{padding:"7px 12px",fontWeight:600}}>{c.name}</td>
                    <td style={{padding:"7px 12px",color:C2.muted}}>{c.email}</td>
                    <td style={{padding:"7px 12px"}}>{c.phone||"—"}</td>
                    <td style={{padding:"7px 12px"}}>{c.city||"—"}</td>
                    <td style={{padding:"7px 12px"}}>{c.region||"—"}</td>
                    <td style={{padding:"7px 12px"}}>{c.requests_count||0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredClients.length>50&&<div style={{padding:"8px 12px",fontSize:12,color:C2.muted}}>... et {filteredClients.length-50} autres dans le fichier CSV</div>}
          </div>
        </Card>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  ADMIN — Ajouter un artisan
// ─────────────────────────────────────────────────────────────────
function AdminAddArtisan({setToast}){
  const [form,setForm]=useState({
    name:"",email:"",phone:"",password:"fixily123",
    city:"",region:"",address:"",bio:"",
    category:"Plomberie",whatsapp:"",
  });
  const [loading,setLoading]=useState(false);
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));

  const submit=async()=>{
    if(!form.name||!form.email||!form.phone||!form.city||!form.category)
      return setToast({msg:"Tous les champs obligatoires requis.",type:"error"});
    setLoading(true);
    try{
      const r = await api.adminCreateArtisan(form);
      setToast({msg:`✅ Artisan créé ! ID: ${r.id}`,type:"success"});
      setForm({name:"",email:"",phone:"",password:"fixily123",city:"",region:"",address:"",bio:"",category:"Plomberie",whatsapp:""});
    }catch(e){setToast({msg:e.message,type:"error"});}
    finally{setLoading(false);}
  };

  return(
    <Card>
      <h3 style={{fontWeight:700,fontSize:15,marginBottom:18}}>➕ Ajouter un artisan</h3>
      <div style={{background:C.cardAlt,borderRadius:9,padding:"10px 14px",marginBottom:16,fontSize:13,color:C.textSub}}>
        ℹ️ L'artisan sera créé et <strong>validé automatiquement</strong>. Mot de passe par défaut : <code>fixily123</code>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:13}}>
        <Fld label="Nom complet *" value={form.name} onChange={e=>set("name",e.target.value)}/>
        <Fld label="Email *" type="email" value={form.email} onChange={e=>set("email",e.target.value)}/>
        <Fld label="Téléphone *" value={form.phone} onChange={e=>set("phone",e.target.value)} placeholder="+216XXXXXXXX"/>
        <Fld label="WhatsApp" value={form.whatsapp} onChange={e=>set("whatsapp",e.target.value)} placeholder="+216XXXXXXXX"/>
        <Sel label="Ville *" value={form.city} onChange={e=>set("city",e.target.value)}>
          <option value="">Choisir…</option>
          {TN_CITIES.map(c=><option key={c} value={c}>{c}</option>)}
        </Sel>
        <Sel label="Catégorie *" value={form.category} onChange={e=>set("category",e.target.value)}>
          {CATEGORIES.map(c=><option key={c.id} value={c.label}>{c.icon} {c.label}</option>)}
        </Sel>
        <Fld label="Région" value={form.region} onChange={e=>set("region",e.target.value)}/>
        <Fld label="Mot de passe" value={form.password} onChange={e=>set("password",e.target.value)}/>
      </div>
      <div style={{marginTop:13,display:"flex",flexDirection:"column",gap:5}}>
        <label style={{fontSize:12,color:C.muted,fontWeight:600}}>Bio / Présentation</label>
        <textarea value={form.bio} onChange={e=>set("bio",e.target.value)} placeholder="Description de l'artisan…"
          style={{background:C.cardAlt,border:`1.5px solid ${C.border}`,borderRadius:9,color:C.text,
            padding:"9px 13px",fontSize:14,outline:"none",resize:"vertical",minHeight:80,fontFamily:"inherit"}}/>
      </div>
      <div style={{marginTop:16}}>
        <Btn variant="primary" loading={loading} onClick={submit}>➕ Créer l'artisan</Btn>
      </div>
    </Card>
  );
}
// ─────────────────────────────────────────────────────────────────
//  ADMIN DASHBOARD  (avec onglet Régie Pub)
// ─────────────────────────────────────────────────────────────────
function AdminDash({siteConfig,setSiteConfig,setToast}){
  const [tab,setTab]=useState("overview");
  const [data,setData]=useState({});
  const [artisans,setArtisans]=useState([]);
  const [clients,setClients]=useState([]);
  const [requests,setRequests]=useState([]);
  const [ads,setAds]=useState([]);
  const [viewStats,setViewStats]=useState({artisans:[],total_views:0});
  const [adStats,setAdStats]=useState({});
  const [adModal,setAdModal]=useState(null); // null | "create" | ad object
  const [cfgDraft,setCfgDraft]=useState({});
  const [cfgLoaded,setCfgLoaded]=useState(false);

  useEffect(()=>{api.adminDashboard().then(setData).catch(()=>{});},[]);
  useEffect(()=>{
    if(tab==="artisans"||tab==="export")api.adminArtisans().then(setArtisans).catch(()=>{});
    if(tab==="clients"||tab==="export")api.adminClients().then(setClients).catch(()=>{});
    if(tab==="views")api.adminViewStats().then(r=>setViewStats(r)).catch(()=>{});
    if(tab==="requests")api.adminRequests().then(setRequests).catch(()=>{});
    if(tab==="ads"){api.adminAds().then(setAds).catch(()=>{});api.adminAdStats().then(setAdStats).catch(()=>{});}
    if(tab==="config"&&!cfgLoaded)api.adminConfig().then(c=>{setCfgDraft(c);setCfgLoaded(true);}).catch(()=>{});
  },[tab]);

  const saveConfig=async()=>{
    try{await api.adminSaveConfig(cfgDraft);setSiteConfig(cfgDraft);setToast({msg:"Config sauvegardée !",type:"success"});}
    catch(e){setToast({msg:e.message,type:"error"});}
  };

  const KpiCard=({icon,label,value,color=C.orange})=>(
    <Card style={{padding:"16px 12px"}}>
      <div style={{fontSize:22,marginBottom:6}}>{icon}</div>
      <div style={{fontWeight:700,fontSize:24,color}}>{value??0}</div>
      <div style={{fontSize:12,fontWeight:600,color:C.text,marginTop:2}}>{label}</div>
    </Card>
  );

  const STATUS_COLOR_AD={active:C.green,paused:C.yellow,expired:C.muted,draft:C.blue};

  const tabs=[
    {id:"overview",l:"📊 Vue globale"},{id:"artisans",l:"🔧 Artisans"},
    {id:"clients",l:"👥 Clients"},{id:"requests",l:"📋 Demandes"},
    {id:"ads",l:"📢 Régie Pub"},{id:"config",l:"⚙️ Config"},
    {id:"add-artisan",l:"➕ Ajouter Artisan"},{id:"tools",l:"🔧 Outils"},
    {id:"export",l:"📥 Export CSV"},{id:"views",l:"👁️ Consultations"},
  ];

  return(
    <div style={{padding:"26px 20px",maxWidth:1140,margin:"0 auto"}}>
      <div style={{background:`linear-gradient(135deg,${C.orange}14,${C.pbg})`,border:`1.5px solid ${C.orange}28`,borderRadius:14,padding:"14px 20px",marginBottom:20,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
        <div>
          <div style={{fontWeight:700,fontSize:18}}>⚙️ Administration — Fixily<span style={{color:C.orange}}>.tn</span></div>
          <div style={{fontSize:13,color:C.muted}}>Panneau de contrôle SaaS</div>
        </div>
        <Chip color={C.green}>● Opérationnel</Chip>
      </div>

      <div style={{display:"flex",gap:7,marginBottom:20,overflowX:"auto",paddingBottom:4}}>
        {tabs.map(t=><Pill key={t.id} active={tab===t.id} onClick={()=>setTab(t.id)}>{t.l}</Pill>)}
      </div>

      {tab==="overview"&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:11}}>
          <KpiCard icon="👥" label="Clients" value={data.clients} color={C.blue}/>
          <KpiCard icon="🔧" label="Artisans" value={data.artisans}/>
          <KpiCard icon="💳" label="Premium" value={data.premium} color={C.purple}/>
          <KpiCard icon="💰" label="MRR (DT)" value={data.mrr} color={C.green}/>
          <KpiCard icon="📋" label="Demandes" value={data.pending_requests} color={C.yellow}/>
          <KpiCard icon="🚨" label="Signalements" value={data.reports} color={C.red}/>
          <KpiCard icon="✉️" label="Messages" value={data.unread_messages} color={C.blue}/>
        </div>
      )}

      {tab==="artisans"&&(
        <Card style={{padding:0,overflow:"hidden"}}>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr style={{background:C.cardAlt,borderBottom:`2px solid ${C.border}`}}>
                {["Artisan","Catégorie","Ville","Plan","Note","Validé","Actions"].map(h=>(
                  <th key={h} style={{padding:"10px 13px",textAlign:"left",fontSize:12,fontWeight:700,color:C.muted,whiteSpace:"nowrap"}}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {artisans.map((a,i)=>(
                  <tr key={a.id} style={{borderBottom:`1px solid ${C.border}`,background:i%2?C.cardAlt:C.card}}>
                    <td style={{padding:"10px 13px"}}><div style={{display:"flex",gap:8,alignItems:"center"}}><Av name={a.name} size={28}/><span style={{fontSize:13,fontWeight:600}}>{a.name}</span></div></td>
                    <td style={{padding:"10px 13px",fontSize:13,color:C.textSub}}>{a.category}</td>
                    <td style={{padding:"10px 13px",fontSize:13}}>{a.city}</td>
                    <td style={{padding:"10px 13px"}}><Chip color={a.plan==="premium"?C.purple:C.muted}>{a.plan}</Chip></td>
                    <td style={{padding:"10px 13px",fontSize:13,color:C.yellow}}>⭐ {a.rating||"—"}</td>
                    <td style={{padding:"10px 13px"}}><Chip color={a.is_validated?C.green:C.yellow}>{a.is_validated?"Oui":"Non"}</Chip></td>
                    <td style={{padding:"10px 13px"}}>
                      <div style={{display:"flex",gap:6}}>
                        {!a.is_validated&&<Btn variant="green" size="sm" onClick={()=>api.adminValidateArtisan(a.id).then(()=>{api.adminArtisans().then(setArtisans);setToast({msg:"Validé",type:"success"})})}>✓</Btn>}
                        <Btn variant="danger" size="sm" onClick={()=>api.adminSuspend(a.id).then(()=>api.adminArtisans().then(setArtisans))}>Suspendre</Btn>
                        <Btn variant="danger" size="sm" onClick={()=>{if(window.confirm("Supprimer cet artisan ?"))api.adminDeleteUser(a.id).then(()=>api.adminArtisans().then(setArtisans)).catch(e=>setToast({msg:e.message,type:"error"}));}}>🗑 Suppr.</Btn>
                        <Btn variant="purple" size="sm" onClick={()=>api.adminSetPlan(a.id,{plan:a.plan==="premium"?"free":"premium"}).then(()=>api.adminArtisans().then(setArtisans))}>
                          {a.plan==="premium"?"→ Gratuit":"→ Premium"}
                        </Btn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab==="clients"&&(
        <Card style={{padding:0,overflow:"hidden"}}>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr style={{background:C.cardAlt,borderBottom:`2px solid ${C.border}`}}>
                {["Client","Email","Téléphone","Ville","Demandes","Inscrit","Action"].map(h=>(
                  <th key={h} style={{padding:"10px 13px",textAlign:"left",fontSize:12,fontWeight:700,color:C.muted}}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {clients.map((c,i)=>(
                  <tr key={c.id} style={{borderBottom:`1px solid ${C.border}`,background:i%2?C.cardAlt:C.card}}>
                    <td style={{padding:"10px 13px"}}><div style={{display:"flex",gap:8,alignItems:"center"}}><Av name={c.name} size={26}/><span style={{fontSize:13,fontWeight:600}}>{c.name}</span></div></td>
                    <td style={{padding:"10px 13px",fontSize:12,color:C.muted}}>{c.email}</td>
                    <td style={{padding:"10px 13px",fontSize:13}}>{c.phone||"—"}</td>
                    <td style={{padding:"10px 13px",fontSize:13}}>{c.city||"—"}</td>
                    <td style={{padding:"10px 13px",fontSize:13}}>{c.requests_count||0}</td>
                    <td style={{padding:"10px 13px",fontSize:12,color:C.muted}}>{new Date(c.created_at).toLocaleDateString("fr-TN")}</td>
                    <td style={{padding:"10px 13px"}}>
                      <Btn variant="danger" size="sm" onClick={()=>{if(window.confirm("Supprimer ce client ?"))api.adminDeleteUser(c.id).then(()=>api.adminClients().then(setClients)).catch(e=>setToast({msg:e.message,type:"error"}));}}>🗑</Btn>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab==="requests"&&(
        <Card>
          <h3 style={{fontWeight:700,marginBottom:16}}>Toutes les demandes ({requests.length})</h3>
          {requests.map(r=>(
            <div key={r.id} style={{background:C.cardAlt,border:`1px solid ${C.border}`,borderRadius:10,padding:13,marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:8,marginBottom:6}}>
                <div><span style={{fontWeight:700}}>{r.service}</span><span style={{color:C.muted,fontSize:13,marginLeft:8}}>{r.client_name} → {r.artisan_name}</span></div>
                <StatusChip status={r.status}/>
              </div>
              <div style={{fontSize:12,color:C.muted}}>{r.category} • {new Date(r.created_at).toLocaleDateString("fr-TN")}</div>
            </div>
          ))}
        </Card>
      )}

      {/* ── ONGLET RÉGIE PUB ── */}
      {tab==="ads"&&(
        <div>
          {/* Stats régie */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:11,marginBottom:18}}>
            <KpiCard icon="📢" label="Total" value={adStats.total} color={C.orange}/>
            <KpiCard icon="✅" label="Actives" value={adStats.active} color={C.green}/>
            <KpiCard icon="👁️" label="Impressions" value={adStats.total_impressions} color={C.blue}/>
            <KpiCard icon="🖱️" label="Clics" value={adStats.total_clicks} color={C.purple}/>
            <KpiCard icon="📈" label="CTR %" value={adStats.avg_ctr} color={C.yellow}/>
            <KpiCard icon="💰" label="Revenus DT" value={adStats.total_revenue_dt} color={C.green}/>
          </div>

          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:10}}>
            <h3 style={{fontWeight:700,fontSize:16}}>Campagnes publicitaires</h3>
            <Btn variant="primary" onClick={()=>setAdModal("create")}>+ Nouvelle campagne</Btn>
          </div>

          {ads.length===0?(
            <Card style={{textAlign:"center",padding:48}}>
              <div style={{fontSize:40,marginBottom:14}}>📢</div>
              <p style={{color:C.muted,marginBottom:16}}>Aucune campagne. Les espaces affichent "Votre pub ici".</p>
              <Btn variant="primary" onClick={()=>setAdModal("create")}>Créer la première campagne</Btn>
            </Card>
          ):ads.map(ad=>(
            <Card key={ad.id} style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12,marginBottom:12}}>
                <div style={{flex:1}}>
                  <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginBottom:4}}>
                    <span style={{fontWeight:700,fontSize:15}}>{ad.title}</span>
                    <Chip color={STATUS_COLOR_AD[ad.status]||C.muted}>{ad.status}</Chip>
                    <Chip color={C.blue}>{ad.position}</Chip>
                    <Chip color={C.muted}>{ad.size}</Chip>
                  </div>
                  <div style={{fontSize:13,color:C.muted}}>Annonceur : <strong style={{color:C.text}}>{ad.advertiser}</strong></div>
                  <div style={{fontSize:12,color:C.muted,marginTop:2}}>
                    Expire : {ad.ends_at?new Date(ad.ends_at).toLocaleDateString("fr-TN"):"Illimité"}
                    {ad.price_dt>0&&<span style={{marginLeft:8}}>• {ad.price_dt} DT</span>}
                  </div>
                </div>
                {/* Stats inline */}
                <div style={{display:"flex",gap:16,fontSize:13,textAlign:"center"}}>
                  {[[ad.impressions_count,"👁️","Affichages"],[ad.impressions_max,"📊","Quota"],[ad.clicks_count,"🖱️","Clics"],[ad.ctr,"📈","CTR%"]].map(([v,icon,l])=>(
                    <div key={l}>
                      <div style={{fontWeight:700,color:C.orange}}>{icon} {v??0}</div>
                      <div style={{fontSize:10,color:C.muted}}>{l}</div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Barre de progression impressions */}
              <div style={{background:C.border,borderRadius:4,height:6,marginBottom:12,overflow:"hidden"}}>
                <div style={{background:ad.status==="active"?C.green:C.muted,height:"100%",
                  width:`${Math.min((ad.impressions_count/Math.max(ad.impressions_max,1))*100,100)}%`,
                  borderRadius:4,transition:"width .3s"}}/>
              </div>
              {/* Aperçu image */}
              {ad.image_url&&<img src={ad.image_url} alt={ad.title} style={{width:"100%",maxHeight:80,objectFit:"cover",borderRadius:8,marginBottom:12}} onError={e=>e.target.style.display="none"}/>}
              {/* Actions */}
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                <Btn variant={ad.status==="active"?"secondary":"green"} size="sm"
                  onClick={()=>api.adminAdStatus(ad.id,ad.status==="active"?"paused":"active").then(()=>api.adminAds().then(setAds))}>
                  {ad.status==="active"?"⏸ Suspendre":"▶ Activer"}
                </Btn>
                <Btn variant="secondary" size="sm" onClick={()=>setAdModal(ad)}>✏️ Modifier</Btn>
                <Btn variant="purple" size="sm" onClick={()=>api.adminAdReset(ad.id).then(()=>{api.adminAds().then(setAds);setToast({msg:"Compteurs remis à zéro",type:"success"})})}>🔄 Reset</Btn>
                <Btn variant="danger" size="sm" onClick={()=>{if(window.confirm("Supprimer cette campagne ?"))api.adminDeleteAd(ad.id).then(()=>api.adminAds().then(setAds));}}>🗑 Supprimer</Btn>
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab==="config"&&(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <Card>
            <h3 style={{fontWeight:700,fontSize:15,marginBottom:16}}>Identité du site</h3>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:13}}>
              {[["site_name","Nom du site"],["site_tagline","Slogan"],["contact_email","Email contact"],
                ["contact_whatsapp","WhatsApp"],["contact_address","Adresse"],["contact_hours","Horaires"],
                ["social_facebook","Facebook URL"],["footer_copyright","Copyright"],
              ].map(([k,l])=>(
                <Fld key={k} label={l} value={cfgDraft[k]||""} onChange={e=>setCfgDraft(d=>({...d,[k]:e.target.value}))}/>
              ))}
              <Fld label="Prix Premium (DT/mois)" type="number" value={cfgDraft["premium_price_dt"]||"19"} onChange={e=>setCfgDraft(d=>({...d,premium_price_dt:e.target.value}))}/>
              <Fld label="Leads gratuits/mois" type="number" value={cfgDraft["free_leads_per_month"]||"5"} onChange={e=>setCfgDraft(d=>({...d,free_leads_per_month:e.target.value}))}/>
            </div>
          </Card>
          {/* Logo */}
          <Card>
            <h3 style={{fontWeight:700,fontSize:15,marginBottom:16}}>🖼️ Logo du site</h3>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
                <label style={{background:C.orange,color:"#fff",borderRadius:9,padding:"9px 18px",fontSize:13,fontWeight:700,cursor:"pointer",flexShrink:0}}>
                  📁 Choisir depuis mon PC
                  <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{
                    const file=e.target.files[0];
                    if(!file)return;
                    const reader=new FileReader();
                    reader.onload=ev=>setCfgDraft(d=>({...d,logo_url:ev.target.result}));
                    reader.readAsDataURL(file);
                  }}/>
                </label>
                <span style={{fontSize:12,color:C.muted}}>ou</span>
                <Fld label="" placeholder="URL du logo (https://...)" value={cfgDraft["logo_url"]?.startsWith("data:")?"":(cfgDraft["logo_url"]||"")} onChange={e=>setCfgDraft(d=>({...d,logo_url:e.target.value}))} style={{flex:1,minWidth:200}}/>
              </div>
              {cfgDraft["logo_url"]&&(
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <img src={cfgDraft["logo_url"]} alt="Aperçu logo" style={{height:50,maxWidth:200,objectFit:"contain",borderRadius:8,border:`1px solid ${C.border}`,background:C.cardAlt,padding:6}} onError={e=>e.target.style.display="none"}/>
                  <Btn variant="danger" size="sm" onClick={()=>setCfgDraft(d=>({...d,logo_url:""}))}>✕ Supprimer</Btn>
                </div>
              )}
              <div style={{fontSize:12,color:C.muted}}>Formats acceptés : PNG, JPG, SVG. Taille recommandée : 200×60px max.</div>
            </div>
          </Card>
          <div style={{display:"flex",gap:10}}>
            <Btn variant="primary" size="lg" onClick={saveConfig}>💾 Sauvegarder</Btn>
            <Btn variant="secondary" onClick={()=>api.adminRecalcBadges().then(()=>setToast({msg:"Badges recalculés !",type:"success"}))}>🏅 Recalculer badges</Btn>
          </div>
        </div>
      )}

      {/* ── AJOUTER ARTISAN ── */}
      {tab==="add-artisan"&&<AdminAddArtisan setToast={setToast}/>}

      {/* ── EXPORT CSV ── */}
      {tab==="export"&&<ExportPanel artisans={artisans} clients={clients}/>}

      {/* ── CONSULTATIONS ── */}
      {tab==="views"&&(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {/* KPIs */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12}}>
            {[
              ["👁️","Total consultations",viewStats.total_views,C.orange],
              ["🔧","Artisans suivis",viewStats.artisans.length,C.blue],
              ["🏆","Top artisan",viewStats.artisans[0]?.views_count||0,C.purple],
              ["📈","Moy. par artisan",viewStats.artisans.length>0?Math.round(viewStats.total_views/viewStats.artisans.length):0,C.green],
            ].map(([icon,label,value,color])=>(
              <Card key={label} style={{padding:"14px 12px",textAlign:"center"}}>
                <div style={{fontSize:22,marginBottom:4}}>{icon}</div>
                <div style={{fontWeight:700,fontSize:22,color}}>{value}</div>
                <div style={{fontSize:11,color:C.muted,marginTop:2}}>{label}</div>
              </Card>
            ))}
          </div>

          {/* Tableau consultations triées */}
          <Card style={{padding:0,overflow:"hidden"}}>
            <div style={{padding:"14px 18px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
              <span style={{fontWeight:700,fontSize:15}}>👁️ Consultations par artisan</span>
              <span style={{fontSize:12,color:C.muted}}>Triées par nombre de vues décroissant</span>
            </div>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead>
                  <tr style={{background:C.cardAlt,borderBottom:`2px solid ${C.border}`}}>
                    {["#","Artisan","Ville","Spécialité","Plan","Note","Consultations","Vues/jour","Demandes"].map(h=>(
                      <th key={h} style={{padding:"10px 13px",textAlign:"left",fontSize:12,fontWeight:700,color:C.muted,whiteSpace:"nowrap"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {viewStats.artisans.map((a,i)=>{
                    // Barre de progression relative au max
                    const max = viewStats.artisans[0]?.views_count||1;
                    const pct = Math.round((a.views_count/max)*100);
                    return(
                      <tr key={a.id} style={{borderBottom:`1px solid ${C.border}`,background:i%2?C.cardAlt:C.card}}>
                        <td style={{padding:"10px 13px",fontWeight:700,color:i<3?C.orange:C.muted,fontSize:i<3?15:13}}>
                          {i===0?"🥇":i===1?"🥈":i===2?"🥉":`${i+1}`}
                        </td>
                        <td style={{padding:"10px 13px"}}>
                          <div style={{fontWeight:600,fontSize:13}}>{a.name}</div>
                          <div style={{fontSize:11,color:C.muted}}>{a.is_validated?"✅ Validé":"⏳ En attente"}</div>
                        </td>
                        <td style={{padding:"10px 13px",fontSize:13,color:C.textSub}}>{a.city||"—"}</td>
                        <td style={{padding:"10px 13px",fontSize:13}}>{a.category||"—"}</td>
                        <td style={{padding:"10px 13px"}}><Chip color={a.plan==="premium"?C.purple:C.muted}>{a.plan||"free"}</Chip></td>
                        <td style={{padding:"10px 13px",fontSize:13,color:C.yellow}}>⭐ {a.rating||"—"}</td>
                        <td style={{padding:"10px 13px"}}>
                          <div style={{display:"flex",alignItems:"center",gap:8}}>
                            <div style={{flex:1,background:C.border,borderRadius:4,height:6,minWidth:60}}>
                              <div style={{width:`${pct}%`,background:pct>60?C.orange:pct>30?C.yellow:C.muted,height:"100%",borderRadius:4,transition:"width .3s"}}/>
                            </div>
                            <span style={{fontWeight:700,fontSize:13,color:C.orange,minWidth:30}}>{a.views_count||0}</span>
                          </div>
                        </td>
                        <td style={{padding:"10px 13px",fontSize:13,color:C.muted}}>{a.views_per_day||0}/j</td>
                        <td style={{padding:"10px 13px",fontSize:13}}>{a.jobs_count||0}</td>
                      </tr>
                    );
                  })}
                  {viewStats.artisans.length===0&&(
                    <tr><td colSpan={9} style={{padding:40,textAlign:"center",color:C.muted}}>Aucune donnée de consultation disponible.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Export consultations CSV */}
          <div style={{display:"flex",justifyContent:"flex-end"}}>
            <Btn variant="primary" onClick={()=>{
              if(!viewStats.artisans.length){alert("Aucune donnée.");return;}
              const headers=["Rang","Nom","Ville","Spécialité","Plan","Note","Consultations","Vues_par_jour","Demandes","Inscrit"];
              const rows=viewStats.artisans.map((a,i)=>({
                rang:i+1, nom:a.name, ville:a.city||"", specialite:a.category||"",
                plan:a.plan||"free", note:a.rating||"", consultations:a.views_count||0,
                vues_par_jour:a.views_per_day||0, demandes:a.jobs_count||0,
                inscrit:a.created_at?new Date(a.created_at).toLocaleDateString("fr-TN"):"",
              }));
              const escape=v=>`"${String(v||"").replace(/"/g,'""')}"`;
              const lines=[headers.join(";"),...rows.map(r=>Object.values(r).map(escape).join(";"))];
              const blob=new Blob(["﻿"+lines.join("\n")],{type:"text/csv;charset=utf-8;"});
              const url=URL.createObjectURL(blob);
              const a=document.createElement("a");
              a.href=url;a.download=`fixily_consultations_${new Date().toISOString().slice(0,10)}.csv`;a.click();
              URL.revokeObjectURL(url);
            }}>⬇️ Exporter consultations CSV</Btn>
          </div>
        </div>
      )}

      {/* ── OUTILS ── */}
      {tab==="tools"&&(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <Card>
            <h3 style={{fontWeight:700,marginBottom:16}}>🔧 Outils d'administration</h3>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <div style={{background:C.cardAlt,border:`1px solid ${C.border}`,borderRadius:10,padding:16}}>
                <div style={{fontWeight:700,marginBottom:6}}>📊 Créer données de test</div>
                <div style={{fontSize:13,color:C.muted,marginBottom:12}}>Crée 10 artisans + 20 clients de test (mot de passe: fixily123)</div>
                <Btn variant="primary" onClick={()=>api.adminSeedData().then(r=>{setToast({msg:r.message,type:"success"});}).catch(e=>setToast({msg:e.message,type:"error"}))}>
                  🚀 Créer données de test
                </Btn>
              </div>
              <div style={{background:`${C.orange}08`,border:`1px solid ${C.orange}28`,borderRadius:10,padding:16}}>
                <div style={{fontWeight:700,marginBottom:6}}>🔑 Lien secret admin</div>
                <div style={{fontSize:13,color:C.muted,marginBottom:8}}>Partagez ce lien uniquement avec les admins :</div>
                <code style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:6,padding:"6px 10px",fontSize:12,display:"block"}}>
                  /fixily-admin-2025
                </code>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Modal création/édition campagne */}
      <AdFormModal open={!!adModal} ad={adModal==="create"?null:adModal}
        onClose={()=>setAdModal(null)}
        onSave={async(formData)=>{
          try{
            if(adModal==="create")await api.adminCreateAd(formData);
            else await api.adminUpdateAd(adModal.id,formData);
            await api.adminAds().then(setAds);
            await api.adminAdStats().then(setAdStats);
            setAdModal(null);
            setToast({msg:adModal==="create"?"Campagne créée !":"Campagne mise à jour",type:"success"});
          }catch(e){setToast({msg:e.message,type:"error"});}
        }}/>
    </div>
  );
}

// ── Modal création/édition d'une campagne pub ─────────────────────
function AdFormModal({open,ad,onClose,onSave}){
  const [form,setForm]=useState({
    title:"",advertiser:"",image_url:"",target_url:"",alt_text:"",
    position:"both",size:"banner",impressions_max:10000,
    status:"draft",price_dt:0,notes:"",
    starts_at:new Date().toISOString().slice(0,10),ends_at:"",
  });
  const [loading,setLoading]=useState(false);
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));

  useEffect(()=>{
    if(ad){
      setForm({
        title:ad.title||"",advertiser:ad.advertiser||"",
        image_url:ad.image_url||"",target_url:ad.target_url||"",
        alt_text:ad.alt_text||"",position:ad.position||"both",
        size:ad.size||"banner",impressions_max:ad.impressions_max||10000,
        status:ad.status||"draft",price_dt:ad.price_dt||0,notes:ad.notes||"",
        starts_at:ad.starts_at?ad.starts_at.slice(0,10):new Date().toISOString().slice(0,10),
        ends_at:ad.ends_at?ad.ends_at.slice(0,10):"",
      });
    }else{
      setForm({title:"",advertiser:"",image_url:"",target_url:"",alt_text:"",
        position:"both",size:"banner",impressions_max:10000,status:"draft",
        price_dt:0,notes:"",starts_at:new Date().toISOString().slice(0,10),ends_at:""});
    }
  },[ad,open]);

  const submit=async()=>{
    if(!form.title||!form.advertiser||!form.target_url){alert("Titre, annonceur et URL cible requis.");return;}
    setLoading(true);
    try{await onSave({...form,impressions_max:+form.impressions_max,price_dt:+form.price_dt,ends_at:form.ends_at||null});}
    finally{setLoading(false);}
  };

  return(
    <Modal open={open} onClose={onClose} title={ad?"Modifier la campagne":"Nouvelle campagne pub"} wide>
      <div style={{display:"flex",flexDirection:"column",gap:13}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:13}}>
          <Fld label="Titre de la campagne *" value={form.title} onChange={e=>set("title",e.target.value)}/>
          <Fld label="Nom de l'annonceur *" value={form.advertiser} onChange={e=>set("advertiser",e.target.value)}/>
        </div>
        <Fld label="URL cible (clic → destination) *" placeholder="https://votre-site.com" value={form.target_url} onChange={e=>set("target_url",e.target.value)}/>
        <Fld label="URL image de la bannière" placeholder="https://…/banniere.jpg (optionnel)" value={form.image_url} onChange={e=>set("image_url",e.target.value)}/>
        {form.image_url&&<img src={form.image_url} alt="Aperçu" style={{width:"100%",maxHeight:90,objectFit:"cover",borderRadius:8,border:`1px solid ${C.border}`}} onError={e=>e.target.style.display="none"}/>}
        <Fld label="Texte alternatif (accessibilité)" value={form.alt_text} onChange={e=>set("alt_text",e.target.value)}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:13}}>
          <Sel label="Emplacement" value={form.position} onChange={e=>set("position",e.target.value)}>
            <option value="both">Accueil + Artisans</option>
            <option value="home">Accueil seulement</option>
            <option value="artisans">Artisans seulement</option>
          </Sel>
          <Sel label="Format" value={form.size} onChange={e=>set("size",e.target.value)}>
            <option value="banner">Banner (728×90)</option>
            <option value="wide">Wide (970×250)</option>
            <option value="square">Square (300×250)</option>
          </Sel>
          <Sel label="Statut" value={form.status} onChange={e=>set("status",e.target.value)}>
            <option value="draft">Brouillon</option>
            <option value="active">Actif</option>
            <option value="paused">En pause</option>
          </Sel>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:13}}>
          <Fld label="Quota impressions" type="number" value={form.impressions_max} onChange={e=>set("impressions_max",e.target.value)}/>
          <Fld label="Prix DT" type="number" value={form.price_dt} onChange={e=>set("price_dt",e.target.value)}/>
          <Fld label="Date de fin (optionnel)" type="date" value={form.ends_at} onChange={e=>set("ends_at",e.target.value)}/>
        </div>
        <Fld label="Notes internes" value={form.notes} onChange={e=>set("notes",e.target.value)}/>
        {/* Aperçu bannière */}
        <div style={{background:C.cardAlt,border:`1px solid ${C.border}`,borderRadius:9,padding:12}}>
          <p style={{fontSize:11,color:C.muted,fontWeight:600,marginBottom:8}}>APERÇU DE LA BANNIÈRE :</p>
          <AdBanner position="both" style={{margin:0}}/>
        </div>
        <div style={{display:"flex",gap:9}}>
          <Btn variant="primary" loading={loading} onClick={submit} style={{flex:1}}>
            {ad?"💾 Mettre à jour":"✅ Créer la campagne"}
          </Btn>
          <Btn variant="secondary" onClick={onClose}>Annuler</Btn>
        </div>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────
//  PRICING + CONTACT + FOOTER
// ─────────────────────────────────────────────────────────────────
function NotifyModal(){
  const [open,setOpen]=useState(false);
  const [form,setForm]=useState({email:"",whatsapp:""});
  const [sent,setSent]=useState(false);
  const [loading,setLoading]=useState(false);
  const submit=async()=>{
    if(!form.email&&!form.whatsapp) return alert("Email ou WhatsApp requis.");
    setLoading(true);
    try{
      await api.notifyPremium(form);
      setSent(true);
      setTimeout(()=>{setOpen(false);setSent(false);},2000);
    }catch(e){alert(e.message);}
    finally{setLoading(false);}
  };
  return(
    <>
      <button onClick={()=>setOpen(true)} style={{width:"100%",background:"#EDE8F9",color:"#7C3AED",border:"2px solid #C4B5E8",borderRadius:9,padding:"13px 0",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit",marginTop:16,transition:"all .2s"}}
        onMouseEnter={e=>e.target.style.background="#D8B4FE"}
        onMouseLeave={e=>e.target.style.background="#EDE8F9"}>
        🔔 Me notifier au lancement
      </button>
      <Modal open={open} onClose={()=>setOpen(false)} title="Me notifier au lancement Premium">
        {sent?(
          <div style={{textAlign:"center",padding:"20px 0"}}>
            <div style={{fontSize:40,marginBottom:10}}>✅</div>
            <p style={{fontWeight:700,color:C.green}}>Vous serez notifié au lancement !</p>
          </div>
        ):(
          <div style={{display:"flex",flexDirection:"column",gap:13}}>
            <p style={{fontSize:13,color:C.muted}}>Laissez votre email ou WhatsApp — nous vous contactons dès le lancement Premium.</p>
            <Fld label="Email" type="email" placeholder="votre@email.com" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}/>
            <Fld label="WhatsApp (optionnel)" placeholder="+216 XX XXX XXX" value={form.whatsapp} onChange={e=>setForm(f=>({...f,whatsapp:e.target.value}))}/>
            <div style={{display:"flex",gap:9}}>
              <Btn variant="purple" loading={loading} onClick={submit} style={{flex:1}}>🔔 Me notifier</Btn>
              <Btn variant="secondary" onClick={()=>setOpen(false)}>Annuler</Btn>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

function PricingPage({setAuthModal,siteConfig}){
  return(
    <div style={{padding:"52px 20px",maxWidth:860,margin:"0 auto"}}>
      <div style={{textAlign:"center",marginBottom:44}}>
        <h1 style={{fontWeight:800,fontSize:"clamp(26px,5vw,46px)",marginBottom:12}}>
          Démarrez <span style={{color:C.orange}}>gratuitement</span>, évoluez à votre rythme.
        </h1>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:18}}>
        <div style={{background:C.card,border:`2px solid ${C.orange}`,borderRadius:20,padding:28,position:"relative",boxShadow:`0 4px 24px ${C.og}`}}>
          <div style={{position:"absolute",top:-13,left:"50%",transform:"translateX(-50%)",background:C.orange,color:"#fff",borderRadius:100,padding:"3px 18px",fontSize:12,fontWeight:700,whiteSpace:"nowrap"}}>🚀 Disponible maintenant</div>
          <div style={{fontWeight:800,fontSize:20,color:C.orange,marginBottom:6}}>Gratuit</div>
          <div style={{marginBottom:18}}><span style={{fontWeight:800,fontSize:42}}>0</span><span style={{color:C.muted,fontSize:14}}> DT/mois</span></div>
          {["Profil artisan complet","5 demandes/leads par mois","Photos avant/après","Avis clients","Badge Recommandé"].map(f=>(
            <div key={f} style={{display:"flex",gap:10,alignItems:"center",marginBottom:9}}><span style={{color:C.green,fontWeight:700}}>✓</span><span style={{fontSize:14,color:C.textSub}}>{f}</span></div>
          ))}
          <Btn variant="primary" size="lg" onClick={()=>setAuthModal("register")} style={{width:"100%",marginTop:16}}>Créer mon profil →</Btn>
        </div>
        <div style={{background:`linear-gradient(140deg,#F8F5FF,${C.card})`,border:`2px dashed #C4B5E8`,borderRadius:20,padding:28,position:"relative"}}>
          <div style={{position:"absolute",top:-13,left:"50%",transform:"translateX(-50%)",background:C.purple,color:"#fff",borderRadius:100,padding:"3px 18px",fontSize:12,fontWeight:700,whiteSpace:"nowrap"}}>⏳ Bientôt</div>
          <div style={{fontWeight:800,fontSize:20,color:C.purple,marginBottom:6}}>Premium</div>
          <div style={{marginBottom:18}}><span style={{fontWeight:800,fontSize:42}}>{siteConfig?.premium_price_dt||"19"}</span><span style={{color:C.muted,fontSize:14}}> DT/mois</span></div>
          {["Leads illimités","Profil mis en avant","Badge Premium","Support dédié"].map(f=>(
            <div key={f} style={{display:"flex",gap:10,alignItems:"center",marginBottom:9}}><span style={{color:"#C4B5E8"}}>◇</span><span style={{fontSize:14,color:C.muted}}>{f}</span></div>
          ))}
          <NotifyModal/>
        </div>
      </div>
    </div>
  );
}

function ContactPage({cfg}){
  const [form,setForm]=useState({name:"",email:"",phone:"",msg:""});
  const [sent,setSent]=useState(false);
  const [loading,setLoading]=useState(false);
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const submit=async()=>{
    if(!form.name||!form.msg) return alert("Nom et message requis.");
    if(!form.email) return alert("Email requis.");
    const tel = form.phone.replace(/\s/g,"");
    if(!tel||!/^\+216[0-9]{8}$/.test(tel)) return alert("Téléphone tunisien requis (ex: +21698999999).");
    setLoading(true);
    try{await api.sendContact({name:form.name,email:form.email,phone:form.phone,message:form.msg});setSent(true);}
    catch(e){alert(e.message);}
    finally{setLoading(false);}
  };
  return(
    <div style={{padding:"48px 20px",maxWidth:900,margin:"0 auto"}}>
      <div style={{textAlign:"center",marginBottom:44}}>
        <h1 style={{fontWeight:800,fontSize:"clamp(26px,5vw,42px)",marginBottom:12}}>{cfg.contact_title||"Contactez-nous"}</h1>
        {cfg.contact_subtitle&&<p style={{color:C.muted,fontSize:15,maxWidth:480,margin:"0 auto"}}>{cfg.contact_subtitle}</p>}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:20}}>
        <div style={{display:"flex",flexDirection:"column",gap:13}}>
          {[{icon:"📧",label:"Email",value:cfg.contact_email,href:`mailto:${cfg.contact_email}`},
            {icon:"📲",label:"WhatsApp",value:cfg.contact_whatsapp,href:`https://wa.me/${(cfg.contact_whatsapp||"").replace(/\D/g,"")}`},
            {icon:"🇹🇳",label:"Adresse",value:cfg.contact_address,href:null},
            {icon:"🕐",label:"Horaires",value:cfg.contact_hours,href:null},
          ].map(item=>(
            <Card key={item.label} style={{padding:"14px 16px"}}>
              <div style={{display:"flex",gap:11,alignItems:"center"}}>
                <div style={{width:38,height:38,borderRadius:9,background:`${C.orange}12`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{item.icon}</div>
                <div>
                  <div style={{fontSize:11,color:C.muted,fontWeight:600,marginBottom:2}}>{item.label}</div>
                  {item.href?<a href={item.href} style={{fontSize:14,color:C.orange,fontWeight:600,textDecoration:"none"}}>{item.value||"—"}</a>:<div style={{fontSize:14,color:C.text}}>{item.value||"—"}</div>}
                </div>
              </div>
            </Card>
          ))}
          {cfg.social_facebook&&<a href={cfg.social_facebook} target="_blank" rel="noreferrer" style={{display:"inline-flex",alignItems:"center",gap:8,background:"#1877F2",color:"#fff",borderRadius:8,padding:"9px 16px",fontSize:14,fontWeight:600,textDecoration:"none",width:"fit-content"}}>📘 Facebook</a>}
        </div>
        <Card>
          <h3 style={{fontWeight:700,fontSize:15,marginBottom:16}}>{cfg.contact_form_title||"Envoyez un message"}</h3>
          {sent?<div style={{textAlign:"center",padding:"32px 0"}}><div style={{fontSize:44,marginBottom:14}}>✅</div><h4 style={{fontWeight:700}}>Message envoyé !</h4></div>:(
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <Fld label="Nom *" value={form.name} onChange={e=>set("name",e.target.value)}/>
              <Fld label="Email *" type="email" value={form.email} onChange={e=>set("email",e.target.value)}/>
              <Fld label="Téléphone * (ex: +21698999999)" value={form.phone} onChange={e=>set("phone",e.target.value)} placeholder="+21698999999"/>
              <div style={{display:"flex",flexDirection:"column",gap:5}}>
                <label style={{fontSize:12,color:C.muted,fontWeight:600}}>Message *</label>
                <textarea value={form.msg} onChange={e=>set("msg",e.target.value)} placeholder="Comment pouvons-nous vous aider ?"
                  style={{background:C.cardAlt,border:`1.5px solid ${C.border}`,borderRadius:9,color:C.text,padding:"9px 13px",fontSize:14,outline:"none",resize:"vertical",minHeight:100,fontFamily:"inherit"}}/>
              </div>
              <Btn variant="primary" size="lg" loading={loading} onClick={submit} style={{width:"100%"}}>Envoyer</Btn>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function Footer({setView,cfg}){
  if(!cfg) return null;
  return(
    <footer style={{borderTop:`1px solid ${C.border}`,padding:"34px 20px 26px",marginTop:48,background:C.cardAlt}}>
      <div style={{maxWidth:1140,margin:"0 auto",display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:22}}>
        <div>
          <div style={{fontWeight:800,fontSize:19,marginBottom:9}}>{cfg.site_name||"Fixily"}<span style={{color:C.orange}}>.tn</span></div>
          <p style={{fontSize:13,color:C.muted,lineHeight:1.6,marginBottom:12}}>{cfg.footer_tagline}</p>
          {cfg.footer_badge&&<span style={{background:`${C.orange}14`,color:C.orange,border:`1px solid ${C.orange}25`,borderRadius:4,padding:"3px 9px",fontSize:11,fontWeight:700}}>{cfg.footer_badge}</span>}
        </div>
        <div>
          <div style={{fontWeight:700,fontSize:13,marginBottom:9}}>Plateforme</div>
          {[["artisans","Artisans"],["pricing","Tarifs"],["contact","Contact"]].map(([v,l])=>(
            <div key={v} style={{marginBottom:6}}><button onClick={()=>setView(v)} style={{background:"none",border:"none",color:C.muted,fontSize:13,cursor:"pointer"}}>{l}</button></div>
          ))}
        </div>
        <div>
          <div style={{fontWeight:700,fontSize:13,marginBottom:9}}>Contact</div>
          <div style={{fontSize:13,color:C.muted,lineHeight:2}}>
            {cfg.contact_email&&<>📧 {cfg.contact_email}<br/></>}
            {cfg.contact_whatsapp&&<>📲 {cfg.contact_whatsapp}<br/></>}
          </div>
          {cfg.social_facebook&&<a href={cfg.social_facebook} target="_blank" rel="noreferrer" style={{display:"inline-flex",alignItems:"center",gap:7,marginTop:10,background:"#1877F2",color:"#fff",borderRadius:7,padding:"6px 12px",fontSize:12,fontWeight:600,textDecoration:"none"}}>📘 Facebook</a>}
        </div>
      </div>
      <div style={{borderTop:`1px solid ${C.border}`,marginTop:24,paddingTop:14,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:7}}>
        <span style={{fontSize:12,color:C.muted}}>{cfg.footer_copyright||"© 2025 Fixily.tn — Tous droits réservés"}</span>
        <button onClick={()=>setView("contact")} style={{background:"none",border:"none",color:C.orange,fontSize:12,cursor:"pointer",fontWeight:600}}>Contact</button>
      </div>
    </footer>
  );
}

// ─────────────────────────────────────────────────────────────────
//  ROOT APP
// ─────────────────────────────────────────────────────────────────
export default function App(){
  const [view,setView]=useState("home");
  const [user,setUser]=useState(null);
  const [authModal,setAuthModal]=useState(null);
  const [selectedArtisan,setSelectedArtisan]=useState(null);
  const [filterCat,setFilterCat]=useState(null);
  const [toast,setToast]=useState(null);
  const [siteConfig,setSiteConfig]=useState({});
  const [cfgLoaded,setCfgLoaded]=useState(false);

  useEffect(()=>{
    const token=localStorage.getItem("fixily_token");
    if(token)api.me().then(setUser).catch(()=>localStorage.removeItem("fixily_token"));
    // Détecter URL secrète admin
    if(window.location.pathname==="/fixily-admin-2025"){
      setView("fixily-admin-2025");
    }
  },[]);
  useEffect(()=>{
    if(!cfgLoaded)api.getConfig().then(c=>{setSiteConfig(c);setCfgLoaded(true);}).catch(()=>{});
  },[cfgLoaded]);
  useEffect(()=>{
    if(toast){const t=setTimeout(()=>setToast(null),3500);return()=>clearTimeout(t);}
  },[toast]);

  const nav=v=>{setView(v);window.scrollTo({top:0,behavior:"smooth"});};
  const handleAuth=u=>{
    setUser(u);setAuthModal(null);
    if(u.type==="artisan")nav("dashboard");
    else if(u.type==="admin")nav("fixily-admin-2025");
    else nav("client-dash");
  };
  const handleLogout=()=>{localStorage.removeItem("fixily_token");setUser(null);nav("home");};

  return(
    <>
      <style>{GS}</style>
      <div style={{minHeight:"100vh",background:C.bg,color:C.text,display:"flex",flexDirection:"column"}}>
        <Navbar view={view} setView={nav} user={user} onLogout={handleLogout} setAuthModal={setAuthModal} siteConfig={siteConfig}/>
        <main style={{flex:1}}>
          {view==="home"       &&<HomePage       setView={nav} setFilterCat={setFilterCat} setAuthModal={setAuthModal}/>}
          {view==="artisans"   &&<ArtisansPage   setView={nav} setSelectedArtisan={setSelectedArtisan} filterCat={filterCat} setFilterCat={setFilterCat} user={user} setAuthModal={setAuthModal}/>}
          {view==="profile"    &&<ProfilePage    artisan={selectedArtisan} setView={nav} user={user} setAuthModal={setAuthModal} setToast={setToast}/>}
          {view==="pricing"    &&<PricingPage    setAuthModal={setAuthModal} siteConfig={siteConfig}/>}
          {view==="contact"    &&<ContactPage    cfg={siteConfig}/>}
          {view==="dashboard"  &&(user?.type==="artisan"?<ArtisanDash user={user} setUser={setUser} setToast={setToast}/>:<div style={{padding:48,textAlign:"center",color:C.muted}}>Connectez-vous en tant qu'artisan.</div>)}
          {view==="client-dash"&&(user?.type==="client"?<ClientDash user={user} setUser={setUser} setView={nav} setToast={setToast}/>:<div style={{padding:48,textAlign:"center",color:C.muted}}>Connectez-vous en tant que client.</div>)}
          {view==="fixily-admin-2025" &&(user?.type==="admin"?<AdminDash siteConfig={siteConfig} setSiteConfig={setSiteConfig} setToast={setToast}/>:<div style={{padding:48,textAlign:"center",color:C.red}}>Accès administrateur requis.</div>)}
        </main>
        <Footer setView={nav} cfg={siteConfig}/>
      </div>
      {authModal&&<AuthModal mode={authModal} onClose={()=>setAuthModal(null)} onAuth={handleAuth}/>}
      <Toast msg={toast?.msg} type={toast?.type}/>
    </>
  );
}
