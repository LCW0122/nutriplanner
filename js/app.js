/* Planner app logic. Data comes from data/library.js (window.PLANNER_DATA). */
(function(){
'use strict';
var $=function(s){return document.querySelector(s)};
var esc=function(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})};
var rand=function(a){return a[Math.floor(Math.random()*a.length)]};
var pad=function(n){return n<10?'0'+n:''+n};
var ymd=function(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())};
var parse=function(s){var p=s.split('-');return new Date(+p[0],+p[1]-1,+p[2])};
var addDays=function(d,n){return new Date(d.getFullYear(),d.getMonth(),d.getDate()+n)};
var monOf=function(d){return addDays(d,-((d.getDay()+6)%7))};
var WD=['週一','週二','週三','週四','週五','週六','週日'],WDS=['一','二','三','四','五','六','日'];
var TYPES={plan:{n:'Plan',full:'Plan Day',q:3,l:'P'},low:{n:'Low Carb',full:'Low Carb Day',q:2,l:'L'},rest:{n:'Rest',full:'Rest Day',q:2,l:'R'}};
var KEYS=['plan','low','rest'];
var SLOTS_B=['早餐','午餐','晚餐'],SLOTS_R=['隨便','早餐','午餐','晚餐'];
var OILS=['特級初榨橄欖油','牛油果油'];
var MORDER=['steam','fry','roast','stew','bake'];
var MN={steam:'清蒸',fry:'輕炒',roast:'烤',stew:'燉',bake:'焗'};
var CK={fish:[8,5,12,12,12],chicken:[18,8,25,30,25],shell:[5,3,8,8,8],pork:[15,6,18,40,22],red:[15,6,18,50,22],tofu:[8,5,15,15,15],bean:[10,8,15,25,15],egg:[10,4,10,12,10],can:[5,2,8,6,8]};


/* ---------- food library bindings ---------- */
var D=window.PLANNER_DATA;
var PROTEINS=D.proteins,VEGS=D.vegs,STARCH=D.starch,ADDONS=D.addons,FRUITS=D.fruits,FRUITS_R=D.fruitsRest,SNACKS=D.snacks,DEF_BOOST=D.defBoost,EAT_REST=D.eatRest,EAT_LOW=D.eatLow,AVOID=D.avoid;
var BOOSTABLE=[{id:'banana',n:'香蕉'},{id:'chicken',n:'雞肉（雞胸、雞髀）'}].concat(PROTEINS.filter(function(p){return !p.only}),VEGS,STARCH.filter(function(s){return s.id!=='none'}),ADDONS.filter(function(a){return !a.bfonly}));
var by=function(a,id){for(var i=0;i<a.length;i++)if(a[i].id===id)return a[i]};

/* ---------- storage ---------- */
var KEY='planner.v2';
var DB={days:{},meas:{},boost:DEF_BOOST.slice(),off:['noodle']};
var PH={},idb=null,MIG=[];
function idbOpen(cb){try{var r=indexedDB.open('planner-photos',1);r.onupgradeneeded=function(){r.result.createObjectStore('p')};r.onsuccess=function(){idb=r.result;cb()};r.onerror=function(){cb()}}catch(e){cb()}}
function photoAll(cb){if(!idb)return cb();try{var rq=idb.transaction('p').objectStore('p').openCursor();rq.onsuccess=function(){var c=rq.result;if(c){PH[c.key]=c.value;c.continue()}else cb()};rq.onerror=function(){cb()}}catch(e){cb()}}
function photoPut(id,data){PH[id]=data;if(!idb)return;try{idb.transaction('p','readwrite').objectStore('p').put(data,id)}catch(e){}}
function photoDel(id){delete PH[id];if(!idb)return;try{idb.transaction('p','readwrite').objectStore('p').delete(id)}catch(e){}}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(DB))}catch(e){toast('儲存唔到，瀏覽器可能封鎖咗本機儲存')}}
function loadDB(){
 try{var r=JSON.parse(localStorage.getItem(KEY)||'null');if(r){DB.days=r.days||{};DB.meas=r.meas||{};DB.boost=r.boost||DB.boost;DB.off=r.off||DB.off;return}}catch(e){}
 try{var o=JSON.parse(localStorage.getItem('planner.v1')||'null');if(o&&o.weekStart&&o.days){var ws=parse(o.weekStart);o.days.forEach(function(d,i){if(!d||(!d.type&&!d.meals.length))return;var k=ymd(addDays(ws,i));DB.days[k]={type:d.type,meals:d.meals.map(function(m){var pid=null;if(m.photo){pid='p'+m.id;PH[pid]=m.photo;MIG.push([pid,m.photo])}return{id:m.id,t:m.t,slot:m.slot,name:m.name,feel:m.feel,note:m.note||'',photoId:pid}})}});persist()}}catch(e){}}
var tt;function toast(m){var el=$('#toast');if(!el)return;el.textContent=m;el.hidden=false;clearTimeout(tt);tt=setTimeout(function(){el.hidden=true},2400)}

/* ---------- state ---------- */
var NOW=new Date(),TODAY=ymd(NOW),WS=monOf(NOW);
var S={page:'today',sel:TODAY,rnd:{type:null,slot:'隨便'},bld:{slot:'午餐',protein:null,veg:null,starch:null,addons:[],custom:[]},last:'random',card:null,pending:null,draft:{photo:null,bloat:null,energy:null,crave:null,note:'',name:'',slot:(function(){var h=new Date().getHours();return h<11?'早餐':h<16?'午餐':h<21?'晚餐':'小食'})()},warn:null,eatInfo:false,open:{},
 cal:{y:NOW.getFullYear(),m:NOW.getMonth()+1,sel:TODAY},rv:ymd(WS),vs:{from:ymd(addDays(NOW,-27)),to:TODAY,show:false},bk:{text:'',confirm:false,msg:''},lib:false,addBoost:false};
var weekDays=function(){var a=[];for(var i=0;i<7;i++)a.push(ymd(addDays(WS,i)));return a};
var getDay=function(k){return DB.days[k]||{type:null,meals:[]}};
var ensureDay=function(k){if(!DB.days[k])DB.days[k]={type:null,meals:[]};return DB.days[k]};
var dlabel=function(k){var d=parse(k);return(d.getMonth()+1)+'/'+d.getDate()};
var wdOf=function(k){return WD[(parse(k).getDay()+6)%7]};
var isOn=function(x){return DB.off.indexOf(x.id)<0};
var enabled=function(a){return a.filter(isOn)};
var boosted=function(x){return DB.boost.indexOf(x.id)>-1||(x.id==='chickb'||x.id==='chickl')&&DB.boost.indexOf('chicken')>-1};
function wpick(a){if(!a.length)return null;var w=a.map(function(x){var b=boosted(x)?3:1;if(x.second)b*=.15;return b}),t=w.reduce(function(s,v){return s+v},0),r=Math.random()*t;for(var i=0;i<a.length;i++){r-=w[i];if(r<=0)return a[i]}return a[a.length-1]}

/* ---------- allowed sets (builder) ---------- */
function allowed(g,it){var bf=S.bld.slot==='早餐',t=getDay(S.sel).type;if(!isOn(it))return'hide';
 if(g==='protein'){if(bf)return it.bf?'ok':'hide';return it.only?'hide':'ok'}
 if(g==='veg')return bf?'hide':'ok';
 if(g==='starch'){if(bf){if(!it.bf)return'hide';if(t==='low'&&it.id!=='none')return'hide';return'ok'}if(t==='low'&&!it.lc)return'hide';return'ok'}
 if(g==='addon'){if(bf)return it.bf?'ok':'hide';return it.bfonly?'hide':'ok'}}
function prune(){var b=S.bld;[['protein',PROTEINS],['veg',VEGS],['starch',STARCH]].forEach(function(g){if(b[g[0]]){var it=by(g[1],b[g[0]]);if(!it||allowed(g[0],it)!=='ok')b[g[0]]=null}});b.addons=b.addons.filter(function(id){var it=by(ADDONS,id);return it&&allowed('addon',it)==='ok'})}
function builderReady(){var b=S.bld;return !!(getDay(S.sel).type&&b.protein&&b.starch&&(b.slot==='早餐'||b.veg))}

/* ---------- recipe generation ---------- */
function bfCard(type,slot,any){var ex=rand(type==='low'?[1,2]:[1,2,3]),c={src:'random',type:type,slot:slot,any:any,veg:null,starch:'none',addons:[],method:'steam',oil:rand(OILS)};
 if(ex===1){c.protein='egg';c.addons=['avo']}
 else if(ex===2){c.protein=rand(['ctuna','csalmon','csard'])}
 else{c.protein='egg';c.starch=rand(['sweet','corn'])}
 return c}
