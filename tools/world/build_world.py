#!/usr/bin/env python3
"""Build compact world data for the web game from Natural Earth 50m (public domain).
Outputs deflate-compressed, base64 blobs:
  - geo mask 4096x2048: 1 bit land/water (lakes = water) with manual strait carving
  - rivers 4096x2048: 1 bit
  - climate 1024x512 RGBA: temperature, moisture, mountain, ice
"""
import json, zlib, base64, math, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage

W, H = 4096, 2048
CW, CH = 1024, 512


def lonlat2px(lon, lat, w=W, h=H):
    return ((lon + 180.0) / 360.0 * w, (90.0 - lat) / 180.0 * h)


def draw_geom(draw, geom, fill, w=W, h=H):
    t = geom['type']
    cs = geom['coordinates']
    polys = [cs] if t == 'Polygon' else (cs if t == 'MultiPolygon' else [])
    for poly in polys:
        for ri, ring in enumerate(poly):
            pts = [lonlat2px(x, y, w, h) for x, y in ring]
            if len(pts) >= 3:
                draw.polygon(pts, fill=(fill if ri == 0 else 0))


def load(fn):
    return json.load(open(fn))['features']

# ---------------------------------------------------------------- land mask
land = Image.new('L', (W, H), 0)
d = ImageDraw.Draw(land)
for f in load('ne/ne_50m_land.geojson'):
    draw_geom(d, f['geometry'], 255)
lakes = Image.new('L', (W, H), 0)
dl = ImageDraw.Draw(lakes)
for f in load('ne/ne_50m_lakes.geojson'):
    draw_geom(dl, f['geometry'], 255)
m = (np.array(land) > 127) & ~(np.array(lakes) > 127)

# manual islands (tiny islands hosting ports) : lat, lon, radius(px)
ISLANDS = [
    (0.80, 127.37, 1.6),   # Ternate
    (27.07, 56.46, 1.3),   # Hormuz
    (-15.03, 40.74, 0.9),  # Mozambique island (near coast)
    (-8.96, 39.52, 0.9),   # Kilwa Kisiwani
    (38.72, -27.22, 1.6),  # Terceira (Azores)
    (32.73, -16.95, 2.0),  # Madeira
    (14.95, -23.60, 1.8),  # Santiago (Cape Verde)
    (0.25, 6.60, 1.8),     # Sao Tome
    (-3.65, 128.18, 1.8),  # Ambon
    (35.90, 14.40, 1.2),   # Malta
    (-27.12, -109.35, 1.4),  # Easter island
    (-0.6, -90.4, 2.2),    # Galapagos (Santa Cruz)
    (-8.55, 119.45, 1.6),  # Komodo
    (-11.7, 43.3, 1.6),    # Grande Comore
]
yy, xx = np.mgrid[0:H, 0:W]
for lat, lon, r in ISLANDS:
    cx, cy = lonlat2px(lon, lat)
    x0, x1 = int(cx - r - 2), int(cx + r + 3)
    y0, y1 = int(cy - r - 2), int(cy + r + 3)
    sub = (xx[y0:y1, x0:x1] - cx) ** 2 + (yy[y0:y1, x0:x1] - cy) ** 2 <= r * r
    m[y0:y1, x0:x1] |= sub

