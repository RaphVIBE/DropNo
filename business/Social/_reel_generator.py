import math, os, sys, time
from PIL import Image, ImageDraw, ImageFont
SS=2
BG=(250,248,244); INK=(36,31,26); CHMP=(184,154,94); SOFT=(107,100,92)
SF="/usr/share/fonts/truetype/dejavu/DejaVuSerif-Italic.ttf"
SN="/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
def serif(px): return ImageFont.truetype(SF,int(px*SS))
def sans(px): return ImageFont.truetype(SN,int(px*SS))
def sg(p,a,b):
    if p>=b: return 1.0
    if p<=a: return 0.0
    x=(p-a)/(b-a); return x*x*(3-2*x)
def Lp(a,b,t): return a+(b-a)*t

# ---- plates: each draws progressively by p in 0..1, A(alpha)->rgba ----
def arcp(d,cx,cy,r,frac,A,a,w):
    if frac<=0: return
    d.arc([cx-r,cy-r,cx+r,cy+r],-90,-90+360*frac,fill=A(a),width=int(w*SS))
def fig01(d,p,cx,cy,A):
    f=sg(p,0,0.12)
    if f>0:
        x2=Lp(cx-500*SS,cx+460*SS,f); x=cx-500*SS; dash=22*SS;gap=12*SS
        while x<x2: d.line([x,cy,min(x+dash,x2),cy],fill=A(0.18),width=int(1.5*SS));x+=dash+gap
        y2=Lp(cy-360*SS,cy+680*SS,f); y=cy-360*SS
        while y<y2: d.line([cx,y,cx,min(y+dash,y2)],fill=A(0.18),width=int(1.5*SS));y+=dash+gap
    arcp(d,cx,cy,330*SS,sg(p,0.05,0.35),A,0.60,2.6)
    arcp(d,cx+4*SS,cy-3*SS,333*SS,sg(p,0.3,0.45),A,0.28,1.1)
    arcp(d,cx,cy,285*SS,sg(p,0.35,0.5),A,0.5,1.6)
    fd=sg(p,0.45,0.55); rd=305*SS; up=int(72*fd)
    for i in range(0,up,2):
        a0=math.radians(i*5-90);a1=math.radians((i+1)*5-90)
        d.line([cx+rd*math.cos(a0),cy+rd*math.sin(a0),cx+rd*math.cos(a1),cy+rd*math.sin(a1)],fill=A(0.4),width=int(1.1*SS))
    rs=305*SS
    for i,ang in enumerate([-90,-30,30,90,150,210]):
        q=sg(p,0.5+i*0.025,0.58+i*0.025,)
        if q>0:
            a=math.radians(ang);ex,ey=cx+rs*math.cos(a),cy+rs*math.sin(a);rr=11*SS*q
            d.ellipse([ex-rr,ey-rr,ex+rr,ey+rr],outline=A(0.62),width=int(1.8*SS))
    q=sg(p,0.62,0.72)
    if q>0:
        bx=cx+330*SS
        d.line([(bx,cy-34*SS),(bx+Lp(0,40*SS,q),cy-30*SS),(bx+Lp(0,40*SS,q),cy+30*SS),(bx,cy+34*SS)],fill=A(0.6),width=int(2*SS),joint="curve")
    q=sg(p,0.66,0.76)
    if q>0:
        for sx in(-1,1):
            d.line([cx+sx*150*SS,cy-300*SS,cx+sx*Lp(150,176,q)*SS,cy-(300+72*q)*SS],fill=A(0.5),width=int(1.6*SS))
            d.line([cx+sx*200*SS,cy-262*SS,cx+sx*Lp(200,226,q)*SS,cy-(262+54*q)*SS],fill=A(0.5),width=int(1.6*SS))
    q=sg(p,0.7,0.8)
    if q>0:
        d.line([cx-20*SS,cy,cx-20*SS+40*SS*q,cy],fill=A(0.55),width=int(2*SS))
        d.line([cx,cy-20*SS,cx,cy-20*SS+40*SS*q],fill=A(0.55),width=int(2*SS))
        d.line([cx,cy,cx+208*SS*q,cy-208*SS*q],fill=A(0.4),width=int(1.4*SS))
    q=sg(p,0.6,0.82); mx,my=cx-350*SS,cy+340*SS
    if q>0:
        arcp(d,mx,my,112*SS,q,A,0.5,1.8)
        prev=None;segs=int(160*q)
        for i in range(segs+1):
            a=3.2*2*math.pi*(i/160);r=(95*SS)*(i/160)
            x=mx+r*math.cos(a-math.pi/2);y=my+r*math.sin(a-math.pi/2)
            if prev: d.line([prev[0],prev[1],x,y],fill=A(0.45),width=int(1.3*SS))
            prev=(x,y)
    fa=sg(p,0.82,1)
    if fa>0:
        af=serif(24)
        d.text((cx+340*SS,cy-8*SS),"couronne",font=af,fill=A(0.5*fa))
        s="Ø 41"; d.text((cx+150*SS,cy-150*SS),s,font=af,fill=A(0.5*fa))
        cf=serif(28); cap="Fig. 01 · étude de boîtier"; bb=d.textbbox((0,0),cap,font=cf)
        d.text((cx+460*SS-(bb[2]-bb[0]),cy+560*SS),cap,font=cf,fill=A(0.55*fa))

