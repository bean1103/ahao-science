// Floating mini window via video Picture-in-Picture: works on iPad/iPhone Safari (floats over GoodNotes etc.)
// and on computer Chrome/Edge/Safari (floats over PowerPoint etc.). The page draws onto a canvas, the canvas
// is streamed into a muted <video>, and that video goes into the system PiP window.
function AhaoPip(paint,{w=640,h=360,onPlayPause}={}){ // onPlayPause(): called when ▶/⏸ is pressed in the mini window
  const cv=document.createElement("canvas");cv.width=w;cv.height=h;const g=cv.getContext("2d");
  const v=document.createElement("video");v.muted=true;v.playsInline=true;v.setAttribute("playsinline","");v.autoplay=true;
  v.style.cssText="position:fixed;right:0;bottom:0;width:2px;height:2px;opacity:.01;pointer-events:none";
  document.body.append(v);
  const ok=!!(cv.captureStream&&(document.pictureInPictureEnabled||v.webkitSupportsPresentationMode));
  let st=null,frame=0;
  function draw(){paint(g,w,h);frame++;}
  draw();
  if(cv.captureStream){st=cv.captureStream(15);v.srcObject=st;v.play().catch(()=>{});}
  setInterval(draw,250);
  const isOpen=()=>document.pictureInPictureElement===v||v.webkitPresentationMode==="picture-in-picture";
  // the ▶/⏸ button inside the floating window toggles the page (e.g. pause/resume the timer);
  // the video itself keeps playing so the mini window stays live.
  let last=0;const toggle=()=>{const t=Date.now();if(t-last<300)return;last=t;onPlayPause&&onPlayPause()};
  v.addEventListener("pause",()=>{if(isOpen()){toggle();setTimeout(()=>v.play().catch(()=>{}),120)}});
  try{navigator.mediaSession&&["play","pause"].forEach(a=>navigator.mediaSession.setActionHandler(a,()=>{toggle();v.play().catch(()=>{})}))}catch(e){}
  return {
    supported:ok,
    open(){draw();try{if(v.paused)v.play().catch(()=>{});
      if(v.requestPictureInPicture&&document.pictureInPictureEnabled)return v.requestPictureInPicture().catch(e=>{throw e});
      if(v.webkitSetPresentationMode){v.webkitSetPresentationMode("picture-in-picture");return Promise.resolve()}}catch(e){return Promise.reject(e)}
      return Promise.reject(new Error("unsupported"))},
    close(){try{if(document.pictureInPictureElement)document.exitPictureInPicture();else if(v.webkitSetPresentationMode)v.webkitSetPresentationMode("inline")}catch(e){}},
    isOpen, redraw:draw,
    video:v
  };
}
