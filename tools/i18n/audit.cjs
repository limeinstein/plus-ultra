/* 열 언어의 등록·번역 자료·원본 재생성·미번역 범위를 한 번에 확인한다.
   node tools/i18n/audit.cjs [--build-check] [--out docs/qa/i18n-날짜.json]
   build-check는 임시 폴더만 쓰며 게임 파일을 덮어쓰지 않는다. */
'use strict';
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const vm = require('node:vm'), { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '../..'), args = process.argv.slice(2);
const expected = ['ko', 'en', 'zh-Hans', 'zh-Hant', 'ja', 'vi', 'es', 'pt', 'de', 'fr'];
const errors = [], check = (ok, message) => { if (!ok) errors.push(message); };
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const normLines = s => s.replace(/\r\n/g, '\n');
const context = vm.createContext({
  document: { body: null, documentElement: { dataset: {} }, querySelector: () => null, addEventListener() {} },
  navigator: { languages: ['ko-KR'] }, location: { protocol: 'file:' },
  localStorage: { getItem: () => null, setItem() {} }
});
vm.runInContext('window = globalThis; G = {};', context);
const load = rel => vm.runInContext(read(rel), context, { filename: rel });
load('js/core/i18n.js');
const I = context.G.I18N;
check(JSON.stringify(I.LANGS.map(l => l.id)) === JSON.stringify(expected), '요청한 열 언어의 등록 목록');
const scriptLists = ['index.html', 'catalog.html'].map(page => {
  const scripts = [...read(page).matchAll(/<script src="(js\/lang\/[^"?]+\.js)"/g)].map(m => m[1]);
  for (const id of expected.filter(id => id !== 'ko')) check(scripts.includes('js/lang/' + id + '.js'), page + ': ' + id + ' 번역 파일 누락');
  return scripts;
});
check(JSON.stringify(scriptLists[0]) === JSON.stringify(scriptLists[1]), '게임·도감의 번역 파일과 읽는 순서 일치');
for (const rel of scriptLists[0]) load(rel);
load('js/data/guidebook.js');

