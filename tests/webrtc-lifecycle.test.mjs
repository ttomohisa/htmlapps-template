import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
const source=fs.readFileSync(new URL('../components/webrtc-qr-pairing.html',import.meta.url),'utf8');
function extract(a,b){const i=source.indexOf(a),j=source.indexOf(b,i+1);assert.ok(i>=0&&j>i);return source.slice(i,j);}
test('QR render rejects a stale library load and never writes the target',async()=>{
 let resolve;const target={innerHTML:'original'};let current=true;
 const ctx=vm.createContext({ensureQrLibrary:()=>new Promise(r=>resolve=r),language:'en'});
 vm.runInContext(extract('    async function renderQr(','    function renderQrPlaceholder('),ctx);
 const promise=ctx.renderQr(target,'old',()=>current);current=false;resolve(()=>{throw Error('stale render');});
 assert.equal(await promise,false);assert.equal(target.innerHTML,'original');
});
test('application-ready checks both transport and designated channel; ready-channel close invalidates readiness',()=>{
 const listeners={},pc={connectionState:'connecting'},channel={label:'control',readyState:'open',addEventListener:(name,fn)=>listeners[name]=fn};
 const bucket={pc,attempt:1,readyChannel:null,channel:null,everConnected:false},state={host:bucket,connected:false};
 const events=[],dom={hidden:true};
 const ctx=vm.createContext({state,options:{requireReadyChannelOpen:true,dataChannelLabel:'app-data',onConnected:()=>events.push('ready'),onDisconnected:()=>events.push('disconnected')},readyChannelLabel:'control',isCurrentPc:()=>true,t:k=>k,setStatus:()=>{},setStep:()=>{},setCoach:()=>{},q:()=>dom,emitState:()=>{},stopDiagnosticPolling:()=>{},stopScanner:()=>{},stopQrCycles:()=>{}});
 vm.runInContext(extract('    function bindChannel(','    async function handleConnectionState('),ctx);
 ctx.bindChannel('host',channel,pc,1);ctx.markConnected('host',pc,1);assert.equal(state.connected,false);
 pc.connectionState='connected';ctx.markConnected('host',pc,1);assert.equal(state.connected,true);assert.deepEqual(events,['ready']);
 channel.readyState='closed';listeners.close();assert.equal(state.connected,false);assert.equal(bucket.readyChannel,null);assert.deepEqual(events,['ready','disconnected']);
});