function makeRandom(type,slot){var any=slot==='隨便';if(any)slot=rand(['午餐','晚餐']);
 if(slot==='早餐')return bfCard(type,slot,any);
 var fruit=(DB.boost.indexOf('banana')>-1&&Math.random()<.3)?'香蕉半條':rand(FRUITS);
 if(type==='rest'&&Math.random()<.4)return{src:'random',type:type,slot:slot,any:any,eat:rand(EAT_REST),fruit:fruit};
 if(type==='low'&&Math.random()<.25)return{src:'random',type:type,slot:slot,any:any,eat:rand(EAT_LOW),fruit:fruit};
 var vegDinner=type==='plan'&&slot==='晚餐'&&Math.random()<.2;
 var pool=enabled(PROTEINS).filter(function(p){return !p.only&&(!vegDinner||p.v)});
 if(!pool.length)pool=enabled(PROTEINS).filter(function(p){return !p.only});
 var p=wpick(pool),sid='none',sp=enabled(STARCH);
 if(type==='plan'){if(slot==='晚餐'||Math.random()<.5){var sa=sp.filter(function(s){return !s.lc&&!s.warn});sid=(wpick(sa)||{id:'none'}).id}}
 else if(type==='low'){sid=Math.random()<.3?rand(['konjac','shirataki']):'none';if(!isOn(by(STARCH,sid)))sid='none'}
 else{var ra=sp.filter(function(s){return !s.warn&&s.id!=='none'});sid=(wpick(ra)||{id:'none'}).id}
 var ad=[];if(Math.random()<.35){var ap=enabled(ADDONS).filter(function(a){return !a.bfonly&&!a.bf||a.id==='avo'});var a1=wpick(ap);if(a1)ad.push(a1.id)}
 var v=wpick(enabled(VEGS));
 return{src:'random',type:type,slot:slot,any:any,protein:p.id,veg:v.id,starch:sid,addons:ad,method:rand(MORDER),oil:rand(OILS),fruit:fruit,vegDinner:vegDinner&&!!p.v}}
function fromBuilder(){var b=S.bld,t=getDay(S.sel).type;return{src:'builder',type:t,slot:b.slot,protein:b.protein,veg:b.slot==='早餐'?null:b.veg,starch:b.starch,addons:b.addons.slice(),custom:b.custom.slice(),method:'steam',oil:rand(OILS),vegDinner:t==='plan'&&b.slot==='晚餐'&&!!by(PROTEINS,b.protein).v}}
function cookStep(p,m,oil){var mi=MORDER.indexOf(m),t=(CK[p.c]||CK.tofu)[mi],c=p.c;
 if(c==='egg'){return[ '雞蛋加 1.5 倍溫水拌勻，隔水細火蒸 10 分鐘成水蛋。','細火用 1 茶匙'+oil+'煎成荷包蛋或炒蛋，約 4 分鐘。','倒入小焗碗，焗爐 180°C 焗 10 分鐘。','隔水燉蛋 12 分鐘至凝固。','倒入小焗碗，焗爐 180°C 焗 10 分鐘。'][mi]}
 return[ '隔水大火蒸 '+t+' 分鐘'+(c==='fish'?'至魚肉剛熟，倒走蒸魚水':c==='chicken'?'，戳到無血水為止':'至熟透')+'。','鑊燒熱，加 1 茶匙'+oil+'，中火快炒 '+t+' 分鐘'+(c==='chicken'||c==='pork'||c==='red'?'至熟透，肉心唔可以見紅':'')+'。','焗爐預熱 200°C，掃少少'+oil+'，烤 '+t+' 分鐘，中途反轉一次。','加薑片同少量水，細火燉 '+t+' 分鐘至軟腍。','焗爐 180°C，用錫紙包好焗 '+t+' 分鐘。'][mi]}
function derive(c){
 if(c.eat)return{title:c.eat.t,time:'外食',emoji:c.eat.e,por:c.eat.por,steps:c.eat.steps,tags:['外食改法','少醬汁'],eat:1,noMethod:1,fruit:c.fruit};
 var p=by(PROTEINS,c.protein),s=by(STARCH,c.starch),v=c.veg?by(VEGS,c.veg):null,m=c.method,oil=c.oil,mi=MORDER.indexOf(m),low=c.type==='low',steps=[],por=[],tags=[];
 var custom=(c.custom||[]);
 if(c.slot==='早餐'){
  var addN=c.addons.map(function(id){return by(ADDONS,id)});var parts=[];
  if(s.id!=='none')parts.push(s.n);parts.push(p.c==='egg'?'烚蛋':p.n);addN.forEach(function(a){parts.push(a.id==='egg2'?'烚蛋':a.n)});
  parts=parts.filter(function(x,i){return parts.indexOf(x)===i});
  var title=parts.join('＋');
  if(p.c==='egg'||addN.some(function(a){return a.id==='egg2'}))steps.push('雞蛋放入滾水，水再滾後煮約 8 分鐘成烚蛋，過冷河後去殼。');
  if(p.c==='can')steps.push(p.n+'瀝走水或油，加檸檬汁同胡椒。');
  if(s.id==='sweet')steps.push('蕃薯連皮洗淨，蒸 20 分鐘至軟。');if(s.id==='corn')steps.push('粟米連衣蒸或煮 10 分鐘。');
  if(c.addons.indexOf('avo')>-1)steps.push('牛油果切半，去核，加少許檸檬汁同胡椒。');
  steps.push('用胡椒、檸檬調味，唔加糖、唔用重醬油。');
  por.push(p.c==='egg'?'雞蛋 1–2 隻':p.n+' 1 罐');if(s.id!=='none')por.push(s.por);addN.forEach(function(a){if(a.id!=='egg2')por.push(a.por)});
  if(p.deep)tags.push('抗發炎');if(low||s.id==='none')tags.push('穩血糖');tags.push('少油');tags.push('無醬油');
  var em=(p.c==='can'?'🥫':'🥚')+(c.addons.indexOf('avo')>-1?'🥑':'')+(s.e||'');
  return{title:title,time:'約 15 分鐘',emoji:em,por:por,steps:steps,tags:tags,fruit:c.fruit,noMethod:1}}
 var cold=p.c==='cold';
 var title=(cold?p.n:MN[m]+p.n)+'・'+v.n+(s.id==='none'?'':'・'+(s.t||s.n));
 var pm;if(p.v&&p.c!=='egg')pm=p.n+' 1–2 碗';else if(p.c==='egg')pm=p.id==='eggw'?'蛋白 2–3 隻':'雞蛋 1–2 隻';else if(p.c==='red')pm=p.n+' 1 個手掌（次選，少食）';else pm=p.n+' 1–2 個手掌';
 por.push(pm);por.push(v.n+'不限'+(low?'（份量加倍）':''));por.push(s.por);c.addons.forEach(function(id){por.push(by(ADDONS,id).por)});custom.forEach(function(x){por.push(x)});
 var prep={fish:p.n+'抹乾，修走多餘脂肪，用薑絲、胡椒同少量檸檬汁醃 10 分鐘。',chicken:p.n+'去走皮同可見脂肪，用薑、蒜蓉、胡椒同檸檬汁醃 15 分鐘。',shell:p.n+'洗淨抹乾（蝦去殼去腸），用薑、蒜蓉、胡椒醃 5 分鐘。',pork:p.n+'切走可見肥膏，用薑、胡椒同檸檬汁醃 15 分鐘，少用梳打粉。',red:p.n+'切走可見脂肪（鴨、鵝去皮），用薑、胡椒醃 15 分鐘。',tofu:p.n+'洗淨切好，用薑絲、胡椒調味。',bean:p.n+'瀝乾沖洗。',egg:'雞蛋打入碗，加胡椒，唔加糖。',cold:p.n+'拌勻，可加蔥花同少量檸檬汁'+(p.note?'（'+p.note+'）':'')+'。'}[p.c];
 steps.push(prep);if(!cold)steps.push(cookStep(p,m,oil));
 if(s.id!=='none'){var sm=s.m;var st=s.rice?s.por+'，外食份量，唔好食多。':s.lc?s.por+'，滾水灼 2 分鐘，瀝乾墊底，代替澱粉。':s.id==='chestnut'?'栗子（原粒無糖）蒸熱。':s.n+'洗淨處理，蒸 '+sm+' 分鐘至軟，份量：'+s.por+'。';steps.push(st)}
 var vs;if(v.raw===2||(v.raw===1&&m==='steam')||cold)vs=v.n+'切件，加檸檬汁、胡椒同 1 茶匙亞麻籽油涼拌。亞麻籽油只用涼拌，唔好加熱。';
 else if(m==='steam')vs=v.n+'洗淨切段，用滾水灼 2 分鐘至翠綠，瀝乾。';
 else if(m==='fry')vs='鑊中加 1 茶匙'+oil+'爆香蒜片，'+v.n+'輕炒 2–3 分鐘，加少許水焗軟，唔加糖同重醬油。';
 else if(m==='stew')vs=v.n+'洗淨切段，最後 10 分鐘放入同燉。';
 else vs=v.n+'同'+p.n+'一齊放入，最後 8–10 分鐘同焗。';
 steps.push(vs);
 var ad=c.addons.map(function(id){return by(ADDONS,id).por}).concat(custom);if(ad.length)steps.push('加上：'+ad.join('、')+'。');
 steps.push('用薑、蔥、蒜、胡椒、檸檬調味，唔加糖、唔用重醬油，上碟。');
 if(p.deep)tags.push('抗發炎');if(low||s.id==='none'||s.lc)tags.push('穩血糖');tags.push('少油');tags.push('無醬油');
 if(c.vegDinner)tags.push('素食');if(p.second)tags.push('次選');
 var cm=CK[p.c]?CK[p.c][mi]:5,tm=Math.round((10+Math.max(cold?0:cm,s.m||0))/5)*5;
 var pe={fish:'🐟',chicken:'🍗',shell:'🦐',pork:'🥩',red:'🥩',tofu:'🥢',bean:'🫘',egg:'🥚',cold:'🫘',can:'🥫'}[p.c]||'🍽️';
 return{title:title,time:'約 '+tm+' 分鐘',emoji:pe+(v.e||'🥬')+(s.e||''),por:por,steps:steps,tags:tags,fruit:c.fruit,noMethod:cold}}

