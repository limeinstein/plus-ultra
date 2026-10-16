#!/usr/bin/env python3
"""웹 배포 버전을 0.001 올리고 정식판·베타판 배포 묶음을 만든다.

사용법:
    python tools/web_release.py --bump --channel both
    python tools/web_release.py --set 0.255 --channel both
    python tools/web_release.py --bump --channel beta

배포할 버전의 내용은 먼저 RELEASE_NOTES.md에 적어야 한다.
이 도구가 바꾼 js/scenes/title.js와 배포 노트를 커밋한 뒤 main 또는 beta 브랜치에 올린다.
GitHub Pages 작업이 main을 정식판, beta를 /beta/에 게시한다.
"""
from __future__ import annotations

import argparse
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TITLE = ROOT / 'js' / 'scenes' / 'title.js'
NOTES = ROOT / 'RELEASE_NOTES.md'
VERSION_RE = re.compile(r"(T\.version\s*=\s*')([0-9]+\.[0-9]{3})(';)")


def current_version(text: str) -> str:
    match = VERSION_RE.search(text)
    if not match:
        raise SystemExit('js/scenes/title.js에서 세 자리 버전을 찾지 못했습니다.')
    return match.group(2)


def normalize(value: str) -> str:
    if not re.fullmatch(r'[0-9]+\.[0-9]{3}', value):
        raise SystemExit('버전은 0.255처럼 소수점 아래 세 자리로 써야 합니다.')
    return value


def bump(value: str) -> str:
    major, fraction = value.split('.')
    number = int(major) * 1000 + int(fraction) + 1
    return f'{number // 1000}.{number % 1000:03d}'


def set_version(value: str) -> None:
    text = TITLE.read_text(encoding='utf-8')
    updated, count = VERSION_RE.subn(rf'\g<1>{value}\g<3>', text, count=1)
    if count != 1:
        raise SystemExit('버전 표기를 한 곳만 바꾸지 못했습니다.')
    TITLE.write_text(updated, encoding='utf-8', newline='\n')


def check_release_notes(value: str) -> None:
    if not NOTES.is_file():
        raise SystemExit('RELEASE_NOTES.md가 없습니다. 배포할 버전의 업데이트 내용을 먼저 적으십시오.')
    text = NOTES.read_text(encoding='utf-8')
    match = re.search(rf'^##\s+{re.escape(value)}(?:\s|—|-).*?(?=^##\s+|\Z)', text, re.M | re.S)
    if not match:
        raise SystemExit(f'RELEASE_NOTES.md에 {value} 버전 배포 노트가 없습니다.')
    bullets = re.findall(r'^-\s+\S.+$', match.group(0), re.M)
    if not bullets:
        raise SystemExit(f'RELEASE_NOTES.md의 {value} 항목에 업데이트 내용을 글머리표로 적으십시오.')
    print(f'배포 노트 확인: {value} · {len(bullets)}개 항목')


def build(channel: str, no_minify: bool) -> None:
    command = [sys.executable, str(ROOT / 'tools' / 'build_web.py')]
    if no_minify:
        command.append('--no-minify')
    if channel == 'beta':
        command += ['--channel', 'beta', '--out', 'dist/web-beta', '--zip', 'dist/PLUS_ULTRA_web_beta.zip']
    subprocess.run(command, cwd=ROOT, check=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    action = parser.add_mutually_exclusive_group()
    action.add_argument('--set', dest='set_to', metavar='VERSION')
    action.add_argument('--bump', action='store_true')
    action.add_argument('--check', action='store_true', help='현재 버전의 배포 노트만 확인')
    parser.add_argument('--channel', choices=('stable', 'beta', 'both'), default='both')
    parser.add_argument('--no-minify', action='store_true')
    args = parser.parse_args()

    text = TITLE.read_text(encoding='utf-8')
    before = current_version(text)
    if args.check:
        check_release_notes(before)
        return
    after = normalize(args.set_to) if args.set_to else bump(before)
    check_release_notes(after)
    set_version(after)
    print(f'웹 배포 버전: {before} → {after}')

    if args.channel in ('stable', 'both'):
        build('stable', args.no_minify)
    if args.channel in ('beta', 'both'):
        build('beta', args.no_minify)


if __name__ == '__main__':
    main()
