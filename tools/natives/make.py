"""북미 원주민 마을 건물 그림(images/exterior-styles/woodland·plains·pueblo)을 만든다.
   재료: 마사이 시장 그림(masai/market.webp)의 초가 지붕 결을 떼어 나무껍질·거적 결에 섞고, 모양(긴 집·위그웜·티피·울타리·흙벽돌 집)은 코드로 짠다.
   python tools/natives/make.py            # 모두
   python tools/natives/make.py W_trade    # 하나만"""
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build import *
OUT = SRC
B = 505
def base(cv, w, seed=1, shadow=True):
    cx = cv.w / S / 2
    if shadow: cv.shadow(cx, B, w / 2 - 10, 20)
    ground(cv, cx, B, w, seed)
def save(cv, bundle, kind, seed=0):
    finish(cv, seed); im = cv.out(H=660, pad=5) if kind == 'market' else cv.out()
    os.makedirs(OUT + bundle, exist_ok=True); im.save(OUT + bundle + '/' + kind + '.webp', quality=88, method=6)
    return im
# ================================================================= 숲 (동부 삼림: 이로쿼이·체로키·포와탄 …)
def W_trade():
    cv = Canvas(760, 520); base(cv, 740, 1)
    longhouse(cv, 50, 500, 640, 290, 1); rack(cv, 648, 506, 90, 150, 5)
    basket(cv, 330, 506, 38, 3); pot(cv, 380, 506, 44); basket(cv, 425, 507, 30, 4)
    save(cv, 'woodland', 'trade', 1)
def W_tavern():
    cv = Canvas(700, 520); base(cv, 680, 2)
    longhouse(cv, 40, 498, 520, 270, 11, fire=True, holes=1)
    tripod_fire(cv, 600, 506, 80, 4)
    log(cv, 470, 488, 506, 16, 5); log(cv, 520, 490, 506, 14, 6)
    save(cv, 'woodland', 'tavern', 2)
def W_inn():
    cv = Canvas(700, 520); base(cv, 680, 3)
    wigwam(cv, 470, 500, 150, 175, 5); wigwam(cv, 240, 505, 195, 225, 2, True)
    basket(cv, 590, 508, 30, 5); pot(cv, 620, 508, 34, 3, (120, 70, 44))
    save(cv, 'woodland', 'inn', 3)
def W_church():
    cv = Canvas(660, 520); base(cv, 640, 4)
    tipi(cv, 200, 498, 230, 380, 3); tipi(cv, 410, 506, 300, 480, 7, (40, 70, 110), (150, 50, 36))
    save(cv, 'woodland', 'church', 4)
def W_market():
    cv = Canvas(1000, 660); cx = 500; B2 = 645
    cv.shadow(cx, B2, 470, 22); ground(cv, cx, B2, 980, 9)
    xs = [110, 330, 560, 790, 900]
    roof_mat(cv, [(60, 300), (500, 250), (940, 300), (960, 340), (40, 340)], 9, (160, 136, 100), 0.95)
    for i, x in enumerate([90, 300, 500, 700, 910]): log(cv, x, 300, B2, 14, 20 + i)
    lines(cv, [[(60, 330), (940, 330)]], (70, 50, 32, 255), 5)
    corn(cv, 200, 345, 6); corn(cv, 610, 345, 5)
    rack(cv, 820, B2, 110, 210, 12)
    m = cv.mask(); ImageDraw.Draw(m).rectangle(P([(130, B2 - 20), (700, B2 - 4)]), fill=255)
    cv.fill(m, Image.new('RGB', (cv.w, cv.h), (150, 110, 70)), 0.9, edge=0.4)   # 깔개
    for x, h, s in [(160, 44, 1), (230, 36, 2), (420, 40, 4), (620, 46, 6)]: basket(cv, x, B2 - 8, h, s)
    for x, r in [(300, 16), (335, 13), (520, 18), (555, 12)]: pumpkin(cv, x, B2 - 6, r)
    for x, h, c in [(380, 52, (150, 82, 52)), (465, 40, (120, 70, 44)), (680, 48, (160, 100, 60))]: pot(cv, x, B2 - 4, h, x, c)
    save(cv, 'woodland', 'market', 5)
def W_gate():
    cv = Canvas(760, 520); base(cv, 740, 6)
    palisade(cv, 20, 740, 505, 290, 4, (320, 440))
    log(cv, 318, 150, 506, 26, 40); log(cv, 442, 150, 506, 26, 41)
    lines(cv, [[(300, 175), (460, 175)]], (70, 50, 32, 255), 10)
    platform(cv, 640, 506, 70, 300, 12, fire=True)
    save(cv, 'woodland', 'gate', 6)
def W_harbor():
    cv = Canvas(560, 520); base(cv, 540, 7)
    platform(cv, 250, 506, 110, 330, 14, fire=True)
    m = cv.mask(); ImageDraw.Draw(m).rectangle(P([(40, 470), (520, 486)]), fill=255)
    cv.fill(m, bark_img(cv.w, cv.h, 3, True, LOGC), 0.95, edge=0.4)
    for x in range(50, 520, 60): log(cv, x, 480, 510, 10, x)
    canoe(cv, 180, 470, 230, 34, 2); canoe(cv, 400, 474, 200, 30, 5, False)
    save(cv, 'woodland', 'harbor', 7)