/* ---------- helpers for stats ---------- */
function feelText(f){var o=[];if(!f)return'';if(f.energy!=null)o.push(f.energy>=3?'精力好':f.energy<=1?'精力低':'');if(f.bloat!=null)o.push(f.bloat>=3?'腹脹明顯':f.bloat<=1?'腹脹低':'');if(f.crave!=null)o.push(f.crave>=3?'甜食慾望強':f.crave<=1?'甜食慾望低':'');return o.filter(Boolean).slice(0,2).join(' · ')}
function avg(a){return a.length?a.reduce(function(s,v){return s+v},0)/a.length:null}
function fmt(v){return v==null?'未有記錄':(Math.round(v*10)/10)}
function range(from,to){var a=[],d=parse(from),e=parse(to),n=0;while(d<=e&&n<400){a.push(ymd(d));d=addDays(d,1);n++}return a}
function stats(keys){var cnt={plan:0,low:0,rest:0},f={bloat:[],energy:[],crave:[]},byT={plan:[],low:[],rest:[]},meals=0;
 keys.forEach(function(k){var d=DB.days[k];if(!d)return;if(d.type)cnt[d.type]++;d.meals.forEach(function(m){meals++;if(m.feel){['bloat','energy','crave'].forEach(function(x){if(m.feel[x]!=null)f[x].push(m.feel[x])});if(d.type&&m.feel.energy!=null)byT[d.type].push(m.feel.energy)}})});
 return{cnt:cnt,meals:meals,bloat:avg(f.bloat),energy:avg(f.energy),crave:avg(f.crave),eT:{plan:avg(byT.plan),low:avg(byT.low),rest:avg(byT.rest)}}}
function measRange(keys){var a=Object.keys(DB.meas).filter(function(k){return k>=keys[0]&&k<=keys[keys.length-1]}).sort();return a.length?{first:DB.meas[a[0]],last:DB.meas[a[a.length-1]],n:a.length}:null}
var isoWeekOf=function(k){return ymd(monOf(parse(k)))};

/* ---------- nav ---------- */
/* Desktop top bar lists every page; the phone tab bar keeps five and folds 回顧, 守則, 設定 under 更多. */
var PAGES=[['today','今日'],['gen','生成'],['log','記錄'],['cal','月曆'],['review','回顧'],['guide','守則'],['settings','設定']];
var TABS=[['today','今日'],['gen','生成'],['log','記錄'],['cal','月曆'],['more','更多']];
var MORE_PAGES=['more','review','guide','settings'];
var ALL_PAGES=PAGES.map(function(x){return x[0]}).concat('more');
function navBtn(p,on){return'<button class="tn" data-act="nav" data-p="'+p[0]+'"'+(on?' aria-current="page"':'')+'>'+p[1]+'</button>'}
function renderNav(){$('#topnav').innerHTML=PAGES.map(function(p){return navBtn(p,S.page===p[0])}).join('');
 $('#tabs').innerHTML=TABS.map(function(p){return navBtn(p,p[0]==='more'?MORE_PAGES.indexOf(S.page)>-1:S.page===p[0])}).join('')}
function showPage(p,noScroll){S.page=p;ALL_PAGES.forEach(function(x){var el=$('#page-'+x);if(el)el.hidden=x!==p});$('#barwrap').hidden=p!=='gen';document.body.setAttribute('data-page',p);
 try{if(location.hash!=='#'+p)history.replaceState(null,'','#'+p)}catch(e){}
 renderNav();renderPage();if(!noScroll)window.scrollTo(0,0)}
function renderMore(){var R=[['review','回顧','每週回顧、體重腰圍趨勢、覆診摘要'],['guide','守則','營養師守則、要避免嘅食物、補充品時間'],['settings','設定','備份還原、本月多吃、食材庫']];
 $('#page-more').innerHTML='<h1 class="ph">更多</h1><div class="card"><div class="stack" style="margin-top:0">'+R.map(function(r){return'<button class="morerow" data-act="nav" data-p="'+r[0]+'" data-fid="mr'+r[0]+'"><span class="sec" style="margin:0">'+r[1]+'</span><span class="help">'+r[2]+'</span></button>'}).join('')+'</div></div>'}
function renderPage(){var p=S.page;if(p==='today'||p==='gen'||p==='log')renderAll();else if(p==='cal')renderCal();else if(p==='review')renderReview();else if(p==='guide')renderGuide();else if(p==='more')renderMore();else renderSettings()}

/* ---------- today ---------- */
function renderBoard(){
 var days=weekDays(),cnt={plan:0,low:0,rest:0};days.forEach(function(k){var t=getDay(k).type;if(t)cnt[t]++});
 var h='<h2 id="h-board" class="eyebrow">本週已標</h2><div class="quotas">'+KEYS.map(function(k){var q=TYPES[k].q;return'<div class="quota q-'+k+'"><span>'+TYPES[k].n+' '+cnt[k]+'/'+q+'</span><div class="bar"><i style="width:'+Math.min(cnt[k]/q,1)*100+'%"></i></div></div>'}).join('')+'</div>';
 h+='<p class="help" style="margin-top:16px">揀一天，再揀類型（未揀 = 空白）</p><div class="days">';
 days.forEach(function(k,i){var d=getDay(k),n=d.meals.length,lab=d.type?TYPES[d.type].n:(k===S.sel?'選定':'空白');
  h+='<button class="day '+(d.type||'')+'" data-act="day" data-k="'+k+'" data-fid="day'+i+'" aria-pressed="'+(k===S.sel)+'" aria-label="'+dlabel(k)+' '+WD[i]+'，'+(d.type?TYPES[d.type].full:'未標類型')+(n?'，已記 '+n+' 餐':'')+'"><small>'+WD[i]+'</small><b>'+parse(k).getDate()+'</b><span class="lab">'+lab+'</span><span class="dot'+(n?' on':'')+'"></span></button>'});
 h+='</div>';var t=getDay(S.sel).type;
 h+='<div class="dayline">'+dlabel(S.sel)+' '+wdOf(S.sel)+' · '+(t?TYPES[t].full:'未標類型')+'</div><div class="row" style="margin-top:8px"><span class="help">呢日當：</span>'+KEYS.map(function(k){return'<button class="chip '+k+'" data-act="settype" data-k="'+k+'" data-fid="st'+k+'" aria-pressed="'+(t===k)+'">'+TYPES[k].n+'</button>'}).join('')+(t?'<button class="btn link" data-act="clrtype" data-fid="clr">清除</button>':'')+'</div>';
 h+='<p class="help" style="margin-top:12px">'+(t==='plan'?'正常日：早餐三選一；午餐每星期 2–3 日有澱粉；晚餐有澱粉。':t==='low'?'特別日：午晚餐無澱粉，肉類 1–2 個手掌，蔬菜份量加倍。':t==='rest'?'放假日：唔好略餐，外食用外食改法，飯 4 湯匙。':'未標類型都可以用隨機生成。')+'</p>';
 $('#board').innerHTML=h}
function renderRandom(){var r=S.rnd;
 var h='<h2 id="h-random">冇諗法？隨機出一餐</h2><p class="help">只揀類型，唔使揀魚、菜、澱粉</p><div class="stack"><div class="types">'+KEYS.map(function(k){return'<button class="chip '+k+'" data-act="rtype" data-k="'+k+'" data-fid="rt'+k+'" aria-pressed="'+(r.type===k)+'">'+TYPES[k].full+'</button>'}).join('')+'</div>';
 h+='<div class="row"><span class="help">餐次</span>'+SLOTS_R.map(function(s){return'<button class="chip sm" data-act="rslot" data-s="'+s+'" data-fid="rs'+s+'" aria-pressed="'+(r.slot===s)+'">'+s+'</button>'}).join('')+'</div>';
 h+='<button class="btn primary inline-only" data-act="rgen" data-fid="rgen"'+(r.type?'':' disabled')+'>隨機生成一款</button>'+(r.type?'':'<p class="help">先揀一個類型。</p>')+'</div>';
 $('#random').innerHTML=h}
function groupHtml(g,list,sel,act,multi,sub){var out='',cur=null,t=getDay(S.sel).type;
 list.forEach(function(it){var a=allowed(g,it);if(a==='hide')return;
  if(sub&&it.g!==cur){if(cur!==null)out+='</div>';cur=it.g;out+='<div class="eyebrow" style="margin-top:8px;font-weight:400">'+it.g+'</div><div class="group" role="group">'}
  var on=multi?sel.indexOf(it.id)>-1:sel===it.id;
  out+='<button class="choice" data-act="'+act+'" data-id="'+it.id+'" data-fid="'+g+it.id+'" aria-pressed="'+on+'">'+it.n+(it.warn?'':'')+'</button>'});
 if(sub&&cur!==null)out+='</div>';return sub?out:'<div class="group" role="group">'+out+'</div>'}
