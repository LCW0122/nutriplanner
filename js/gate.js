/* Planner password gate.
   This is a convenience lock on the screen, not security: the check runs in the browser, so anyone who reads
   the page source can get past it. Records never leave the device either way.
   Only a salted digest is stored here, never the password itself. To change the password, replace H with the
   output of hash('<new password>') from this same function. */
(function(){
'use strict';
var SALT='planner.gate.v1|',H='1wi6ov5cfk1',KEY='planner.auth',DAYS=30;
function c53(s,seed){var h1=0xdeadbeef^seed,h2=0x41c6ce57^seed;for(var i=0,ch;i<s.length;i++){ch=s.charCodeAt(i);h1=Math.imul(h1^ch,2654435761);h2=Math.imul(h2^ch,1597334677)}
 h1=Math.imul(h1^(h1>>>16),2246822507);h1^=Math.imul(h2^(h2>>>13),3266489909);h2=Math.imul(h2^(h2>>>16),2246822507);h2^=Math.imul(h1^(h1>>>13),3266489909);return 4294967296*(2097151&h2)+(h1>>>0)}
function hash(pw){var x=SALT+pw;for(var i=0;i<2000;i++)x=c53(x,i).toString(36);return x}
var root=document.documentElement,sess=false;
function remembered(){try{return +localStorage.getItem(KEY)>Date.now()}catch(e){return false}}
function open(){root.removeAttribute('data-locked')}
function lock(){sess=false;try{localStorage.removeItem(KEY)}catch(e){}root.setAttribute('data-locked','1');var i=document.getElementById('gpw');if(i){i.value='';i.focus()}}
if(!(remembered()))root.setAttribute('data-locked','1');
function wire(){var f=document.getElementById('gate-form');if(!f)return;
 f.addEventListener('submit',function(e){e.preventDefault();var pw=document.getElementById('gpw').value,msg=document.getElementById('gmsg');
  if(hash(pw)===H){sess=true;if(document.getElementById('gkeep').checked){try{localStorage.setItem(KEY,String(Date.now()+DAYS*864e5))}catch(x){}}msg.textContent='';document.getElementById('gpw').value='';open()}
  else{msg.textContent='密碼唔啱，請再試一次。';var i=document.getElementById('gpw');i.select();i.focus()}});
 if(root.hasAttribute('data-locked'))document.getElementById('gpw').focus()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wire);else wire();
window.PlannerGate={lock:lock};
})();
