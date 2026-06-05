#!/usr/bin/env python3
"""
Génère les assets PNG des emails à partir des SVG du site (filigrane + étapes
du mécanisme). Le SVG inline n'est rendu que par Apple Mail ; pour un rendu
identique partout (Gmail, Outlook, Yahoo) on rasterise en PNG transparent retina
via Chrome headless, puis on héberge sous public/email/.

Usage : python3 scripts/email-assets/build.py
Régénère public/email/*.png. À relancer si le design du site change.
"""
import math
import os
import subprocess
import sys
import tempfile

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = os.path.join(ROOT, "public", "email")
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

CHAMP = "#c4ac82"
CHAMP_DEEP = "#8c7a52"
CHAMP_FILL = "#c4ac82"
INK = "#221d17"
INK_SOFT = "#b3ab9c"
MONO = "ui-monospace, 'SF Mono', Menlo, monospace"


def gear(cx, cy, r, teeth, sw, color, opacity):
    parts = [f'<g opacity="{opacity}" stroke="{color}" fill="none">']
    parts.append(f'<circle cx="{cx}" cy="{cy}" r="{r}" stroke-width="{sw}"/>')
    parts.append(f'<circle cx="{cx}" cy="{cy}" r="{r*0.42:.1f}" stroke-width="{sw}"/>')
    parts.append(f'<circle cx="{cx}" cy="{cy}" r="1.4" fill="{color}" stroke="none"/>')
    for i in range(teeth):
        a = (i / teeth) * 2 * math.pi
        x1 = cx + r * math.cos(a)
        y1 = cy + r * math.sin(a)
        x2 = cx + (r + 3) * math.cos(a)
        y2 = cy + (r + 3) * math.sin(a)
        parts.append(
            f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke-width="{sw}"/>'
        )
    parts.append("</g>")
    return "".join(parts)


def reg_ticks(w, h, inset=8, t=6, color=CHAMP):
    pts = [(inset, inset), (w - inset, inset), (inset, h - inset), (w - inset, h - inset)]
    out = [f'<g stroke="{color}" stroke-width="1" opacity="0.7">']
    for x, y in pts:
        dx = t if x < w / 2 else -t
        dy = t if y < h / 2 else -t
        out.append(f'<line x1="{x}" y1="{y}" x2="{x+dx}" y2="{y}"/>')
        out.append(f'<line x1="{x}" y1="{y}" x2="{x}" y2="{y+dy}"/>')
    out.append("</g>")
    return "".join(out)


def filigrane():
    ticks = []
    for i in range(60):
        major = i % 5 == 0
        ang = math.radians(i * 6 - 90)
        outer = 84
        inner = 84 - (7 if major else 4)
        x1 = 100 + outer * math.cos(ang)
        y1 = 100 + outer * math.sin(ang)
        x2 = 100 + inner * math.cos(ang)
        y2 = 100 + inner * math.sin(ang)
        sw = 1.4 if major else 0.8
        op = 1 if major else 0.6
        ticks.append(
            f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke-width="{sw}" opacity="{op}"/>'
        )
    return f"""<svg viewBox="0 0 200 200" fill="none" stroke="{CHAMP}" stroke-linecap="round">
  <circle cx="100" cy="100" r="84" stroke-width="1"/>
  <circle cx="100" cy="100" r="62" stroke-width="1" opacity="0.65"/>
  {''.join(ticks)}
  <line x1="100" y1="78" x2="100" y2="122" stroke-width="1"/>
  <line x1="78" y1="100" x2="122" y2="100" stroke-width="1"/>
  <circle cx="100" cy="100" r="4" stroke-width="1.2"/>
  <g stroke-width="1">
    <path d="M14 30 V14 H30"/><path d="M170 14 H186 V30"/>
    <path d="M186 170 V186 H170"/><path d="M30 186 H14 V170"/>
  </g>
</svg>"""


def step_sealed():
    return f"""<svg viewBox="0 0 160 140" fill="none" stroke-linecap="round" stroke-linejoin="round">
  {reg_ticks(160,140)}
  {gear(32,114,12,9,1.1,INK_SOFT,0.7)}
  <rect x="42" y="44" width="76" height="62" rx="3" stroke="{INK}" stroke-width="1.7"/>
  <rect x="66" y="40" width="28" height="6" rx="3" fill="{INK}"/>
  <line x1="80" y1="14" x2="80" y2="36" stroke="{CHAMP}" stroke-width="1.2" stroke-dasharray="3 3"/>
  <path d="M75 31 L80 37 L85 31" stroke="{CHAMP}" stroke-width="1.2"/>
  <rect x="56" y="60" width="48" height="34" rx="2" stroke="{CHAMP}" stroke-width="1.2" stroke-dasharray="3 3"/>
  <text x="80" y="84" text-anchor="middle" font-family="{MONO}" font-size="18" fill="{CHAMP}">&#8364;</text>
  <line x1="94" y1="44" x2="124" y2="30" stroke="{CHAMP}" stroke-width="0.8" stroke-dasharray="2 2"/>
  <text x="126" y="28" font-family="{MONO}" font-size="7" letter-spacing="1" fill="{CHAMP}">T-1H</text>
  <text x="14" y="22" font-family="{MONO}" font-size="9" letter-spacing="2" fill="{CHAMP}">01</text>
</svg>"""