function renderBuilder(){var t=getDay(S.sel).type,b=S.bld,el=$('#builder'),bf=b.slot==='早餐';el.classList.toggle('locked',!t);
 var h='<h2 id="h-builder">自己揀這一餐</h2>';
 if(!t)h+='<div class="warn" style="margin-top:12px">請先揀今日係邊種日子：去「今日」揀日子，再標 Plan、Low Carb 或 Rest，就可以自己揀。<div class="row" style="margin-top:8px"><button class="btn" data-act="nav" data-p="today" data-fid="gototoday">去「今日」揀類型</button></div></div>';
 h+='<div class="lockable"><div class="stack"><div class="row"><span class="help">餐次</span>'+SLOTS_B.map(function(s){return'<button class="chip sm" data-act="bslot" data-s="'+s+'" data-fid="bs'+s+'" aria-pressed="'+(b.slot===s)+'">'+s+'</button>'}).join('')+'</div>';
 h+='<p class="help">模式跟隨上面已標的那一日'+(t?'：'+TYPES[t].full:'')+(bf?'。早餐只出三款營養師例子。':'')+'</p></div><hr class="rule">';
 h+='<div class="eyebrow">蛋白質 · 揀 1</div><div class="stack" style="margin-top:8px">'+groupHtml('protein',PROTEINS,b.protein,'bpick',0,1)+'</div>';
 if(!bf)h+='<hr class="rule"><div class="eyebrow">菜 · 揀 1</div><div class="stack" style="margin-top:8px">'+groupHtml('veg',VEGS,b.veg,'bpick',0,0)+'</div>';
 h+='<hr class="rule"><div class="eyebrow">澱粉 · 揀 1</div>'+(t==='low'?'<div class="warn" style="margin-top:8px">Low Carb 日唔食澱粉，只可以用蒟蒻麵、芋絲或不加。</div>':'')+'<div class="stack" style="margin-top:8px">'+groupHtml('starch',STARCH,b.starch,'bpick',0,0)+'</div>';
 h+='<hr class="rule"><div class="eyebrow">可加 · 可多選，可唔選</div><div class="stack" style="margin-top:8px">'+groupHtml('addon',ADDONS,b.addons,'baddon',1,0);
 h+='<div class="row">'+b.custom.map(function(x,i){return'<button class="choice" aria-pressed="true" data-act="rmcustom" data-i="'+i+'" data-fid="cu'+i+'">'+esc(x)+' ×</button>'}).join('')+'</div>';
 h+='<div class="row"><input class="in" id="custom" placeholder="其他食材（自己打）" style="flex:1 1 160px;width:auto"><button class="btn" data-act="addcustom" data-fid="addcu">加入</button></div>';
 if(S.warn)h+='<div class="warn"><div style="font-weight:600">提提你</div>'+esc(S.warn.item)+S.warn.reason+'，營養師建議避免。想改用'+S.warn.suggest+'嗎？<div class="row" style="margin-top:8px"><button class="btn" data-act="warnfix" data-fid="wfix">改食材</button><button class="btn" data-act="warnkeep" data-fid="wkeep">照揀</button></div></div>';
 h+='</div>';
 if(t==='rest')h+='<div class="stack"><div><button class="chip sm" data-act="eatinfo" data-fid="eat" aria-pressed="'+(!!S.eatInfo)+'">外食改法</button></div>'+(S.eatInfo?'<div class="warn">粉麵改菜底或米製品；燒味去皮，菜唔淋蠔油，醬汁另上，飯 4 湯匙；西餐扒餐配沙律菜，唔食薯條同麵包。</div>':'')+'</div>';
 h+='<hr class="rule"><details class="fold"><summary>小食同水果提示（文字）</summary><p class="help">小食每日 2 次：'+SNACKS.join('、')+'。</p><p class="help">水果每日最少 1 份：'+FRUITS.join('、')+'。少食：芒果、榴槤、龍眼、荔枝。</p></details></div>';
 h+='<div class="stack"><button class="btn primary inline-only" data-act="bgen" data-fid="bgen"'+(builderReady()?'':' disabled')+'>按我揀嘅生成菜式</button></div>';
 el.innerHTML=h}
function renderResult(){var c=S.card,el=$('#result');
 if(!c){el.innerHTML='<div class="empty">揀咗之後撳生成，菜式會喺呢度出現。</div>';return}
 var d=derive(c),acc=!!S.pending;var q='https://www.google.com/search?tbm=isch&q='+encodeURIComponent(d.title.replace(/外食改法・|外食例子・/,''));
 var h='<div class="card"><div class="eyebrow">'+(c.src==='random'?'隨機建議':'自己揀')+' · '+TYPES[c.type].full+' · '+(c.any?'隨便 · ':'')+c.slot+'</div><h2 class="title">'+esc(d.title)+'</h2><div class="help">'+esc(d.time)+'</div><hr class="rule"><div class="emoji" data-slot="ref" role="img" aria-label="示意圖">'+d.emoji+'</div><div class="fruit" style="margin-top:4px">示意圖，非實拍</div><div class="tags" style="margin-top:8px">'+d.tags.map(function(t){return'<span class="tag">'+t+'</span>'}).join('')+'</div>';
 h+='<hr class="rule"><div class="sec">份量</div><div>'+d.por.map(esc).join(' · ')+'</div>'+(d.fruit?'<div class="help" style="margin-top:4px">水果提示：'+esc(d.fruit)+'</div>':'')+'<hr class="rule"><div class="sec">做法</div><ol class="steps">'+d.steps.map(function(s){return'<li>'+esc(s)+'</li>'}).join('')+'</ol>';
 h+='<div class="actions"><button class="btn primary" data-act="accept" data-fid="accept">'+(acc?'已揀，去記錄':'呢款得')+'</button>'+(c.src==='random'?'<button class="btn" data-act="rgen" data-fid="reroll">再隨機</button>':'')+(d.noMethod?'':'<button class="btn" data-act="method" data-fid="method">換烹調法</button>')+(d.eat?'':'<button class="btn" data-act="edit" data-fid="edit">改其中一樣</button>')+'<button class="btn" data-act="copy" data-fid="copy">複製</button><a class="btn" href="'+q+'" target="_blank" rel="noopener">睇參考相 ↗</a></div></div>';
 el.innerHTML=h}
function sliderRow(k,label,a,b){var v=S.draft[k];return'<label class="slider'+(v==null?' untouched':'')+'" data-k="'+k+'">'+label+'<div><input type="range" min="0" max="4" step="1" id="sl-'+k+'" value="'+(v==null?2:v)+'" data-fid="sl'+k+'"><div class="ends"><span>'+a+'</span><span>'+b+'</span></div></div></label>'}
function mealRows(list,thumbs){return list.slice().sort(function(a,b){return a.t<b.t?-1:1}).map(function(m){var ft=feelText(m.feel),ph=m.photoId&&PH[m.photoId];return'<div class="meal"><time>'+m.t+'</time><span>'+esc(m.slot)+'</span><div class="m">'+esc(m.name)+(ft?'<div class="fb">'+ft+'</div>':'')+(m.note?'<div class="fb">'+esc(m.note)+'</div>':'')+(thumbs&&ph?'<div class="thumbs"><img src="'+ph+'" alt="餐相"></div>':'')+'</div>'+(thumbs===2?'<span></span>':'<button class="x" data-act="rm" data-id="'+m.id+'" data-fid="rm'+m.id+'" aria-label="刪除這一餐">×</button>')+'</div>'}).join('')}
function renderLog(){var d=getDay(S.sel),n=d.meals.length,pend=S.pending;
 var h='<div class="row" style="justify-content:space-between"><h2 id="h-log">'+dlabel(S.sel)+' 日誌</h2><span class="help">'+(n>3?'已記 '+n+' 餐':'已記 '+n+'/3 餐')+'</span></div>';
 h+='<p class="help" style="margin-top:4px">'+(pend?'已揀菜式，可以加相片同體感，再儲存。':'食咗乜都可以直接記，唔使揀菜式。')+'</p><hr class="rule">';
 h+='<div class="stack" style="margin-top:0">';
 if(pend){var pd=derive(pend);h+='<div class="sec">'+pend.slot+' · '+esc(pd.title)+'</div>'}
 else{h+='<div class="row"><span class="help">餐次</span>'+['早餐','午餐','晚餐','小食','其他'].map(function(s){return'<button class="chip sm" data-act="qslot" data-s="'+s+'" data-fid="qs'+s+'" aria-pressed="'+(S.draft.slot===s)+'">'+s+'</button>'}).join('')+'</div><label for="qname" class="help">食咗乜</label><input class="in" id="qname" placeholder="例如：蒸魚、菜心、半碗飯" value="'+esc(S.draft.name)+'">'}
 h+='<div class="row" style="align-items:flex-start">'+(S.draft.photo?'<div class="photo"><img src="'+S.draft.photo+'" alt="已選相片"><button data-act="rmphoto" data-fid="rmp" aria-label="移除相片">×</button></div>':'<label class="upload"><input type="file" id="photo" accept="image/*" hidden>＋ 上載相片</label>')+'<span class="help">可以影相或揀相簿相片；未上載都可以儲存</span></div>';
 h+='<div class="row" style="justify-content:space-between"><div class="eyebrow">體感（可唔填）</div><button class="btn link" data-act="rstfeel" data-fid="rstf">重設</button></div>'+sliderRow('bloat','腹脹','無','明顯')+sliderRow('energy','精力','低','好')+sliderRow('crave','甜食慾望','無','強');
 h+='<label for="note" class="help">備註</label><textarea id="note" placeholder="例如：食完好飽、飲咗杯無糖茶">'+esc(S.draft.note)+'</textarea><button class="btn primary" data-act="save" data-fid="save">儲存這一餐</button></div>';
 h+='<hr class="rule"><div class="sec">'+(S.sel===TODAY?'今日已記':dlabel(S.sel)+' 已記')+'</div>'+(n?mealRows(d.meals,1):'<p class="help">未有記錄。</p>');
 $('#log').innerHTML=h}
