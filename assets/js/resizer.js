(()=>{"use strict";
const $=id=>document.getElementById(id);let image=null,outputBlob=null,outputUrl=null,ratio=1,updating=false;
const fileInput=$("fileInput"),width=$("width"),height=$("height"),lock=$("lockRatio"),preview=$("preview");
function setInfo(text){$("fileInfo").textContent=text}
function clearOutput(){outputBlob=null;$("downloadBtn").disabled=true;$("outputInfo").textContent="No output yet";if(outputUrl){URL.revokeObjectURL(outputUrl);outputUrl=null}}
function loadImage(file){if(!file||!file.type.startsWith("image/")){setInfo("Please choose a valid image file.");return}const url=URL.createObjectURL(file),img=new Image();img.onload=()=>{if(image&&image.src.startsWith("blob:"))URL.revokeObjectURL(image.src);image=img;ratio=img.naturalWidth/img.naturalHeight;width.value=img.naturalWidth;height.value=img.naturalHeight;setInfo(`${file.name} · ${img.naturalWidth} × ${img.naturalHeight} · ${(file.size/1024).toFixed(1)} KB`);$("resizeBtn").disabled=false;clearOutput();preview.innerHTML='<div class="empty-state">Image loaded. Choose dimensions and press Resize image.</div>';};img.onerror=()=>{URL.revokeObjectURL(url);setInfo("Could not open this image. Try another file.")};img.src=url}
fileInput.addEventListener("change",e=>loadImage(e.target.files[0]));
width.addEventListener("input",()=>{if(lock.checked&&image&&!updating){updating=true;height.value=Math.max(1,Math.round(Number(width.value||1)/ratio));updating=false}});
height.addEventListener("input",()=>{if(lock.checked&&image&&!updating){updating=true;width.value=Math.max(1,Math.round(Number(height.value||1)*ratio));updating=false}});
$("resizeBtn").addEventListener("click",async()=>{if(!image)return;const w=Number(width.value),h=Number(height.value);if(!Number.isInteger(w)||!Number.isInteger(h)||w<1||h<1||w>12000||h>12000){alert("Enter width and height between 1 and 12,000 pixels.");return}
const canvas=document.createElement("canvas"),ctx=canvas.getContext("2d");const mode=$("mode").value;canvas.width=w;canvas.height=h;ctx.fillStyle=$("bgColor").value;ctx.fillRect(0,0,w,h);
let sx=0,sy=0,sw=image.naturalWidth,sh=image.naturalHeight,dx=0,dy=0,dw=w,dh=h;
if(mode==="fit"){const scale=Math.min(w/sw,h/sh);dw=sw*scale;dh=sh*scale;dx=(w-dw)/2;dy=(h-dh)/2}
if(mode==="fill"){const scale=Math.max(w/sw,h/sh);const cropW=w/scale,cropH=h/scale;sx=(sw-cropW)/2;sy=(sh-cropH)/2;sw=cropW;sh=cropH}
ctx.drawImage(image,sx,sy,sw,sh,dx,dy,dw,dh);
const mime=$("format").value;const blob=await new Promise(resolve=>canvas.toBlob(resolve,mime,mime==="image/png"?undefined:.92));if(!blob){alert("This browser could not create the selected format.");return}clearOutput();outputBlob=blob;outputUrl=URL.createObjectURL(blob);const img=document.createElement("img");img.alt="Resized image preview";img.src=outputUrl;preview.replaceChildren(img);$("outputInfo").textContent=`Output: ${w} × ${h} · ${(blob.size/1024).toFixed(1)} KB · ${mime.split("/")[1].toUpperCase()}`;$("downloadBtn").disabled=false;
});
$("downloadBtn").addEventListener("click",()=>{if(!outputBlob)return;const ext=$("format").value==="image/jpeg"?"jpg":$("format").value.split("/")[1];const a=document.createElement("a");a.href=outputUrl;a.download=`resized-image.${ext}`;a.click()});
})();