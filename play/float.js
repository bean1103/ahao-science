// Opens the 阿豪小工具 (timer + draw) as an always-on-top window where the browser allows it (Chrome/Edge 116+ on computers).
const AHAO_PLAY=new URL(".",document.currentScript.src).href;
async function ahaoFloat(tab){
  const url=new URL("float/?tab="+(tab||"timer"),AHAO_PLAY).href;
  if("documentPictureInPicture" in window){
    try{
      const w=await documentPictureInPicture.requestWindow({width:360,height:300});
      w.document.title="阿豪小工具";
      const st=w.document.createElement("style");st.textContent="html,body{margin:0;height:100%;background:#1a1b26}iframe{border:0;width:100%;height:100%;display:block}";
      w.document.head.append(st);
      const f=w.document.createElement("iframe");f.src=url;f.allow="autoplay";w.document.body.append(f);
      return;
    }catch(e){}
  }
  const p=window.open(url,"ahao-float","popup,width=380,height=330");
  if(p)alertLite("這個瀏覽器不能把小視窗固定在最上層。想浮在投影片上，請用電腦版 Chrome 或 Edge 打開這個網站。");
  else location.href=url;
}
function alertLite(msg){const d=document.createElement("div");d.textContent=msg;
  d.style.cssText="position:fixed;left:50%;bottom:20px;transform:translateX(-50%);max-width:min(92vw,520px);background:#2f2f2f;color:#fff;padding:12px 16px;border-radius:10px;font:14px/1.6 system-ui,sans-serif;z-index:99999;box-shadow:0 6px 20px rgba(0,0,0,.5)";
  document.body.append(d);setTimeout(()=>d.remove(),7000)}