function dayHead(){var d=getDay(S.sel);return dlabel(S.sel)+' '+wdOf(S.sel)+(d.type?' <span class="pill '+d.type+'">'+TYPES[d.type].full+'</span>':' · 未標類型')}
function renderDaySum(){var d=getDay(S.sel),n=d.meals.length;
 $('#daysum').innerHTML='<h2>'+dayHead()+'</h2><p class="help" style="margin-top:4px">'+(n?'已記 '+n+' 餐':'呢日未有記錄')+'</p>'+(n?'<div style="margin-top:8px">'+mealRows(d.meals,1)+'</div>':'')+'<div class="actions"><button class="btn primary" data-act="nav" data-p="gen" data-fid="tg">生成菜式</button><button class="btn" data-act="nav" data-p="log" data-fid="tl">記錄食咗乜</button></div>'}
function renderCtx(){$('#ctx').innerHTML='<div class="row" style="justify-content:space-between"><div class="sec" style="margin:0">'+dayHead()+'</div><button class="btn link" data-act="nav" data-p="today" data-fid="ctxchg">改日子或類型</button></div>'}
function renderBar(){var b=$('#bar'),r=S.last==='random';b.textContent=r?'隨機生成一款':'按我揀嘅生成菜式';b.disabled=r?!S.rnd.type:!builderReady()}
function renderAll(){var f=document.activeElement&&document.activeElement.getAttribute&&document.activeElement.getAttribute('data-fid');
 renderBoard();renderDaySum();renderCtx();renderRandom();renderBuilder();renderResult();renderLog();renderBar();
 if(f){var n=document.querySelector('[data-fid="'+f+'"]');if(n&&!n.disabled)n.focus({preventScroll:true})}}

/* ---------- calendar ---------- */
function renderCal(){var c=S.cal,n=new Date(c.y,c.m,0).getDate(),lead=(new Date(c.y,c.m-1,1).getDay()+6)%7,cnt={plan:0,low:0,rest:0};
 var h='<h1 class="ph">月曆</h1><div class="card"><div class="nav2"><button class="nb" data-act="calnav" data-n="-1" data-fid="cprev" aria-label="上個月">‹</button><h2>'+c.y+' 年 '+c.m+' 月</h2><button class="nb" data-act="calnav" data-n="1" data-fid="cnext" aria-label="下個月">›</button></div>';
 h+='<div class="cgrid" style="margin-top:12px">'+WDS.map(function(w){return'<div class="wh">'+w+'</div>'}).join('')+'</div><div class="cgrid" style="margin-top:6px">';
 for(var i=0;i<lead;i++)h+='<button class="cc" disabled></button>';
 for(var k=1;k<=n;k++){var key=c.y+'-'+pad(c.m)+'-'+pad(k),d=getDay(key),t=d.type;if(t)cnt[t]++;
  h+='<button class="cc '+(t||'')+(key===TODAY?' today':'')+'" data-act="calsel" data-k="'+key+'" aria-pressed="'+(key===c.sel)+'" aria-label="'+c.m+'月'+k+'日'+(t?'，'+TYPES[t].full:'，未標類型')+(d.meals.length?'，已記 '+d.meals.length+' 餐':'')+'">'+k+'<span class="tl">'+(t?TYPES[t].l:'')+'</span><span class="d'+(d.meals.length?' on':'')+'"></span></button>'}
 h+='</div><div class="leg" style="margin-top:12px"><span><b style="background:var(--plan)"></b>P Plan</span><span><b style="background:var(--low)"></b>L Low Carb</span><span><b style="background:var(--rest)"></b>R Rest</span><span>● 有記餐</span><span>空格 = 未標類型</span></div>';
 h+='<div class="eyebrow" style="margin-top:8px">本月已標  Plan '+cnt.plan+' · Low Carb '+cnt.low+' · Rest '+cnt.rest+'</div></div>';
 var d=getDay(c.sel);h+='<div class="card"><div style="font:600 16px/24px var(--font-sans)">'+dlabel(c.sel)+' '+wdOf(c.sel)+(d.type?' <span class="pill '+d.type+'">'+TYPES[d.type].full+'</span>':' · 未標類型')+(d.meals.length?' · '+d.meals.length+' 餐':'')+'</div>';
 h+=d.meals.length?mealRows(d.meals,2):'<p class="help" style="margin-top:8px">呢日未有記錄'+(d.type?'。':'，亦未標類型。')+'</p>';
 h+='</div>';$('#page-cal').innerHTML=h}

/* ---------- review ---------- */
function chartSvg(){var ks=Object.keys(DB.meas).filter(function(k){var m=DB.meas[k];return m&&(m.kg||m.cm)}).sort();
 if(!ks.length)return'<div class="empty">記錄第一週體重 / 腰圍之後，趨勢圖會喺度出現。</div>';
 var f=parse(ks[0]),idx=ks.map(function(k){return Math.round((parse(k)-f)/604800000)}),last=idx[idx.length-1],start=Math.max(0,last-11),span=last-start+1;
 var items=ks.map(function(k,i){return{k:k,i:idx[i],m:DB.meas[k]}}).filter(function(o){return o.i>=start});
 var X=function(i){return span<=1?160:46+(i-start)/(span-1)*228};
 function ser(key,cls,side){var vals=items.filter(function(o){return o.m[key]}).map(function(o){return o.m[key]});if(!vals.length)return'';var lo=Math.min.apply(null,vals),hi=Math.max.apply(null,vals);if(hi-lo<1){lo-=.5;hi+=.5}var pd=(hi-lo)*.15;lo-=pd;hi+=pd;
  var Y=function(v){return 150-(v-lo)/(hi-lo)*110},s='',segs=[],cur=[];
  items.forEach(function(o){if(!o.m[key])return;if(cur.length&&o.i-cur[cur.length-1].i>1){segs.push(cur);cur=[]}cur.push(o)});if(cur.length)segs.push(cur);
  segs.forEach(function(sg){if(sg.length>1)s+='<polyline class="'+cls+'" points="'+sg.map(function(o){return X(o.i).toFixed(1)+','+Y(o.m[key]).toFixed(1)}).join(' ')+'"/>'});
  items.forEach(function(o){if(o.m[key])s+='<circle class="d'+cls+'" cx="'+X(o.i).toFixed(1)+'" cy="'+Y(o.m[key]).toFixed(1)+'" r="4"/>'});
  [lo+pd,(lo+hi)/2,hi-pd].forEach(function(v){s+='<text class="t" x="'+(side==='l'?0:320)+'" y="'+(Y(v)+3).toFixed(1)+'" text-anchor="'+(side==='l'?'start':'end')+'">'+(Math.round(v*10)/10)+'</text>'});return s}
 var h='<svg class="chart" viewBox="0 0 320 190" role="img" aria-label="體重同腰圍趨勢"><style>.g{stroke:var(--line);stroke-width:1}.t{font:400 10px var(--font-sans);fill:var(--ink-muted)}.w{fill:none;stroke:var(--brand);stroke-width:2.5}.a{fill:none;stroke:var(--ink);stroke-width:2;stroke-dasharray:5 3}.dw{fill:var(--brand)}.da{fill:var(--surface-raised);stroke:var(--ink);stroke-width:2}</style><line class="g" x1="36" y1="40" x2="284" y2="40"/><line class="g" x1="36" y1="95" x2="284" y2="95"/><line class="g" x1="36" y1="150" x2="284" y2="150"/>'+ser('kg','w','l')+ser('cm','a','r');
 items.forEach(function(o,j){if(span<=6||j%2===0)h+='<text class="t" x="'+(X(o.i)-12).toFixed(1)+'" y="176">'+dlabel(o.k)+'</text>'});
 return h+'</svg><div class="row help" style="margin-top:4px"><span><b style="display:inline-block;width:18px;height:3px;background:var(--brand);vertical-align:middle"></b> 體重 kg（左）</span><span><b style="display:inline-block;width:18px;border-top:2px dashed var(--ink);vertical-align:middle"></b> 腰圍 cm（右）</span></div>'}