const english = I.packs.en, report = {
  date: new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(new Date()),
  note: '영어 사전과 같은 열쇠의 수를 비교한다. 번역 품질이나 전체 게임의 번역 완료율을 뜻하지 않는다. ready는 현재 선택 가능 여부다.',
  languages: [], errors
};
const tmp = args.includes('--build-check') ? fs.mkdtempSync(path.join(os.tmpdir(), 'good-hope-i18n-')) : null;
try {
  for (const { id, label } of I.LANGS) {
    if (id === 'ko') { report.languages.push({ id, label, status: '한국어 원문', ready: true }); continue; }
    const p = I.packs[id];
    check(!!p, id + ': 번역 묶음이 등록되지 않음');
    if (!p) continue;
    const dir = path.join(__dirname, id);
    const sources = fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith('.tsv')).sort() : [];
    const counts = Object.fromEntries(['text', 'pat', 'city', 'good', 'name'].map(k => [k, Object.keys(p[k]).length]));
    counts.person = Object.values(p.person).reduce((n, group) => n + Object.keys(group).length, 0);
    check(!p.ready || counts.text > 0, id + ': 빈 번역을 선택 가능으로 표시함');
    if (id !== 'en') check(!!p.ready === fs.existsSync(path.join(dir, '_ready')), id + ': _ready와 게임 적용본의 공개 상태 불일치');
    let sourceRows = 0;
    for (const file of sources) {
      for (const [n, line] of read('tools/i18n/' + id + '/' + file).split(/\r?\n/).entries()) {
        if (!line.trim() || !line.includes('\t') || line.startsWith('#\t')) continue;
        sourceRows++;
        const columns = line.split('\t'), tr = columns[file.startsWith('person_') ? 2 : 1];
        check(tr != null, id + '/' + file + ':' + (n + 1) + ': 번역 열 누락');
        check(!/[가-힣\uFFFD]/.test(tr || ''), id + '/' + file + ':' + (n + 1) + ': 번역 열에 한국어 또는 손상된 글자');
      }
    }
    for (const field of ['text', 'city', 'good', 'name']) {
      for (const [key, tr] of Object.entries(p[field])) check(!/[가-힣\uFFFD]/.test(tr), id + '.' + field + ': ' + key.slice(0, 80));
    }
    for (const [pattern, tr] of p.pat) check(!/[가-힣\uFFFD]/.test(tr), id + '.pat: ' + pattern.source.slice(0, 80));
    const englishKeys = {};
    for (const field of ['text', 'pat', 'city', 'good', 'name']) {
      const keys = field === 'pat' ? english.pat.map(r => r[0].source) : Object.keys(english[field]);
      const own = new Set(field === 'pat' ? p.pat.map(r => r[0].source) : Object.keys(p[field]));
      const present = keys.filter(k => own.has(k)).length;
      englishKeys[field] = { present, total: keys.length, missing: keys.length - present };
    }
    const row = { id, label, ready: !!p.ready, status: counts.text ? '작성된 번역 적용 중' : '번역 원본 없음 · 준비 중', sourceFiles: sources.length, sourceRows, counts, englishKeys,
      guideChapters: context.G.GUIDEBOOK_I18N?.[id]?.chapters?.length || 0 };
    if (tmp && sources.length) {
      const output = path.join(tmp, id + '.js');
      const command = id === 'en' ? ['tools/i18n/build_en.py', output] : ['tools/i18n/build_lang.py', id, output];
      const result = spawnSync(process.env.PYTHON || 'python', command, { cwd: root, encoding: 'utf8', timeout: 180000 });
      row.buildMatches = result.status === 0 && normLines(fs.readFileSync(output, 'utf8')) === normLines(read('js/lang/' + id + '.js'));
      check(row.buildMatches, id + ': 원본을 다시 만든 결과가 게임 적용본과 다름 ' + (result.stderr || result.error || ''));
    }
    report.languages.push(row);
    console.log(id + ': ' + (p.ready ? '선택 가능' : '준비 중') + ' · 문장 ' + counts.text + ' · 틀 ' + counts.pat + ' · 원본 ' + sourceRows + '줄' + (row.buildMatches == null ? '' : ' · 재생성 ' + row.buildMatches));
  }
  // 포르투갈어권·준비 중 언어의 첫 방문은 영어로, 공개 뒤에는 해당 언어로 간다.
  context.location.protocol = 'https:';
  for (const [locale, expectedId] of [['ko-KR', 'ko'], ['en-US', 'en'], ['zh-CN', 'zh-Hans'], ['zh-TW', 'zh-Hant'], ['vi-VN', 'vi'], ['es-ES', 'es'], ['pt-BR', I.ready('pt') ? 'pt' : 'en'], ['pt-PT', I.ready('pt') ? 'pt' : 'en'], ['ja-JP', I.ready('ja') ? 'ja' : 'en'], ['de-DE', I.ready('de') ? 'de' : 'en'], ['de-AT', I.ready('de') ? 'de' : 'en'], ['de-CH', I.ready('de') ? 'de' : 'en'], ['fr-FR', I.ready('fr') ? 'fr' : 'en'], ['fr-CA', I.ready('fr') ? 'fr' : 'en'], ['fr-BE', I.ready('fr') ? 'fr' : 'en'], ['fr-CH', I.ready('fr') ? 'fr' : 'en']]) {
    context.navigator.languages = [locale]; check(I.pref() === expectedId, locale + ': 브라우저 언어 선택');
  }
  I.packs.pt.ready = true;
  for (const locale of ['pt-BR', 'pt-PT']) { context.navigator.languages = [locale]; check(I.pref() === 'pt', locale + ': 공개된 포르투갈어 선택'); }
  I.packs.pt.ready = false;
} finally {
  if (tmp) {
    if (path.dirname(tmp) !== path.resolve(os.tmpdir()) || !path.basename(tmp).startsWith('good-hope-i18n-')) throw Error('임시 폴더 경로 확인 실패');
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}
if (args.includes('--out')) {
  const output = path.resolve(root, args[args.indexOf('--out') + 1]);
  fs.mkdirSync(path.dirname(output), { recursive: true }); fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
}
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
else console.log('열 언어 검사 통과');
