import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
const source=fs.readFileSync(new URL('../components/webrtc-qr-pairing.html',import.meta.url),'utf8');
const extract=(a,b)=>source.slice(source.indexOf(a),source.indexOf(b,source.indexOf(a)));
function harness(){
  const pending=[],scanner={generation:7,cameraRequestId:0,mode:'join',stream:null};
  const video={srcObject:null,play:async()=>{}};
  const state={scanner,destroyed:false};
  const ctx=vm.createContext({state,scannerElements:()=>({video,resolution:{},cameraSelect:{append(){}},cameraField:{}}),navigator:{mediaDevices:{getUserMedia:()=>new Promise(resolve=>pending.push(resolve)),enumerateDevices:async()=>[]}},format:()=>'',t:k=>k});
  vm.runInContext(extract('    async function openCamera(','    function renderChunks('),ctx);
  function stream(){let stopped=0;const track={stop(){stopped++},getSettings:()=>({}),applyConstraints:async()=>{}};return {getTracks:()=>[track],getVideoTracks:()=>[track],stopped:()=>stopped}}
  return {ctx,pending,scanner,video,stream};
}
test('late camera permission after scanner close stops obsolete tracks',async()=>{
  const h=harness(),p=h.ctx.openCamera('join');h.scanner.generation++;h.scanner.mode='';
  const s=h.stream();h.pending[0](s);assert.equal(await p,false);assert.equal(s.stopped(),1);assert.equal(h.video.srcObject,null);
});
test('superseded camera request does not replace current stream',async()=>{
  const h=harness(),old=h.ctx.openCamera('join','old'),next=h.ctx.openCamera('join','new'),a=h.stream(),b=h.stream();
  h.pending[1](b);assert.equal(await next,true);h.pending[0](a);assert.equal(await old,false);
  assert.equal(a.stopped(),1);assert.equal(b.stopped(),0);assert.equal(h.video.srcObject,b);
});
test('readiness contract and stale decode checks are retained',()=>{
  assert.match(source,/options\.requireReadyChannelOpen!==false&&\(!readyChannel\|\|readyChannel\.readyState!=='open'\)/);
  assert.match(source,/requestId!==state\.scanner\.cameraRequestId/);
  assert.match(source,/iceServers:\[\]/);
});