function summaryText(){var keys=range(S.vs.from,S.vs.to),st=stats(keys),mr=measRange(keys),L=[];
 L.push('Planner 覆診摘要 '+S.vs.from+' 至 '+S.vs.to);L.push('日子類型：Plan '+st.cnt.plan+' 日、Low Carb '+st.cnt.low+' 日、Rest '+st.cnt.rest+' 日；共記 '+st.meals+' 餐');
 L.push('體感平均（0 至 4）：腹脹 '+fmt(st.bloat)+'，精力 '+fmt(st.energy)+'，甜食慾望 '+fmt(st.crave));
 if(mr)L.push('體重 '+(mr.first.kg||'-')+' → '+(mr.last.kg||'-')+' kg；腰圍 '+(mr.first.cm||'-')+' → '+(mr.last.cm||'-')+' cm');
 keys.forEach(function(k){var d=DB.days[k];if(d&&d.meals.length)d.meals.slice().sort(function(a,b){return a.t<b.t?-1:1}).forEach(function(m){L.push(dlabel(k)+' '+m.t+' '+m.slot+' '+m.name+(feelText(m.feel)?'（'+feelText(m.feel)+'）':''))})});return L.join('\n')}
function renderReview(){var ws=S.rv,keys=range(ws,ymd(addDays(parse(ws),6))),st=stats(keys),cur=ws===ymd(WS);
 var h='<h1 class="ph">回顧</h1><div class="card"><div class="nav2"><button class="nb" data-act="rvnav" data-n="-1" data-fid="rprev" aria-label="上一週">‹</button><h2>'+(cur?'本週 ':'')+dlabel(keys[0])+' – '+dlabel(keys[6])+'</h2><button class="nb" data-act="rvnav" data-n="1" data-fid="rnext" aria-label="下一週">›</button></div><div class="stack">';
 KEYS.forEach(function(k){var q=TYPES[k].q,n=st.cnt[k];h+='<div><div class="row" style="justify-content:space-between"><span class="sec">'+TYPES[k].n+'</span><span class="help">'+n+'/'+q+' 日 '+(n>=q?'達標':'未達標')+'</span></div><div class="bar" style="margin-top:4px"><i style="width:'+Math.min(n/q,1)*100+'%;background:var(--'+k+')"></i></div></div>'});
 h+='</div></div><div class="card"><h2>體感平均</h2><div class="stack">';
 [['腹脹','無','明顯',st.bloat],['精力','低','好',st.energy],['甜食慾望','無','強',st.crave]].forEach(function(x){h+='<div><div class="row" style="justify-content:space-between"><span>'+x[0]+'</span><span class="help">'+fmt(x[3])+(x[3]==null?'':' / 4')+'</span></div><div class="bar" style="margin-top:4px"><i style="width:'+(x[3]==null?0:x[3]/4*100)+'%;background:var(--brand)"></i></div><div class="row help" style="justify-content:space-between;margin-top:2px"><span>'+x[1]+'</span><span>'+x[2]+'</span></div></div>'});
 var cmp=KEYS.filter(function(k){return st.eT[k]!=null}).map(function(k){return TYPES[k].n+' 日精力平均 '+fmt(st.eT[k])}).join('；');
 var m=DB.meas[ws],pm=DB.meas[ymd(addDays(parse(ws),-7))],ch=[];if(m&&pm){if(m.kg&&pm.kg)ch.push('體重 '+((m.kg-pm.kg)>0?'+':'')+(Math.round((m.kg-pm.kg)*10)/10)+' kg');if(m.cm&&pm.cm)ch.push('腰圍 '+((m.cm-pm.cm)>0?'+':'')+(Math.round((m.cm-pm.cm)*10)/10)+' cm')}
 h+='</div><p class="help" style="margin-top:12px">'+(cmp?esc(cmp)+'。':'呢週未有體感記錄。')+(ch.length?' 同上週比較：'+ch.join('，')+'。':'')+'</p><p class="help">只描述記錄，唔作診斷。</p></div>';
 var mv=m||{};h+='<div class="card"><h2>體重 / 腰圍</h2><p class="help">每週記錄一次（'+dlabel(ws)+' 開始嗰週）</p><div class="row" style="margin-top:8px;align-items:flex-end"><label class="fld"><span class="eyebrow">體重 kg</span><input class="in" id="mkg" inputmode="decimal" value="'+(mv.kg||'')+'" placeholder="75.0"></label><label class="fld"><span class="eyebrow">腰圍 cm</span><input class="in" id="mcm" inputmode="decimal" value="'+(mv.cm||'')+'" placeholder="84"></label></div><button class="btn primary" style="margin-top:12px" data-act="savemeas" data-fid="smeas">記錄呢週</button><hr class="rule"><div class="sec">趨勢</div>'+chartSvg()+'</div>';
 h+='<div class="card"><h2>覆診摘要</h2><p class="help">揀日期範圍，產生一份畀營養師睇嘅摘要。</p><div class="row" style="margin-top:8px;align-items:flex-end"><label class="fld"><span class="eyebrow">由</span><input class="in" type="date" id="vfrom" value="'+S.vs.from+'"></label><label class="fld"><span class="eyebrow">至</span><input class="in" type="date" id="vto" value="'+S.vs.to+'"></label></div><button class="btn" style="margin-top:12px;width:100%" data-act="vsgen" data-fid="vsgen">產生摘要</button></div>';
 if(S.vs.show){var ks=range(S.vs.from,S.vs.to),s2=stats(ks),mr=measRange(ks);
  h+='<div class="card" id="summary"><div class="row" style="justify-content:space-between"><b style="font:700 20px/28px var(--font-serif)">Planner 覆診摘要</b><span class="help">'+S.vs.from+' 至 '+S.vs.to+'</span></div><hr class="rule"><div class="sec">日子類型</div><div class="row"><span class="pill plan">Plan '+s2.cnt.plan+' 日</span><span class="pill low">Low Carb '+s2.cnt.low+' 日</span><span class="pill rest">Rest '+s2.cnt.rest+' 日</span></div><hr class="rule"><div class="sec">體感平均（0 至 4）</div><dl class="dl"><dt>腹脹</dt><dd>'+fmt(s2.bloat)+'</dd><dt>精力</dt><dd>'+fmt(s2.energy)+'</dd><dt>甜食慾望</dt><dd>'+fmt(s2.crave)+'</dd></dl><hr class="rule"><div class="sec">體重 / 腰圍</div>'+(mr?'<dl class="dl"><dt>體重</dt><dd>'+(mr.first.kg||'-')+' → '+(mr.last.kg||'-')+' kg</dd><dt>腰圍</dt><dd>'+(mr.first.cm||'-')+' → '+(mr.last.cm||'-')+' cm</dd></dl>':'<p class="help">呢段時間未有記錄。</p>')+'<hr class="rule"><div class="sec">記餐（共 '+s2.meals+' 餐）</div>'+(s2.meals?ks.map(function(k){var d=DB.days[k];return d&&d.meals.length?'<div class="help" style="margin-top:6px">'+dlabel(k)+' '+wdOf(k)+(d.type?' · '+TYPES[d.type].n:'')+'</div>'+mealRows(d.meals,2):''}).join(''):'<p class="help">呢段時間未有記餐。</p>')+'<div class="row" style="margin-top:12px"><button class="btn" data-act="vscopy" data-fid="vscopy">複製摘要文字</button></div><p class="help">列印：喺瀏覽器用列印功能（Ctrl / Cmd + P），只會印出呢份摘要。</p></div>'}
 $('#page-review').innerHTML=h}

/* ---------- guide ---------- */
function renderGuide(){var R=[['進食不同種類嘅食物','每日由每個食物組別揀 1–2 樣；忘記食嘅組別可以翌日補回。'],['健康烹調','易潔煮食工具；植物油代替動物油；炒、烤、蒸、燉、焗代替煎炸；去除肉類可見脂肪；用薑、蔥、蒜、胡椒代替鹽同醬油；少用梳打粉醃肉。'],['適量定時進食','3 正餐加 2 小食，唔好因為個人喜好多食或少食。'],['唔好因為外出而略過正餐','只需要輕輕減少早餐同午餐嘅份量。'],['避免煎炸同高脂肪甜點','避免蓮蓉、豆沙、奶黃、酥皮；可選冰糖雪耳燉木瓜、豆腐花、紅豆沙、綠豆沙。']];
 var h='<h1 class="ph">飲食守則</h1><div class="card"><p class="help">來自營養師 Nutrition Point 嘅飲食原則。</p><div style="margin-top:8px">'+R.map(function(r,i){return'<details class="fold"'+(S.open['g'+i]?' open':'')+' data-hist="g'+i+'"><summary>'+(i+1)+' · '+r[0]+'</summary><p class="help">'+r[1]+'</p></details>'}).join('')+'</div></div>';
 h+='<div class="card"><h2>要避免</h2><div class="row" style="margin-top:8px"><span class="tag">麩質食物</span><span class="tag">油炸</span><span class="tag">重醬汁</span><span class="tag">加工食品</span></div><p class="help" style="margin-top:8px">麩質：麵包、糕點、蒸包、饅頭、pizza、撻、餅乾、蛋糕、西餅。加工食品：煙肉、火腿、腸仔、午餐肉、鹹魚。甜品：含蓮蓉、豆沙、奶黃、酥皮。</p><p class="help">可選甜品：冰糖雪耳燉木瓜、豆腐花、紅豆沙、綠豆沙。</p></div>';
 h+='<div class="card"><h2>水果同小食</h2><p class="help" style="margin-top:8px">水果每日最少 1 份：'+FRUITS.join('、')+'。少食：芒果、榴槤、龍眼、荔枝。</p><p class="help">小食每日 2 次：'+SNACKS.join('、')+'。</p></div>';
 h+='<div class="card"><h2>補充品時間表</h2><p class="help">只作文字參考，劑量以醫生同營養師為準。</p><dl class="dl" style="margin-top:8px"><dt>早餐前 9:30</dt><dd>維他命 B 群、Zinc、GO-TRIM 2 粒</dd><dt>早餐後</dt><dd>維他命 D3+K、魚油</dd><dt>午餐後</dt><dd>魚油</dd></dl></div>';
 $('#page-guide').innerHTML=h}