def fig02(d,p,cx,cy,A):  # pont / bridge
    arcp(d,cx,cy,300*SS,sg(p,0,0.35),A,0.58,2.6)
    arcp(d,cx-4*SS,cy+4*SS,302*SS,sg(p,0.25,0.4),A,0.25,1.0)
    f=sg(p,0.3,0.55)
    if f>0:
        d.arc([cx-230*SS,cy-230*SS,cx+230*SS,cy+230*SS],Lp(200,200,1),Lp(200,200+140*f,1),fill=A(0.55),width=int(2.4*SS))
        d.arc([cx-180*SS,cy-180*SS,cx+180*SS,cy+180*SS],200,200+140*f,fill=A(0.4),width=int(1.4*SS))
    for i,(jx,jy) in enumerate([(-150,-130),(0,-196),(150,-130)]):
        q=sg(p,0.55+i*0.06,0.7+i*0.06)
        if q>0:
            jx*=SS;jy*=SS;rr=14*SS
            d.ellipse([cx+jx-rr,cy+jy-rr,cx+jx+rr,cy+jy+rr],outline=A(0.6),width=int(1.8*SS))
            d.ellipse([cx+jx-5*SS,cy+jy-5*SS,cx+jx+5*SS,cy+jy+5*SS],outline=A(0.45),width=int(1.2*SS))
    q=sg(p,0.78,0.9)
    if q>0:
        d.line([cx-18*SS,cy,cx+18*SS,cy],fill=A(0.5),width=int(2*SS)); d.line([cx,cy-18*SS,cx,cy+18*SS],fill=A(0.5),width=int(2*SS))
    fa=sg(p,0.85,1)
    if fa>0:
        af=serif(24); d.text((cx+150*SS,cy-210*SS),"rubis",font=af,fill=A(0.5*fa))
        cf=serif(28);cap="Fig. 02 · vue de pont";bb=d.textbbox((0,0),cap,font=cf)
        d.text((cx+460*SS-(bb[2]-bb[0]),cy+560*SS),cap,font=cf,fill=A(0.55*fa))

def fig03(d,p,cx,cy,A):  # spiral
    arcp(d,cx,cy,290*SS,sg(p,0,0.3),A,0.58,2.6)
    arcp(d,cx,cy,268*SS,sg(p,0.25,0.4),A,0.4,1.4)
    q=sg(p,0.38,0.52)
    if q>0:
        for ang in (0,90,180,270):
            a=math.radians(ang); d.line([cx+60*SS*math.cos(a),cy+60*SS*math.sin(a),cx+Lp(60,250,q)*SS*math.cos(a),cy+Lp(60,250,q)*SS*math.sin(a)],fill=A(0.5),width=int(2*SS))
    q=sg(p,0.48,0.85)
    if q>0:
        prev=None; segs=int(200*q)
        for i in range(segs+1):
            a=4.0*2*math.pi*(i/200); r=(150*SS)*(i/200)
            x=cx+r*math.cos(a-math.pi/2);y=cy+r*math.sin(a-math.pi/2)
            if prev: d.line([prev[0],prev[1],x,y],fill=A(0.5),width=int(1.5*SS))
            prev=(x,y)
    fa=sg(p,0.85,1)
    if fa>0:
        cf=serif(28);cap="Fig. 03 · le spiral";bb=d.textbbox((0,0),cap,font=cf)
        d.text((cx+460*SS-(bb[2]-bb[0]),cy+560*SS),cap,font=cf,fill=A(0.55*fa))

