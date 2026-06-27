
  // ---------- 3D finale: Royal Oak (Three.js r128) ----------
  (function(){
    if(!window.THREE) return;
    var canvas=document.getElementById('webgl'); if(!canvas) return;
    var W=1080,H=1920;
    var renderer=new THREE.WebGLRenderer({canvas:canvas,antialias:true,alpha:true});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
    renderer.setSize(W,H,false);
    var scene=new THREE.Scene();
    var camera=new THREE.PerspectiveCamera(30, W/H, 1, 6000);
    camera.position.set(0,0,1600);

    // warm studio environment so the metals read (no env = black metal)
    var ec=document.createElement('canvas'); ec.width=16; ec.height=256;
    var ex=ec.getContext('2d'); var lg=ex.createLinearGradient(0,0,0,256);
    lg.addColorStop(0,'#fbf6ec'); lg.addColorStop(0.45,'#ecdcbb');
    lg.addColorStop(0.72,'#b79f6c'); lg.addColorStop(1,'#2a241d');
    ex.fillStyle=lg; ex.fillRect(0,0,16,256);
    var envTex=new THREE.CanvasTexture(ec); envTex.mapping=THREE.EquirectangularReflectionMapping;
    scene.environment=envTex;

    scene.add(new THREE.HemisphereLight(0xfff4e0,0x6b5a44,0.55));
    var key=new THREE.DirectionalLight(0xffffff,1.15); key.position.set(-340,520,640); scene.add(key);
    var fill=new THREE.DirectionalLight(0xf3e6c8,0.5); fill.position.set(420,-220,320); scene.add(fill);

    var steel=new THREE.MeshStandardMaterial({color:0xbdb6a8,metalness:0.85,roughness:0.38});
    var champ=new THREE.MeshStandardMaterial({color:0xc6a86b,metalness:0.9,roughness:0.32});
    var darkHand=new THREE.MeshStandardMaterial({color:0x2a241d,metalness:0.4,roughness:0.45});

    function tapisserieTex(){
      var c=document.createElement('canvas'); c.width=c.height=512; var x=c.getContext('2d');
      x.fillStyle='#241f19'; x.fillRect(0,0,512,512);
      x.strokeStyle='rgba(150,130,95,0.28)'; x.lineWidth=1;
      for(var i=0;i<=512;i+=14){x.beginPath();x.moveTo(i,0);x.lineTo(i,512);x.stroke();
        x.beginPath();x.moveTo(0,i);x.lineTo(512,i);x.stroke();}
      return new THREE.CanvasTexture(c);
    }
    var dialMat=new THREE.MeshStandardMaterial({color:0x2a241d,metalness:0.3,roughness:0.55,map:tapisserieTex()});

    var watch=new THREE.Group(); watch.position.y=130; scene.add(watch);

    function octPath(R,target){
      for(var k=0;k<8;k++){var a=(22.5+k*45)*Math.PI/180,x=R*Math.cos(a),y=R*Math.sin(a);
        if(k===0)target.moveTo(x,y); else target.lineTo(x,y);} target.closePath();
    }
    var Rout=300, Rin=232;
    var shape=new THREE.Shape(); octPath(Rout,shape);
    var hole=new THREE.Path(); octPath(Rin,hole); shape.holes.push(hole);
    var bezel=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,
      {depth:46,bevelEnabled:true,bevelThickness:11,bevelSize:10,bevelSegments:3,steps:1}), steel);
    watch.add(bezel);

    var body=new THREE.Mesh(new THREE.CylinderGeometry(Rout*0.99,Rout*0.9,64,48), steel);
    body.rotation.x=Math.PI/2; body.position.z=-32; watch.add(body);

    var dial=new THREE.Mesh(new THREE.CircleGeometry(Rin*0.99,64), dialMat);
    dial.position.z=12; watch.add(dial);

    for(var k=0;k<8;k++){var a=(22.5+k*45)*Math.PI/180,x=(Rout-26)*Math.cos(a),y=(Rout-26)*Math.sin(a);
      var sc=new THREE.Mesh(new THREE.CylinderGeometry(20,20,16,6), champ);
      sc.rotation.x=Math.PI/2; sc.position.set(x,y,58); watch.add(sc);}

    var hour=new THREE.Mesh(new THREE.BoxGeometry(15,128,8), darkHand);
    hour.geometry.translate(0,54,0); hour.rotation.z=-60*Math.PI/180; hour.position.z=30; watch.add(hour);
    var minute=new THREE.Mesh(new THREE.BoxGeometry(11,190,8), darkHand);
    minute.geometry.translate(0,82,0); minute.rotation.z=60*Math.PI/180; minute.position.z=34; watch.add(minute);
    var sec=new THREE.Mesh(new THREE.BoxGeometry(5,212,4), champ);
    sec.geometry.translate(0,84,0); sec.position.z=38; watch.add(sec);
    var cap=new THREE.Mesh(new THREE.CylinderGeometry(12,12,12,20), champ);
    cap.rotation.x=Math.PI/2; cap.position.z=42; watch.add(cap);

    watch.rotation.x=-0.16; watch.rotation.y=0.10;

    var t0=performance.now(), zoomStart=10600;
    function loop(now){
      var t=now-t0;
      sec.rotation.z = -(t/9000)*Math.PI*2;
      watch.rotation.y = 0.10 + Math.sin(t/2600)*0.05;
      if(t>zoomStart){
        var p=Math.min((t-zoomStart)/4400,1), e=1-Math.pow(1-p,3);
        camera.position.z = 1600 - e*620;
        watch.rotation.x = -0.16 + e*0.05;
      }
      renderer.render(scene,camera);
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  })();

  // ---------- engraved 2D builders ----------
  (function(){
    var t=document.getElementById('tap'); if(!t) return;
    var s='', step=30, sz=15;
    for(var y=478;y<=902;y+=step){for(var x=540;x<=952;x+=step){
      s+='<rect x="'+x+'" y="'+y+'" width="'+sz+'" height="'+sz+'" rx="2"/>';}}
    t.innerHTML=s;
  })();
  (function(){
    var host=document.getElementById('screws'); if(!host) return;
    var verts=[[990,805],[865,930],[635,930],[510,805],[510,575],[635,450],[865,450],[990,575]];
    function hex(cx,cy,r){var p=[];for(var k=0;k<6;k++){var a=(-90+k*60)*Math.PI/180;
      p.push((cx+r*Math.cos(a)).toFixed(1)+','+(cy+r*Math.sin(a)).toFixed(1));}return p.join(' ');}
    var s='';
    verts.forEach(function(v,i){
      s+='<g class="screw" style="animation-delay:'+(0.7+i*0.11).toFixed(2)+'s">'
        +'<polygon points="'+hex(v[0],v[1],19)+'"/>'
        +'<line x1="'+(v[0]-11)+'" y1="'+(v[1]-6)+'" x2="'+(v[0]+11)+'" y2="'+(v[1]+6)+'"/></g>';
    });
    host.innerHTML=s;
  })();
  (function(){
    var host=document.getElementById('bracelet'); if(!host) return;
    function row(yc,hw,h){
      var x0=750-hw, span=2*hw, gap=8, lw=(span-2*gap)/3, s='', r=10;
      for(var k=0;k<3;k++){var x=x0+k*(lw+gap);
        s+='<rect x="'+x.toFixed(1)+'" y="'+(yc-h/2).toFixed(1)+'" width="'+lw.toFixed(1)+'" height="'+h+'" rx="'+r+'" opacity=".6"/>';
        s+='<line x1="'+(x+lw/2).toFixed(1)+'" y1="'+(yc-h/2+8).toFixed(1)+'" x2="'+(x+lw/2).toFixed(1)+'" y2="'+(yc+h/2-8).toFixed(1)+'" opacity=".4"/>';}
      return s;
    }
    var s='';
    [[408,112,60],[338,103,56],[274,94,52]].forEach(function(R){s+=row(R[0],R[1],R[2]);});
    [[972,112,60],[1042,103,56],[1106,94,52]].forEach(function(R){s+=row(R[0],R[1],R[2]);});
    host.innerHTML=s;
  })();

  // ---------- fit / controls ----------
  var FW=1080, FH=1920;
  function fit(){
    var pad = document.body.classList.contains('clean') ? 0 : 24;
    var s = Math.min((window.innerWidth-pad*2)/FW, (window.innerHeight-pad*2)/FH);
    var frame=document.getElementById('frame'), stage=document.getElementById('stage');
    frame.style.transform='scale('+s+')';
    stage.style.width=(FW*s)+'px'; stage.style.height=(FH*s)+'px';
  }
  document.getElementById('replay').onclick=function(){ location.reload(); };
  window.addEventListener('keydown',function(e){if(e.key==='r'||e.key==='R')location.reload();});
  document.getElementById('clean').onclick=function(){
    document.body.classList.toggle('clean');
    this.textContent=document.body.classList.contains('clean')?'Afficher les repères':'Masquer les repères';
    fit();
  };
  window.addEventListener('resize',fit);
  window.addEventListener('load',fit);
  fit();