/* ---------- settings ---------- */
function renderSettings(){var bk=S.bk;
 var h='<h1 class="ph">設定</h1><div class="card"><h2>備份</h2><p class="help">資料只存喺呢部機。換手機之前，請先備份。</p><div class="row" style="margin-top:12px">'+(window.PLANNER_NO_DL?'':'<button class="btn primary" style="width:auto" data-act="bkdl" data-fid="bkdl">下載備份檔案（.json）</button>')+'<button class="btn'+(window.PLANNER_NO_DL?' primary':'')+'" style="'+(window.PLANNER_NO_DL?'width:auto':'')+'" data-act="bkexport" data-fid="bkx">產生備份文字</button></div>';
 if(bk.out)h+='<textarea class="mono" id="bkout" readonly style="margin-top:8px">'+esc(bk.out)+'</textarea><div class="row" style="margin-top:8px"><button class="btn" data-act="bkcopy" data-fid="bkc">複製備份</button></div>';
 h+='<hr class="rule"><div class="sec">還原</div><p class="help">貼上備份文字，或揀返備份檔案。匯入會覆蓋現有記錄。</p><label class="upload" style="margin-top:8px;width:auto;padding:0 12px"><input type="file" id="bkfile" accept=".json,application/json" hidden>揀備份檔案</label><textarea class="mono" id="bkin" style="margin-top:8px" placeholder="貼上備份 JSON">'+esc(bk.text)+'</textarea>';
 if(bk.confirm)h+='<div class="warn" style="margin-top:8px">匯入會覆蓋現有所有記錄，確定嗎？<div class="row" style="margin-top:8px"><button class="btn primary" style="width:auto" data-act="bkgo" data-fid="bkgo">確定匯入</button><button class="btn" data-act="bkno" data-fid="bkno">取消</button></div></div>';
 else h+='<button class="btn" style="margin-top:8px" data-act="bkask" data-fid="bkask">匯入</button>';
 if(bk.msg)h+='<p class="help" style="margin-top:8px">'+esc(bk.msg)+'</p>';
 h+='<p class="help">相片存喺瀏覽器 IndexedDB 並已壓縮，其餘資料存喺本機儲存。</p></div>';
 h+='<div class="card"><div class="row" style="justify-content:space-between"><h2>本月多吃</h2><span class="help">可編輯</span></div><p class="help">隨機生成時，呢啲食材出現機會較高。</p><div class="group" style="margin-top:8px">'+DB.boost.map(function(id){var it=by(BOOSTABLE,id);return it?'<button class="choice" aria-pressed="true" data-act="boostoff" data-id="'+id+'" data-fid="bo'+id+'">'+it.n+' ×</button>':''}).join('')+'<button class="btn" data-act="boostadd" data-fid="boadd">'+(S.addBoost?'完成':'＋ 加食材')+'</button></div>';
 if(S.addBoost)h+='<div class="group" style="margin-top:8px">'+BOOSTABLE.filter(function(x){return DB.boost.indexOf(x.id)<0&&isOn(x)}).map(function(x){return'<button class="choice" data-act="booston" data-id="'+x.id+'" data-fid="bn'+x.id+'">'+x.n+'</button>'}).join('')+'</div>';
 h+='</div>';
 h+='<div class="card lib"><h2>食材庫</h2><p class="help">每個食材標有來源：<b>原文</b> = 營養師 PDF，<b>建議</b> = 按原則推導，待營養師確認。唔想出現嘅食材可以取消剔選，隨機同自己揀都唔會再出現。</p>';
 [['蛋白質',PROTEINS],['蔬菜',VEGS],['澱粉',STARCH],['健康油脂及配料',ADDONS]].forEach(function(g){h+='<details class="fold"'+(S.open['l'+g[0]]?' open':'')+' data-hist="l'+g[0]+'"><summary>'+g[0]+'（'+g[1].length+'）</summary>'+g[1].map(function(it){return'<label><input type="checkbox" data-act="toggleitem" data-id="'+it.id+'"'+(isOn(it)?' checked':'')+'>'+it.n+'<span class="src">'+(it.s==='p'?'原文':'建議')+(it.warn?' · '+it.warn+'，預設停用':'')+(it.note?' · '+it.note:'')+'</span></label>'}).join('')+'</details>'});
 h+='</div>';
 h+='<div class="card"><h2>鎖住</h2><p class="help">鎖住後，下次要輸入密碼先打開。呢個只係畫面鎖，記錄一直只存喺呢部機。</p><button class="btn" style="margin-top:12px" data-act="lock" data-fid="lock">立即鎖住</button></div>';
 $('#page-settings').innerHTML=h}

/* ---------- actions ---------- */
function scrollToEl(id){var el=$(id);if(el)el.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'start'})}
function resetDraft(){var sl=S.draft&&S.draft.slot||'午餐';S.draft={photo:null,bloat:null,energy:null,crave:null,note:'',name:'',slot:sl}}
function genRandom(){if(!S.rnd.type)return;S.card=makeRandom(S.rnd.type,S.rnd.slot);S.pending=null;resetDraft();S.last='random';renderAll();scrollToEl('#result')}
function genBuilder(){if(!builderReady())return;S.card=fromBuilder();S.pending=null;resetDraft();S.last='builder';renderAll();scrollToEl('#result')}
function copyText(txt,done){var fb=function(){var ta=document.createElement('textarea');ta.value=txt;document.body.appendChild(ta);ta.select();var ok=false;try{ok=document.execCommand('copy')}catch(e){}ta.remove();toast(ok?'已複製':'複製唔到，請手動揀選文字')};
 if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(txt).then(function(){toast('已複製')}).catch(fb);else fb()}