# manual water carving: polylines (lat,lon) with width px
CARVE = [
    ([(35.93, -6.25), (35.96, -5.75), (35.98, -5.45), (36.05, -5.15)], 2.6),   # Gibraltar
    ([(41.30, 29.18), (41.12, 29.07), (41.02, 29.00), (40.93, 28.95)], 1.9),   # Bosporus
    ([(39.98, 26.10), (40.12, 26.33), (40.30, 26.58), (40.45, 26.78)], 1.9),   # Dardanelles
    ([(55.30, 12.85), (55.60, 12.75), (55.95, 12.62), (56.20, 12.50)], 1.8),   # Oresund
    ([(38.32, 15.66), (38.15, 15.62), (37.95, 15.55)], 1.6),                   # Messina
    ([(45.15, 36.45), (45.32, 36.55), (45.48, 36.62)], 1.6),                   # Kerch
    ([(36.76, -6.42), (36.92, -6.28), (37.08, -6.14), (37.24, -6.06), (37.38, -6.00)], 1.5),  # Guadalquivir
    ([(51.46, 1.35), (51.50, 0.90), (51.47, 0.50), (51.50, 0.10), (51.50, -0.10)], 1.5),    # Thames
    ([(45.65, -1.25), (45.35, -0.88), (45.05, -0.64), (44.85, -0.57)], 1.5),              # Gironde
    ([(49.46, 0.02), (49.42, 0.40), (49.38, 0.78), (49.44, 1.08)], 1.4),                  # Seine
    ([(47.26, -2.28), (47.25, -1.90), (47.21, -1.56)], 1.4),                               # Loire
    ([(51.45, 3.55), (51.40, 4.00), (51.30, 4.28), (51.23, 4.40)], 1.4),                  # Scheldt
    ([(53.92, 8.55), (53.80, 9.10), (53.65, 9.60), (53.55, 9.97)], 1.5),                  # Elbe
    ([(53.62, 8.48), (53.40, 8.50), (53.20, 8.66), (53.08, 8.80)], 1.4),                  # Weser
    ([(54.64, 19.88), (54.66, 20.10), (54.70, 20.40), (54.71, 20.50)], 1.4),              # Pillau->Konigsberg
    ([(22.25, 113.70), (22.60, 113.62), (22.90, 113.48), (23.10, 113.30)], 1.5),          # Pearl river
    ([(13.40, 100.58), (13.70, 100.52), (14.00, 100.55), (14.35, 100.57)], 1.4),          # Chao Phraya
    ([(21.55, 88.10), (22.00, 88.10), (22.30, 88.24), (22.57, 88.33)], 1.4),              # Hooghly
    ([(29.85, 48.65), (30.20, 48.30), (30.50, 47.85)], 1.5),                               # Shatt al-Arab
    ([(-52.40, -68.35), (-52.55, -69.40), (-53.20, -70.30), (-53.75, -70.95), (-53.95, -71.60), (-53.50, -72.60), (-52.90, -73.50), (-52.60, -74.60)], 1.8),  # Magellan
    ([(1.20, 103.60), (1.22, 104.00), (1.30, 104.35)], 1.6),                               # Singapore strait
    ([(12.60, 43.30), (12.50, 43.45)], 1.8),                                               # Bab el Mandeb
    ([(41.60, 2.30), (41.60, 2.30)], 0.0),
]


def carve_line(mask, pts, width):
    img = Image.new('L', (W, H), 0)
    dd = ImageDraw.Draw(img)
    pp = [lonlat2px(lon, lat) for lat, lon in pts]
    wpx = max(1, int(round(width * 2)))
    if len(pp) >= 2 and width > 0:
        dd.line(pp, fill=255, width=wpx)
        for p in pp:
            r = width
            dd.ellipse([p[0] - r, p[1] - r, p[0] + r, p[1] + r], fill=255)
    a = np.array(img) > 127
    mask &= ~a

for pts, wdt in CARVE:
    carve_line(m, pts, wdt)

# ---------------------------------------------------------------- ocean connectivity (main ocean)
water = ~m
lab, n = ndimage.label(water)
# the component containing mid-Atlantic
ax, ay = lonlat2px(-30, 30)
main = lab == lab[int(ay), int(ax)]
print('water components', n, 'main frac', main.mean())
ocean = main

# ---------------------------------------------------------------- rivers
riv = Image.new('L', (W, H), 0)
dr = ImageDraw.Draw(riv)
for f in load('ne/ne_50m_rivers_lake_centerlines.geojson'):
    p = f['properties']
    if p.get('featurecla') != 'River':
        continue
    if (p.get('name') or '').startswith('Panama'):
        continue
    sr = p.get('scalerank') or 9
    if sr > 6:
        continue
    g = f['geometry']
    lines = [g['coordinates']] if g['type'] == 'LineString' else g['coordinates']
    width = 2 if sr <= 3 else 1
    for ln in lines:
        pts = [lonlat2px(x, y) for x, y in ln]
        if len(pts) >= 2:
            dr.line(pts, fill=255, width=width)
rv = (np.array(riv) > 127) & m

# ---------------------------------------------------------------- climate 1024x512
regions = load('ne/ne_50m_geography_regions_polys.geojson')


def poly_layer(filter_fn, w=CW, h=CH, blur=0):
    img = Image.new('L', (w, h), 0)
    dd = ImageDraw.Draw(img)
    for f in regions:
        p = f['properties']
        v = filter_fn(p)
        if v:
            draw_geom(dd, f['geometry'], int(v), w, h)
    if blur:
        img = img.filter(ImageFilter.GaussianBlur(blur))
    return np.array(img).astype(np.float32) / 255.0

