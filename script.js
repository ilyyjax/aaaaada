const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const dropZone = document.getElementById("dropZone");
const fileUpload = document.getElementById("fileUpload");
const saveBtn = document.getElementById("saveBtn");
const resetBtn = document.getElementById("resetBtn");
const scaleControl = document.getElementById("scaleControl");
const rotationControl = document.getElementById("rotationControl");

let bgImg = null;
let hatImg = new Image();
hatImg.src = "hat.png"; // put your hat.png in same folder

let pos = {x: 150, y: 40};
let scale = 1;
let rotation = 0;
let dragging = false;
let dragStart = null;

// Resize canvas
function resizeCanvas() {
  canvas.width = dropZone.clientWidth;
  canvas.height = dropZone.clientHeight;
  drawCanvas();
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// Draw everything
function drawCanvas() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = "#f9fafb";
  ctx.fillRect(0,0,canvas.width,canvas.height);

  if(bgImg){
    let r = Math.min(canvas.width/bgImg.width, canvas.height/bgImg.height);
    let dw = bgImg.width * r, dh = bgImg.height * r;
    let dx = (canvas.width-dw)/2, dy = (canvas.height-dh)/2;
    ctx.drawImage(bgImg, dx, dy, dw, dh);

    let hatW = hatImg.width * scale;
    let hatH = hatImg.height * scale;
    ctx.save();
    ctx.translate(pos.x+hatW/2, pos.y+hatH/2);
    ctx.rotate(rotation * Math.PI/180);
    ctx.drawImage(hatImg, -hatW/2, -hatH/2, hatW, hatH);
    ctx.restore();
  } else {
    ctx.strokeStyle = "#d1d5db";
    ctx.setLineDash([8,6]);
    ctx.strokeRect(12,12,canvas.width-24,canvas.height-24);
    ctx.setLineDash([]);
    ctx.fillStyle = "#9ca3af";
    ctx.font = "18px system-ui";
    ctx.fillText("Drop image or click to upload", 24, 40);
  }
}

// Handle drop/upload
async function handleImage(file){
  let url = URL.createObjectURL(file);
  let img = new Image();
  img.onload = async ()=>{
    bgImg = img;
    pos = {x: img.width/2 - 100, y: 20};
    scale = 1; rotation = 0;

    // Snap to face
    try {
      await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
      const detections = await faceapi.detectSingleFace(img,new faceapi.TinyFaceDetectorOptions());
      if(detections){
        let box = detections.box;
        pos = {x: box.x + box.width/2 - 60, y: box.y - 40};
        scale = box.width/120;
      }
    } catch(err){ console.warn("Face detection failed", err); }

    drawCanvas();
  };
  img.src = url;
}

dropZone.addEventListener("drop", e=>{
  e.preventDefault();
  let f = e.dataTransfer.files[0];
  if(f && f.type.startsWith("image/")) handleImage(f);
});
dropZone.addEventListener("dragover", e=> e.preventDefault());
fileUpload.addEventListener("change", e=>{
  let f = e.target.files[0];
  if(f) handleImage(f);
});

// Dragging hat
canvas.addEventListener("mousedown", e=>{
  dragging = true;
  dragStart = {x: e.offsetX - pos.x, y: e.offsetY - pos.y};
});
canvas.addEventListener("mousemove", e=>{
  if(dragging){
    pos = {x: e.offsetX - dragStart.x, y: e.offsetY - dragStart.y};
    drawCanvas();
  }
});
canvas.addEventListener("mouseup", ()=> dragging=false);
canvas.addEventListener("mouseleave", ()=> dragging=false);

// Controls
scaleControl.addEventListener("input", e=>{
  scale = parseFloat(e.target.value);
  drawCanvas();
});
rotationControl.addEventListener("input", e=>{
  rotation = parseFloat(e.target.value);
  drawCanvas();
});
resetBtn.addEventListener("click", ()=>{
  pos = {x:150,y:40}; scale=1; rotation=0; drawCanvas();
});
saveBtn.addEventListener("click", ()=>{
  let link = document.createElement("a");
  link.download = "locktober.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
});