function checkWarn(name){for(var i=0;i<AVOID.length;i++)if(name.toLowerCase().indexOf(AVOID[i][0])>-1)return{item:name,reason:AVOID[i][1],suggest:AVOID[i][2]};return null}
function exportAll(){var o={app:'planner',v:2,at:new Date().toISOString(),db:DB,photos:PH};return JSON.stringify(o)}
function importAll(txt){try{var o=JSON.parse(txt);if(!o||o.app!=='planner'||!o.db)throw 0;DB.days=o.db.days||{};DB.meas=o.db.meas||{};DB.boost=o.db.boost||DEF_BOOST.slice();DB.off=o.db.off||[];Object.keys(PH).forEach(photoDel);Object.keys(o.photos||{}).forEach(function(k){photoPut(k,o.photos[k])});persist();return true}catch(e){return false}}
function onAct(a,el){var ds=el.dataset;switch(a){
 case'nav':showPage(ds.p);break;
 case'day':S.sel=ds.k;S.card=null;S.pending=null;resetDraft();S.eatInfo=false;S.warn=null;var dt=getDay(S.sel).type;if(dt)S.rnd.type=dt;prune();renderAll();break;
 case'settype':ensureDay(S.sel).type=ds.k;S.rnd.type=ds.k;prune();persist();renderAll();break;
 case'clrtype':ensureDay(S.sel).type=null;prune();persist();renderAll();break;
 case'rtype':S.rnd.type=ds.k;S.last='random';renderAll();break;
 case'rslot':S.rnd.slot=ds.s;S.last='random';renderAll();break;
 case'rgen':genRandom();break;
 case'bslot':S.bld.slot=ds.s;S.last='builder';prune();renderAll();break;
 case'bpick':{var key=/^protein/.test(ds.fid)?'protein':/^veg/.test(ds.fid)?'veg':'starch',it=by(key==='protein'?PROTEINS:key==='veg'?VEGS:STARCH,ds.id);S.bld[key]=S.bld[key]===ds.id?null:ds.id;S.last='builder';S.warn=null;if(S.bld[key]&&it.warn)S.warn={item:it.n,reason:it.warn==='含麩質'?'含麩質':'要留意',suggest:'番薯、粟米或米製品',key:key};renderAll();break}
 case'baddon':{var i=S.bld.addons.indexOf(ds.id);if(i>-1)S.bld.addons.splice(i,1);else S.bld.addons.push(ds.id);S.last='builder';renderAll();break}
 case'addcustom':{var v=($('#custom').value||'').trim();if(!v)break;S.bld.custom.push(v);S.warn=checkWarn(v);if(S.warn)S.warn.custom=v;S.last='builder';renderAll();break}
 case'rmcustom':S.bld.custom.splice(+ds.i,1);S.warn=null;renderAll();break;
 case'warnfix':{if(S.warn){if(S.warn.custom){var ix=S.bld.custom.indexOf(S.warn.custom);if(ix>-1)S.bld.custom.splice(ix,1)}else if(S.warn.key)S.bld[S.warn.key]=null}S.warn=null;renderAll();break}
 case'warnkeep':S.warn=null;renderAll();toast('已按你嘅選擇');break;
 case'eatinfo':S.eatInfo=!S.eatInfo;renderBuilder();break;
 case'bgen':genBuilder();break;
 case'bar':if(S.last==='random')genRandom();else genBuilder();break;
 case'method':S.card.method=MORDER[(MORDER.indexOf(S.card.method)+1)%5];S.pending=null;renderAll();break;
 case'edit':{var c=S.card;if(!c||c.eat)break;if(!getDay(S.sel).type){ensureDay(S.sel).type=c.type;persist()}S.bld={slot:c.slot,protein:c.protein,veg:c.veg,starch:c.starch,addons:(c.addons||[]).slice(),custom:(c.custom||[]).slice()};S.last='builder';prune();renderAll();scrollToEl('#builder');if(c.src==='random')toast('已將今次嘅選擇放入自己揀');break}
 case'accept':{if(S.pending){showPage('log');break}if(!getDay(S.sel).type){ensureDay(S.sel).type=S.card.type;S.rnd.type=S.card.type;persist()}S.pending=S.card;showPage('log');toast('已揀，可加相片同體感，再儲存');break}
 case'copy':{var d=derive(S.card);copyText(d.title+'\n份量：'+d.por.join(' · ')+'\n做法：\n'+d.steps.map(function(s,i){return(i+1)+' '+s}).join('\n'));break}
 case'rmphoto':S.draft.photo=null;renderLog();break;
 case'rstfeel':S.draft.bloat=S.draft.energy=S.draft.crave=null;renderLog();break;
 case'save':{var pd=S.pending;var nm=pd?derive(pd).title:(S.draft.name||'').trim();if(!pd&&!nm&&!S.draft.photo){toast('請寫低食咗乜，或者上載相片');break}if(!nm)nm='相片記錄';
  var f={bloat:S.draft.bloat,energy:S.draft.energy,crave:S.draft.crave},has=f.bloat!=null||f.energy!=null||f.crave!=null,n=new Date(),id='m'+Date.now(),pid=null;
  if(S.draft.photo){pid='p'+id;photoPut(pid,S.draft.photo)}
  ensureDay(S.sel).meals.push({id:id,t:pad(n.getHours())+':'+pad(n.getMinutes()),slot:pd?pd.slot:S.draft.slot,name:nm,feel:has?f:null,note:S.draft.note.trim(),photoId:pid});
  S.pending=null;S.card=null;resetDraft();persist();renderAll();toast('已儲存');break}
 case'qslot':S.draft.slot=ds.s;renderLog();break;
 case'rm':{var dy=ensureDay(S.sel);dy.meals=dy.meals.filter(function(m){if(m.id===ds.id&&m.photoId)photoDel(m.photoId);return m.id!==ds.id});persist();renderAll();toast('已刪除');break}
 case'calnav':{var m=S.cal.m+(+ds.n),y=S.cal.y;if(m<1){m=12;y--}if(m>12){m=1;y++}S.cal={y:y,m:m,sel:y+'-'+pad(m)+'-01'};if(y===NOW.getFullYear()&&m===NOW.getMonth()+1)S.cal.sel=TODAY;renderCal();break}
 case'calsel':S.cal.sel=ds.k;renderCal();break;
 case'rvnav':S.rv=ymd(addDays(parse(S.rv),7*(+ds.n)));renderReview();break;
 case'savemeas':{var kg=parseFloat($('#mkg').value),cm=parseFloat($('#mcm').value);if(isNaN(kg)&&isNaN(cm)){toast('請輸入體重或腰圍');break}DB.meas[S.rv]={kg:isNaN(kg)?null:kg,cm:isNaN(cm)?null:cm};persist();renderReview();toast('已記錄');break}
 case'vsgen':S.vs.from=$('#vfrom').value||S.vs.from;S.vs.to=$('#vto').value||S.vs.to;if(S.vs.from>S.vs.to){var tmp=S.vs.from;S.vs.from=S.vs.to;S.vs.to=tmp}S.vs.show=true;renderReview();break;
 case'vscopy':copyText(summaryText());break;
 case'bkexport':S.bk.out=exportAll();S.bk.msg='已產生備份，請複製並自己保存。';renderSettings();break;
 case'lock':if(window.PlannerGate)window.PlannerGate.lock();break;
 case'bkdl':{try{var blob=new Blob([exportAll()],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='planner-backup-'+TODAY+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url)},1000);S.bk.msg='已下載備份檔案。請保存喺安全嘅地方。'}catch(e){S.bk.msg='下載唔到，請改用「產生備份文字」。'}renderSettings();break}
 case'bkcopy':copyText(S.bk.out);break;
 case'bkask':S.bk.text=$('#bkin').value;if(!S.bk.text.trim()){S.bk.msg='請先貼上備份文字或揀檔案。';renderSettings();break}S.bk.confirm=true;S.bk.msg='';renderSettings();break;
 case'bkno':S.bk.confirm=false;renderSettings();break;
 case'bkgo':{var ok=importAll(S.bk.text);S.bk={text:'',confirm:false,msg:ok?'已匯入。':'備份格式唔正確，冇改動任何資料。'};renderSettings();if(ok)toast('已匯入');break}
 case'boostoff':DB.boost=DB.boost.filter(function(x){return x!==ds.id});persist();renderSettings();break;
 case'boostadd':S.addBoost=!S.addBoost;renderSettings();break;
 case'booston':DB.boost.push(ds.id);persist();renderSettings();break;
 case'toggleitem':{var on=el.checked;DB.off=DB.off.filter(function(x){return x!==ds.id});if(!on)DB.off.push(ds.id);persist();break}
 }}
document.addEventListener('click',function(e){var el=e.target.closest('[data-act]');if(!el||el.disabled)return;if(el.dataset.act==='toggleitem')return;onAct(el.dataset.act,el)});
document.addEventListener('input',function(e){var t=e.target;
 if(t.id==='note')S.draft.note=t.value;
 else if(t.id==='qname')S.draft.name=t.value;
 else if(t.type==='range'&&/^sl-/.test(t.id)){var k=t.id.slice(3);S.draft[k]=+t.value;t.closest('.slider').classList.remove('untouched')}});
document.addEventListener('change',function(e){var t=e.target;
 if(t.dataset&&t.dataset.act==='toggleitem'){onAct('toggleitem',t);return}
 if(t.id==='photo'&&t.files[0]){var fr=new FileReader();fr.onload=function(){var img=new Image();img.onload=function(){var k=Math.min(1,640/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=Math.round(img.width*k);c.height=Math.round(img.height*k);c.getContext('2d').drawImage(img,0,0,c.width,c.height);S.draft.photo=c.toDataURL('image/jpeg',.7);renderLog()};img.onerror=function(){toast('呢張相讀唔到，試另一張')};img.src=fr.result};fr.readAsDataURL(t.files[0])}
 if(t.id==='bkfile'&&t.files[0]){var r=new FileReader();r.onload=function(){S.bk.text=String(r.result);S.bk.msg='已讀取檔案，撳「匯入」繼續。';renderSettings()};r.readAsText(t.files[0])}
 if(t.id==='vfrom')S.vs.from=t.value;if(t.id==='vto')S.vs.to=t.value});
document.addEventListener('toggle',function(e){var k=e.target.getAttribute&&e.target.getAttribute('data-hist');if(k!=null)S.open[k]=e.target.open},true);
['#random','#builder'].forEach(function(s){$(s).addEventListener('focusin',function(){S.last=s==='#random'?'random':'builder';renderBar()})});
var tick=false;window.addEventListener('scroll',function(){if(tick||S.page!=='gen')return;tick=true;requestAnimationFrame(function(){tick=false;var y=innerHeight*.4,r=$('#random').getBoundingClientRect(),b=$('#builder').getBoundingClientRect(),n=S.last;if(r.top<=y&&r.bottom>y)n='random';else if(b.top<=y&&b.bottom>y)n='builder';if(n!==S.last){S.last=n;renderBar()}})},{passive:true});
window.addEventListener('hashchange',function(){var p=location.hash.slice(1);if(p&&p!==S.page&&$('#page-'+p))showPage(p)});

/* ---------- init ---------- */
var start=function(){var p=location.hash.slice(1);showPage($('#page-'+p)?p:'today',true)};
loadDB();start();
idbOpen(function(){photoAll(function(){MIG.forEach(function(x){photoPut(x[0],x[1])});MIG=[];start()})});
})();