cla = lambda p: p.get('FEATURECLA')
nm = lambda p: (p.get('NAME') or '').upper()
MAJOR_RANGES = {'HIMALAYAS': 1.0, 'KARAKORAM RA.': 1.0, 'PAMIRS': 1.0, 'HINDU KUSH': 0.9, 'KUNLUN MOUNTAINS': 0.9,
                'ANDES': 1.0, 'ALPS': 0.9, 'ROCKY MOUNTAINS': 0.8, 'CAUCASUS MTS.': 0.85, 'TIAN SHAN': 0.9,
                'ZAGROS MOUNTAINS': 0.6, 'ATLAS MOUNTAINS': 0.6, 'HAUT ATLAS': 0.7, 'ETHIOPIAN HIGHLANDS': 0.6,
                'ALTAY MOUNTAINS': 0.7, 'URAL MOUNTAINS': 0.4, 'APPALACHIAN MTS.': 0.4, 'COAST MOUNTAINS': 0.7,
                'CASCADE RANGE': 0.6, 'ALASKA RANGE': 0.8, 'BROOKS RANGE': 0.6, 'DRAKENSBERG': 0.5,
                'GREAT DIVIDING RANGE': 0.35}
mount = poly_layer(lambda p: 255 * MAJOR_RANGES.get(nm(p), 0.5) if cla(p) == 'Range/mtn' else 0, blur=1.2)
HIGH_PLAT = {'PLATEAU OF TIBET': 0.85, 'ALTIPLANO': 0.8, 'MONGOLIAN PLATEAU': 0.35, 'PENÍNSULA IBÉRICA': 0.25,
             'DECCAN PLATEAU': 0.2, 'ALTI-PLANICIE MEXICANA': 0.4, 'COLORADO PLATEAU': 0.35, 'BRAZILIAN HIGHLANDS': 0.2,
             'YUNGUI PLATEAU': 0.4, 'SHAN PLATEAU': 0.3, 'CENTRAL SIBERIAN PLATEAU': 0.2}
plat = poly_layer(lambda p: 255 * HIGH_PLAT.get(nm(p), 0.0) if cla(p) == 'Plateau' else 0, blur=2.0)
desert = poly_layer(lambda p: 255 if cla(p) == 'Desert' and nm(p) not in ('PUNJAB', 'CAATINGAS') else (130 if nm(p) in ('CAATINGAS',) else 0), blur=2.5)
steppe = poly_layer(lambda p: 255 if nm(p) in ('KAZAKH STEPPE', 'PONTIC STEPPE', 'SAHEL', 'GREAT PLAINS', 'PAMPAS', 'TURAN LOWLAND', 'GRAN CHACO', 'LLANOS', 'NULLARBOR PLAIN', 'CASPIAN DEPRESSION', 'MONGOLIAN PLATEAU', 'GREAT BASIN', 'Iwembere Steppe'.upper(), 'ANATOLIA', 'BALUCHISTAN', 'OGADEN') else 0, blur=3.0)
jungle = poly_layer(lambda p: 255 if nm(p) in ('CONGO BASIN', 'AMAZON BASIN', 'SELVAS', 'YUNGAS', 'GUIANA SHIELD', 'BORNEO', 'SUMATRA', 'NEW GUINEA', 'MALAY PENINSULA', 'Costa de los Mosquitos'.upper(), 'NIGER DELTA', 'PANTANAL', 'SULAWESI', 'JAVA', 'MINDANAO', 'LUZON') else 0, blur=3.0)
tundra = poly_layer(lambda p: 255 if cla(p) == 'Tundra' or nm(p) in ('NORTH SLOPE', 'NORTH SIBERIAN LOWLAND', 'KOLYMA LOWLAND', 'BARREN GROUNDS', 'TAYMYR PENINSULA', 'YAMAL PENINSULA', 'GYDA PENINSULA') else 0, blur=2.0)
icecap = poly_layer(lambda p: 255 if nm(p) in ('GREENLAND', 'ANTARCTICA') or cla(p) == 'Coast' and False else 0, blur=1.0)

lat = 90.0 - (np.arange(CH) + 0.5) / CH * 180.0
lon = -180.0 + (np.arange(CW) + 0.5) / CW * 360.0
LON, LAT = np.meshgrid(lon, lat)
alat = np.abs(LAT)

