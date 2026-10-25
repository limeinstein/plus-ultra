/* 클로드가 추가한 신기루 50곳의 원문과 그림 경로를 보존한다. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.resolve(__dirname, '../..'), rows = [];
const G = { DiscAdd: { ruin(...a) {
  rows.push({id:a[0], name:a[1], lat:a[2], lon:a[3], how:a[4], region:a[8], built:a[11], description:a[12], hint:a[13], source:`tools/mirage_gifs/masters/${a[0]}.png`});
} } };
vm.runInNewContext(fs.readFileSync(path.join(root, 'js/data/miragedisc.js'), 'utf8'), {window:{G}});
if (rows.length !== 50) throw new Error('신기루 발견물은 50개여야 합니다.');
fs.writeFileSync(path.join(__dirname, 'items.json'), JSON.stringify(rows,null,2)+'\n');
console.log(`신기루 발견물 ${rows.length}개 내보냄`);