def step_reveal():
    bars = [(58, 58, 18), (76, 48, 28), (94, 60, 16)]
    b = "".join(
        f'<rect x="{x}" y="{y}" width="10" height="{h}" stroke="{INK}" stroke-width="1.3"/>'
        f'<rect x="{x}" y="{y}" width="10" height="4" fill="{CHAMP_FILL}" opacity="0.55"/>'
        for x, y, h in bars
    )
    return f"""<svg viewBox="0 0 160 140" fill="none" stroke-linecap="round" stroke-linejoin="round">
  {reg_ticks(160,140)}
  {gear(130,116,11,9,1.1,INK_SOFT,0.7)}
  <rect x="42" y="66" width="76" height="40" rx="3" stroke="{INK}" stroke-width="1.7"/>
  <path d="M42 66 L56 48 L132 48 L118 66" stroke="{INK}" stroke-width="1.7"/>
  {b}
  <circle cx="126" cy="30" r="12" stroke="{CHAMP}" stroke-width="1.2"/>
  <line x1="126" y1="30" x2="126" y2="22" stroke="{CHAMP}" stroke-width="1.2"/>
  <line x1="126" y1="30" x2="132" y2="32" stroke="{CHAMP}" stroke-width="1.2"/>
  <text x="14" y="22" font-family="{MONO}" font-size="9" letter-spacing="2" fill="{CHAMP}">02</text>
</svg>"""


def step_clearing():
    baseline, clearing, w = 110, 62, 14
    bars = [(30, 40, 1), (49, 50, 1), (68, 62, 1), (87, 72, 0), (106, 86, 0)]
    fills = "".join(
        f'<rect x="{x}" y="{clearing}" width="{w}" height="{baseline-clearing}" fill="{CHAMP_FILL}" opacity="0.22"/>'
        for x, top, win in bars if win
    )
    outs = "".join(
        f'<rect x="{x}" y="{top}" width="{w}" height="{baseline-top}" stroke="{INK}" stroke-width="1.3"/>'
        for x, top, win in bars
    )
    return f"""<svg viewBox="0 0 160 140" fill="none" stroke-linecap="round" stroke-linejoin="round">
  {reg_ticks(160,140)}
  {gear(134,118,10,8,1.1,INK_SOFT,0.7)}
  {fills}{outs}
  <line x1="24" y1="{baseline}" x2="134" y2="{baseline}" stroke="{INK}" stroke-width="1.7"/>
  <line x1="20" y1="{clearing}" x2="140" y2="{clearing}" stroke="{CHAMP}" stroke-width="1.2" stroke-dasharray="3 3"/>
  <circle cx="75" cy="{clearing}" r="3" fill="{CHAMP}"/>
  <text x="122" y="58" font-family="{MONO}" font-size="8" letter-spacing="1" fill="{CHAMP}">N&#7497;</text>
  <text x="14" y="22" font-family="{MONO}" font-size="9" letter-spacing="2" fill="{CHAMP}">03</text>
</svg>"""


# nom -> (svg, largeur CSS, hauteur CSS, opacité globale)
ASSETS = {
    "filigrane": (filigrane(), 220, 220, 1.0),
    "step-01": (step_sealed(), 160, 140, 1.0),
    "step-02": (step_reveal(), 160, 140, 1.0),
    "step-03": (step_clearing(), 160, 140, 1.0),
}


def render(name, svg, w, h, opacity):
    html = f"""<!doctype html><html><head><meta charset="utf-8">
<style>html,body{{margin:0;padding:0;background:transparent}}
svg{{display:block;width:{w}px;height:{h}px;opacity:{opacity}}}</style></head>
<body>{svg}</body></html>"""
    with tempfile.NamedTemporaryFile("w", suffix=".html", delete=False, encoding="utf-8") as fh:
        fh.write(html)
        path = fh.name
    out = os.path.join(OUT, f"{name}.png")
    cmd = [
        CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars",
        "--force-device-scale-factor=2", "--default-background-color=00000000",
        f"--screenshot={out}", f"--window-size={w},{h}", f"file://{path}",
    ]
    r = subprocess.run(cmd, capture_output=True, text=True)
    os.unlink(path)
    ok = os.path.exists(out)
    print(f"  {'✓' if ok else '✗'} {name}.png ({w*2}×{h*2})")
    if not ok:
        print(r.stderr[-400:], file=sys.stderr)
    return ok


def main():
    if not os.path.exists(CHROME):
        print(f"Chrome introuvable : {CHROME}", file=sys.stderr)
        return 1
    os.makedirs(OUT, exist_ok=True)
    print(f"Rendu des assets email -> {OUT}")
    ok = all(render(n, *v) for n, v in ASSETS.items())
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