# land at climate res
mland = np.array(Image.fromarray((m * 255).astype(np.uint8)).resize((CW, CH), Image.BILINEAR)).astype(np.float32) / 255.0
landb = mland > 0.3
# continentality: distance from ocean in climate px (1 px = 0.35 deg)
dist_ocean = ndimage.distance_transform_edt(landb)
cont = np.clip(dist_ocean / 40.0, 0, 1)   # ~14 deg to full continental

# elevation proxy
elev = np.clip(np.maximum(mount, plat * 0.9), 0, 1)

# temperature 0..1 (1 hot)
temp = np.cos(np.radians(LAT)) ** 1.25
temp = temp - 0.45 * elev
# gulf stream warming NW Europe, cold siberia interior
temp += 0.08 * np.exp(-(((LON - 5) / 25.0) ** 2 + ((LAT - 55) / 12.0) ** 2))
temp -= 0.06 * cont * (alat > 35)
temp = np.clip(temp, 0, 1)

# moisture 0..1 by latitude profile
moist = 0.55 + 0.4 * np.exp(-(LAT / 11.0) ** 2) - 0.35 * np.exp(-((alat - 25) / 8.0) ** 2) + 0.12 * np.exp(-((alat - 52) / 12.0) ** 2) - 0.25 * (alat > 68)
moist -= 0.28 * cont
moist -= 0.75 * desert
moist -= 0.25 * steppe
moist += 0.45 * jungle
# Mediterranean dry summer
med = np.exp(-(((LAT - 38) / 5.5) ** 2 + ((LON - 15) / 28.0) ** 2))
moist -= 0.12 * med
# Monsoon Asia wet (India east, SE Asia, south China)
moist += 0.25 * np.exp(-(((LAT - 20) / 10.0) ** 2 + ((LON - 100) / 22.0) ** 2))
moist += 0.15 * np.exp(-(((LAT - 22) / 6.0) ** 2 + ((LON - 85) / 8.0) ** 2))
# Australia interior dry
moist -= 0.3 * np.exp(-(((LAT + 25) / 9.0) ** 2 + ((LON - 133) / 14.0) ** 2))
# Eastern US wetter, Atacama/peru coast dry
moist += 0.12 * np.exp(-(((LAT - 35) / 9.0) ** 2 + ((LON + 83) / 12.0) ** 2))
moist -= 0.45 * np.exp(-(((LAT + 18) / 10.0) ** 2 + ((LON + 71) / 3.5) ** 2))
moist = np.clip(moist, 0, 1)

ice = np.clip(icecap * 1.0 + np.clip((alat - 70) / 8.0, 0, 1) * 0.9 + np.clip((elev - 0.7) / 0.3, 0, 1) * 0.5, 0, 1)
ice = np.where(LAT < -62, 1.0, ice)

clim = np.zeros((CH, CW, 4), np.uint8)
clim[..., 0] = (temp * 255).astype(np.uint8)
clim[..., 1] = (moist * 255).astype(np.uint8)
clim[..., 2] = (np.clip(elev, 0, 1) * 255).astype(np.uint8)
clim[..., 3] = (ice * 255).astype(np.uint8)

# ---------------------------------------------------------------- write outputs
def pack_bits(a):
    return np.packbits(a.astype(np.uint8), axis=1, bitorder='little').tobytes()

geo_bits = pack_bits(m)
riv_bits = pack_bits(rv)
ocean_bits = pack_bits(ocean)
out = {
    'W': W, 'H': H, 'CW': CW, 'CH': CH,
    'land': base64.b64encode(zlib.compress(geo_bits, 9)).decode(),
    'river': base64.b64encode(zlib.compress(riv_bits, 9)).decode(),
    'ocean': base64.b64encode(zlib.compress(ocean_bits, 9)).decode(),
    'climate': base64.b64encode(zlib.compress(clim.tobytes(), 9)).decode(),
}
for k in ('land', 'river', 'ocean', 'climate'):
    print(k, len(out[k]))
json.dump(out, open('world_blobs.json', 'w'))
np.save('mask.npy', m)
np.save('ocean.npy', ocean)
np.save('river.npy', rv)
Image.fromarray(clim[..., :3]).save('climate_rgb.png')
Image.fromarray(clim[..., 3]).save('climate_ice.png')
Image.fromarray((m * 255).astype(np.uint8)).save('mask_final.png')
print('done')