def fig04(d,p,cx,cy,A):  # caseback 001
    arcp(d,cx,cy,300*SS,sg(p,0,0.3),A,0.58,2.6)
    arcp(d,cx,cy,262*SS,sg(p,0.26,0.4),A,0.45,1.6)
    f=sg(p,0.4,0.5); rd=228*SS; up=int(60*f)
    for i in range(0,up,2):
        a0=math.radians(i*6-90);a1=math.radians((i+1)*6-90)
        d.line([cx+rd*math.cos(a0),cy+rd*math.sin(a0),cx+rd*math.cos(a1),cy+rd*math.sin(a1)],fill=A(0.4),width=int(1.1*SS))
    rs=282*SS
    for i,ang in enumerate([-90,-18,54,126,198,270]):
        q=sg(p,0.45+i*0.02,0.55+i*0.02)
        if q>0:
            a=math.radians(ang);ex,ey=cx+rs*math.cos(a),cy+rs*math.sin(a);rr=10*SS*q
            d.ellipse([ex-rr,ey-rr,ex+rr,ey+rr],outline=A(0.6),width=int(1.6*SS))
    fa=sg(p,0.6,0.8)
    if fa>0:
        nf=serif(64); s="№ 001"; bb=d.textbbox((0,0),s,font=nf)
        d.text((cx-(bb[2]-bb[0])//2,cy-40*SS),s,font=nf,fill=A(0.5*fa))
    q=sg(p,0.75,0.9)
    if q>0:
        w=120*SS;h=70*SS; d.rectangle([cx-w/2,cy-h/2,cx-w/2+w*q,cy+h/2] if False else [cx-150*SS,cy+120*SS,cx+150*SS,cy+190*SS],outline=A(0.0),width=1)
    fa2=sg(p,0.85,1)
    if fa2>0:
        cf=serif(28);cap="Fig. 04 · fond gravé";bb=d.textbbox((0,0),cap,font=cf)
        d.text((cx+460*SS-(bb[2]-bb[0]),cy+560*SS),cap,font=cf,fill=A(0.55*fa2))

def fig05(d,p,cx,cy,A):  # quartz tuning fork
    f=sg(p,0,0.4); topy=cy-240*SS
    if f>0:
        # two prongs
        d.line([cx-70*SS,topy,cx-70*SS,Lp(topy,cy+ -40*SS,f)],fill=A(0.58),width=int(2.4*SS))
        d.line([cx+70*SS,topy,cx+70*SS,Lp(topy,cy+ -40*SS,f)],fill=A(0.58),width=int(2.4*SS))
        d.line([cx-46*SS,topy,cx-46*SS,Lp(topy,cy-44*SS,f)],fill=A(0.4),width=int(1.4*SS))
        d.line([cx+46*SS,topy,cx+46*SS,Lp(topy,cy-44*SS,f)],fill=A(0.4),width=int(1.4*SS))
    q=sg(p,0.35,0.55)
    if q>0:
        d.arc([cx-70*SS,cy-90*SS,cx+70*SS,cy+10*SS],0,180,fill=A(0.55),width=int(2.4*SS))
        d.line([cx,cy-26*SS,cx,cy+Lp(0,150,q)*SS],fill=A(0.55),width=int(2.4*SS))
        d.rectangle([cx-34*SS,cy+150*SS,cx+34*SS,cy+196*SS],outline=A(0.55),width=int(2*SS))
    q=sg(p,0.5,0.75)
    if q>0:
        x0=cx-250*SS; pts=[]; n=int(60*q)
        for i in range(n):
            xx=x0+i*8*SS; yy=cy-150*SS+18*SS*math.sin(i*0.6)
            pts.append((xx,yy))
        if len(pts)>1: d.line(pts,fill=A(0.4),width=int(1.4*SS))
    fa=sg(p,0.7,0.9)
    if fa>0:
        af=serif(24); d.text((cx-250*SS,cy-200*SS),"32 768 Hz",font=af,fill=A(0.5*fa))
    fa2=sg(p,0.85,1)
    if fa2>0:
        cf=serif(28);cap="Fig. 05 · le quartz";bb=d.textbbox((0,0),cap,font=cf)
        d.text((cx+460*SS-(bb[2]-bb[0]),cy+560*SS),cap,font=cf,fill=A(0.55*fa2))

def fig06(d,p,cx,cy,A):  # enamel cross-section
    ys=[-90,-58,-26,6,38,70,102]
    for i,yo in enumerate(ys):
        q=sg(p,i*0.07,i*0.07+0.18)
        if q>0:
            w=280*SS; d.line([cx-w,cy+yo*SS,cx-w+Lp(0,2*w,q),cy+yo*SS],fill=A(0.55 if i in(0,6) else 0.4),width=int((2.4 if i in(0,6) else 1.5)*SS))
    q=sg(p,0.5,0.7)
    if q>0:
        up=int(13*q)
        for i in range(up):
            x=cx-260*SS+i*40*SS; d.line([x,cy+70*SS,x+20*SS,cy+102*SS],fill=A(0.32),width=int(1*SS))
    q=sg(p,0.6,0.8)
    if q>0:
        d.line([cx-40*SS,cy+200*SS,cx-20*SS,cy+Lp(200,140,q)*SS,cx+8*SS,cy+200*SS],fill=A(0.4),width=int(1.4*SS),joint="curve")
    fa=sg(p,0.8,1)
    if fa>0:
        af=serif(24); d.text((cx-470*SS,cy-110*SS),"six couches",font=af,fill=A(0.5*fa))
        d.text((cx-60*SS,cy+250*SS),"feu · 800 °C",font=af,fill=A(0.5*fa))
        cf=serif(28);cap="Fig. 06 · coupe d'un cadran";bb=d.textbbox((0,0),cap,font=cf)
        d.text((cx+460*SS-(bb[2]-bb[0]),cy+360*SS),cap,font=cf,fill=A(0.55*fa))

def fig07(d,p,cx,cy,A):  # crown exploded
    f=sg(p,0,0.35)
    if f>0:
        d.arc([cx+40*SS,cy-160*SS,cx+360*SS,cy+160*SS],90,90+180*f,fill=A(0.5),width=int(2.4*SS))
    arcp(d,cx,cy,160*SS,sg(p,0.3,0.55),A,0.58,2.6)
    arcp(d,cx,cy,118*SS,sg(p,0.5,0.65),A,0.45,1.6)
    q=sg(p,0.45,0.62); rs=160*SS
    if q>0:
        up=int(24*q)
        for i in range(up):
            a=math.radians(i*15-90); d.line([cx+rs*math.cos(a),cy+rs*math.sin(a),cx+(rs+16*SS)*math.cos(a),cy+(rs+16*SS)*math.sin(a)],fill=A(0.4),width=int(1.6*SS))
    q=sg(p,0.65,0.82)
    if q>0:
        d.rectangle([cx-330*SS,cy-34*SS,cx-330*SS+Lp(0,120*SS,q),cy+34*SS],outline=A(0.5),width=int(2*SS))
        d.line([cx-210*SS,cy,cx-Lp(210,166,q)*SS,cy],fill=A(0.4),width=int(1.4*SS))
    fa=sg(p,0.82,1)
    if fa>0:
        af=serif(24); d.text((cx+170*SS,cy-150*SS),"couronne · vue éclatée",font=af,fill=A(0.5*fa))
        cf=serif(28);cap="Fig. 07 · la couronne";bb=d.textbbox((0,0),cap,font=cf)
        d.text((cx+460*SS-(bb[2]-bb[0]),cy+460*SS),cap,font=cf,fill=A(0.55*fa))

PLATES={1:fig01,2:fig02,3:fig03,4:fig04,5:fig05,6:fig06,7:fig07}

def wrap(d,text,font,maxw):
    words=text.split(); lines=[]; cur=""
    for w in words:
        t=(cur+" "+w).strip()
        if d.textlength(t,font=font)<=maxw: cur=t
        else:
            if cur: lines.append(cur)
            cur=w
    if cur: lines.append(cur)
    return lines

POSTS=[
 dict(date="2026-06-12",slug="welcome",kick="DROP №",fig=1,
   head="For the ones who turn the watch over.",
   sub="Notes on fine watchmaking. Maisons, calibres, and the culture of collecting."),
 dict(date="2026-06-15",slug="you-cannot-buy",kick="PROVENANCE",fig=7,
   head="You cannot buy this watch.",
   sub="The waiting list is eight years. Retail has become an audition."),
 dict(date="2026-06-17",slug="the-hairspring-question",kick="ATELIER",fig=3,
   head="“In-house calibre” is the most abused phrase in watchmaking.",
   sub="One detail tells the truth: ask who makes the hairspring."),
 dict(date="2026-06-19",slug="the-most-expensive-number",kick="PROVENANCE",fig=4,
   head="The most expensive number in watchmaking is 001.",
   sub="Collectors call it the founder's piece. The maison keeps it, or chooses who gets it."),
 dict(date="2026-06-22",slug="independence",kick="ARCHIVES",fig=2,
   head="Independence is the rarest complication.",
   sub="Le Brassus, 1875. Never sold, never merged, never left the family's hands."),
 dict(date="2026-06-24",slug="grand-feu",kick="ATELIER",fig=6,
   head="A master enameller loses one dial in three.",
   sub="Grand feu: powdered glass, fired at 800°C, layer after layer."),
 dict(date="2026-06-26",slug="scarcity-worked-too-well",kick="ARCHIVES",fig=5,
   head="The quartz crisis killed two thirds of Swiss watchmaking jobs.",
   sub="The survivors became unreasonable. Half a century on, you cannot get those pieces at retail."),
]

OUT="/sessions/affectionate-loving-turing/mnt/FlashSales/social/drive-batch-01"
os.makedirs(OUT,exist_ok=True)

def kicker_spaced(s):
    return "  ".join(list(s)) if s!="DROP №" else "D R O P   №"

def render_card(post, W, H, p, plate_alpha, plate_cy, head_top, hsize):
    sw,sh=W*SS,H*SS
    base=Image.new("RGBA",(sw,sh),BG+(255,))
    ov=Image.new("RGBA",(sw,sh),(0,0,0,0)); d=ImageDraw.Draw(ov)
    cx=int(0.52*W)*SS
    def A(a):
        v=max(0,min(1,a*plate_alpha)); return (INK[0],INK[1],INK[2],int(255*v))
    PLATES[post["fig"]](d, p, cx, int(plate_cy*SS), A)
    # text reveal alphas (for reel use p-based windows; for static p=1 -> all)
    ta=1.0 if p>=0.999 else None
    margin=96*SS
    # kicker
    ka = 1.0 if ta else sg(p,0.12,0.30)
    if ka>0:
        kf=sans(26); s=kicker_spaced(post["kick"])
        d.text((margin,(head_top-150)*SS),s,font=kf,fill=(CHMP[0],CHMP[1],CHMP[2],int(255*ka)))
    # headline
    hf=serif(hsize)
    lines=wrap(d,post["head"],hf,(W-2*96-4)*SS)
    y=head_top*SS; lh=int(hsize*1.16*SS)
    for i,ln in enumerate(lines):
        la=1.0 if ta else sg(p,0.30+i*0.06,0.46+i*0.06)
        if la>0:
            yy=int(y+(1-la)*40*SS)
            d.text((margin,yy),ln,font=hf,fill=(INK[0],INK[1],INK[2],int(255*la)))
        y+=lh
    # subline
    sa=1.0 if ta else sg(p,0.6,0.74)
    if sa>0:
        sf=sans(30); sl=wrap(d,post["sub"],sf,(W-2*96)*SS); yy=y+24*SS
        for ln in sl:
            d.text((margin,yy),ln,font=sf,fill=(SOFT[0],SOFT[1],SOFT[2],int(255*sa)))
            yy+=int(46*SS)
    # bottom rule + wordmark
    ra=1.0 if ta else sg(p,0.62,0.74)
    if ra>0: d.line([margin,(H-170)*SS,margin+int(60*SS*ra),(H-170)*SS],fill=(CHMP[0],CHMP[1],CHMP[2],255),width=int(2.4*SS))
    wa=1.0 if ta else sg(p,0.7,0.84)
    if wa>0:
        wf=serif(44); d.text((margin,(H-140)*SS),"Drop №",font=wf,fill=(INK[0],INK[1],INK[2],int(255*wa)))
    base.alpha_composite(ov)
    return base.convert("RGB").resize((W,H),Image.LANCZOS)

def hsize_for(post):
    return {"welcome":92,"you-cannot-buy":92,"the-most-expensive-number":78,"independence":86,
            "a-master":80}.get(post["slug"],66 if len(post["head"])>60 else 84)

if sys.argv[1]=="posts":
    for post in POSTS:
        img=render_card(post, 1080,1350, 1.0, 0.16, 980, 250, hsize_for(post))
        fn=f"{OUT}/{post['date']}_post_{post['slug']}.png"; img.save(fn); print("post",fn)
    print("POSTS_DONE")
elif sys.argv[1]=="reelframes":
    idx=int(sys.argv[2]); post=POSTS[idx]
    fdir=f"/tmp/reel/fr_{post['slug']}"; os.makedirs(fdir,exist_ok=True)
    FPS=30; DUR=5.0; N=int(FPS*DUR); t0=time.time(); did=0
    for i in range(N):
        fp=f"{fdir}/f{i:04d}.png"
        if os.path.exists(fp): continue
        t=i/(N-1)
        # map t to plate progress p and let render_card use p<1 for reveal
        img=render_card(post,1080,1920,t,0.55,1300,440,hsize_for(post))
        img.save(fp); did+=1
        if time.time()-t0>32: break
    done=len([f for f in os.listdir(fdir) if f.endswith('.png')])
    print(f"REEL {post['slug']} {done}/{N}")
