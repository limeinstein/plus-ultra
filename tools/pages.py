"""index.html / catalog.html 을 읽어 한 파일짜리 판이나 웹 배포판을 만들 때 쓰는 공용 도구."""
import base64, hashlib, json, mimetypes, os, re

TOOLS = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(TOOLS)
FONT_HOSTS = ('https://fonts.googleapis.com', 'https://fonts.gstatic.com')
MIME = {'.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.avif': 'image/avif', '.svg': 'image/svg+xml'}


def read(rel):
    with open(os.path.join(ROOT, rel), encoding='utf-8') as f:
        return f.read()


def parse(page):
    """page(예: 'index.html')의 제목, 글꼴 링크, 스타일시트, 본문 마크업, 스크립트 목록"""
    html = read(page)
    title = re.search(r'<title>(.*?)</title>', html, re.S).group(1).strip()
    fonts = [l.strip() for l in html.splitlines() if l.strip().startswith('<link') and any(h in l for h in FONT_HOSTS)]
    css = re.findall(r'<link rel="stylesheet" href="([^"]+)">', html)
    body = html[html.index('<body>') + 6:html.index('</body>')]
    scripts = re.findall(r'<script src="([^"]+)"></script>', body)
    markup = re.sub(r'\s*<script src="[^"]+"></script>', '', body).strip()
    return {'title': title, 'fonts': fonts, 'css': css, 'markup': markup, 'scripts': scripts}


def script_text(src):
    return read(src).replace('</script', '<\\/script')


def data_uri(path):
    ext = os.path.splitext(path)[1].lower()
    with open(path, 'rb') as f:
        return 'data:%s;base64,%s' % (MIME.get(ext, 'application/octet-stream'), base64.b64encode(f.read()).decode('ascii'))


def manifest_js(found, embed, base=None):
    """found: key → base(기본 images) 기준 상대 경로. embed=True 이면 그림을 data: 주소로 넣는다."""
    base = base or os.path.join(ROOT, 'images')
    m = {}
    size = 0
    for k, rel in sorted(found.items()):
        if embed:
            uri = data_uri(os.path.join(base, rel))
            size += len(uri)
            m[k] = uri
        else:
            m[k] = rel
    js = 'window.G = window.G || {};\nG.IMAGE_FILES = ' + json.dumps(m, ensure_ascii=False, indent=None if embed else 1) + ';\n'
    if embed:
        # data: 주소는 수십만 자라 그대로 보여 줄 수 없다. 도감에서 쓸 원래 파일 이름을 따로 적어 둔다.
        paths = {k: rel for k, rel in sorted(found.items())}
        js += 'G.IMAGE_PATHS = ' + json.dumps(paths, ensure_ascii=False) + ';\n'
    return js, size


def short_hash(data):
    if isinstance(data, str):
        data = data.encode('utf-8')
    return hashlib.sha256(data).hexdigest()[:8]


def human(n):
    return '%.1fMB' % (n / 1048576) if n >= 1048576 else '%dKB' % max(1, round(n / 1024))