def W_shipyard():
    cv = Canvas(700, 520); base(cv, 680, 8)
    for x in (80, 360, 620): log(cv, x, 230, 506, 14, x)
    roof_mat(cv, [(40, 240), (350, 170), (660, 240), (670, 262), (30, 262)], 12, (140, 120, 96), 0.9)
    for x in (200, 500): lines(cv, [[(x - 30, 506), (x, 440)], [(x + 30, 506), (x, 440)]], (80, 58, 38, 255), 5)
    canoe(cv, 350, 446, 460, 50, 8)
    for x in (560,): 
        for k in range(3): log(cv, x + k * 22, 440, 506, 18, 60 + k)
    m = cv.mask(); ImageDraw.Draw(m).ellipse(P([(110, 470), (180, 506)]), fill=255); cv.fill(m, Image.new('RGB', (cv.w, cv.h), (228, 220, 200)), cyl_x(cv, 110, 180, 0.7, 1.1), edge=0.4)   # 자작나무 껍질 두루마리
    save(cv, 'woodland', 'shipyard', 8)
# ================================================================= 평원 (다코타·만단)
def PL_trade():
    cv = Canvas(700, 520); base(cv, 680, 11)
    tipi(cv, 250, 504, 330, 450, 21, (120, 40, 30), (30, 60, 100)); rack(cv, 530, 506, 110, 170, 13); rack(cv, 640, 506, 80, 140, 14)
    save(cv, 'plains', 'trade', 11)
def PL_tavern():
    cv = Canvas(680, 520); base(cv, 660, 12)
    wigwam(cv, 290, 505, 230, 190, 31, True)  # 흙집 느낌
    tripod_fire(cv, 580, 506, 80, 7)
    save(cv, 'plains', 'tavern', 12)
def PL_inn():
    cv = Canvas(720, 520); base(cv, 700, 13)
    tipi(cv, 170, 500, 220, 330, 23, (40, 90, 60), (150, 50, 36)); tipi(cv, 540, 502, 240, 360, 25, (150, 110, 40), (40, 70, 110)); tipi(cv, 360, 507, 270, 420, 27)
    save(cv, 'plains', 'inn', 13)
# ================================================================= 푸에블로 (흙벽돌 계단 마을)
def PU_trade():
    cv = Canvas(720, 520); base(cv, 700, 21)
    adobe(cv, 60, 506, 280, 150, 44, 1, 2, 2); adobe(cv, 330, 506, 300, 120, 44, 2, 2, 1)
    adobe(cv, 110, 356, 210, 110, 40, 3, 1, 1); adobe(cv, 360, 386, 200, 100, 40, 4, 1, 1)
    ladder(cv, 330, 386, 140); ladder(cv, 560, 506, 150)
    for x in (120, 180): pot(cv, x, 508, 40, x, (205, 180, 140))
    corn(cv, 420, 300, 4)
    save(cv, 'pueblo', 'trade', 21)
def PU_tavern():
    cv = Canvas(640, 520); base(cv, 620, 22)
    adobe(cv, 60, 506, 330, 170, 44, 5, 2, 2); adobe(cv, 120, 336, 200, 110, 40, 6, 1, 1)
    ladder(cv, 400, 506, 190); tripod_fire(cv, 520, 508, 70, 5)
    m = cv.mask(); ImageDraw.Draw(m).pieslice(P([(410, 440), (510, 540)]), 180, 360, fill=255); cv.fill(m, Image.new('RGB', (cv.w, cv.h), (190, 150, 105)), 0.95, edge=0.4)   # 흙 화덕(오르노)
    save(cv, 'pueblo', 'tavern', 22)
def PU_inn():
    cv = Canvas(700, 520); base(cv, 680, 23)
    adobe(cv, 40, 506, 250, 140, 44, 7, 2, 1); adobe(cv, 280, 506, 250, 170, 44, 8, 1, 2); adobe(cv, 470, 506, 150, 110, 40, 9, 1, 1)
    adobe(cv, 300, 336, 190, 110, 40, 10, 1, 1); adobe(cv, 330, 226, 120, 90, 36, 11, 1, 0)
    ladder(cv, 290, 366, 150); ladder(cv, 480, 336, 120)
    save(cv, 'pueblo', 'inn', 23)
def PU_church():   # 키바 (둥근 반지하 의식 집)
    cv = Canvas(620, 520); base(cv, 600, 24)
    adobe(cv, 360, 506, 220, 190, 44, 12, 1, 1)
    m = cv.mask(); ImageDraw.Draw(m).ellipse(P([(40, 400), (400, 520)]), fill=255); ImageDraw.Draw(m).rectangle(P([(40, 460), (400, 506)]), fill=255)
    m = Image.fromarray(np.where(yx(cv)[0] > 506 * S, 0, np.asarray(m)).astype(np.uint8))
    n = noise(cv.w, cv.h, 18 * S, 7); tex = Image.fromarray(np.clip(np.array([196, 150, 104], np.float32) * (0.86 + 0.2 * n[..., None]), 0, 255).astype(np.uint8))
    cv.fill(m, tex, cyl_x(cv, 40, 400, 0.65, 1.15), edge=0.4)
    ladder(cv, 220, 430, 180)
    save(cv, 'pueblo', 'church', 24)
def PU_gate():
    cv = Canvas(700, 520); base(cv, 680, 25)
    adobe(cv, 30, 506, 230, 230, 44, 13, 0, 2); adobe(cv, 430, 506, 230, 230, 44, 14, 0, 2)
    adobe(cv, 250, 336, 190, 60, 40, 15, 0, 0)
    ladder(cv, 610, 276, 120)
    save(cv, 'pueblo', 'gate', 25)
ALL = [W_trade, W_tavern, W_inn, W_church, W_market, W_gate, W_harbor, W_shipyard, PL_trade, PL_tavern, PL_inn, PU_trade, PU_tavern, PU_inn, PU_church, PU_gate]
if __name__ == '__main__':
    names = sys.argv[1:]
    for f in ALL:
        if not names or f.__name__ in names: f(); print('done', f.__name__)
