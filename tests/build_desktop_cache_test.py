#!/usr/bin/env python3
"""설치판 무릎상 캐시의 성공·잠금·실패 경로를 작은 그림으로 검사한다."""
import os
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'tools'))
import build_desktop as builder  # noqa: E402


class ShrinkCacheTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.src = self.root / 'portrait.png'
        self.dst = self.root / 'cached.webp'
        Image.new('RGBA', (12, 18), (40, 80, 120, 160)).save(self.src)

    def assert_no_parts(self):
        self.assertEqual(list(self.root.glob('*.part')), [])

    def test_success_writes_readable_cache(self):
        self.assertEqual(builder._shrink((str(self.src), str(self.dst))), str(self.dst))
        with Image.open(self.dst) as image:
            self.assertEqual(image.format, 'WEBP')
            self.assertEqual(image.size, (12, 18))
            self.assertEqual(image.mode, 'RGBA')
            image.load()
        self.assert_no_parts()

    def test_temporary_lock_recovers(self):
        replace = os.replace
        attempts = 0

        def briefly_locked(src, dst):
            nonlocal attempts
            attempts += 1
            if attempts < 3:
                raise PermissionError('파일이 잠겨 있습니다')
            replace(src, dst)

        with mock.patch.object(builder.os, 'replace', side_effect=briefly_locked), mock.patch('time.sleep'):
            builder._shrink((str(self.src), str(self.dst)))
        self.assertTrue(self.dst.is_file())
        with Image.open(self.dst) as image:
            image.load()
        self.assert_no_parts()

    def test_permanent_lock_raises_original_error(self):
        error = PermissionError('잠금이 풀리지 않습니다')
        with mock.patch.object(builder.os, 'replace', side_effect=error), mock.patch('time.sleep'):
            with self.assertRaises(PermissionError) as caught:
                builder._shrink((str(self.src), str(self.dst)))
        self.assertIs(caught.exception, error)
        self.assertFalse(self.dst.exists())
        self.assert_no_parts()

    def test_existing_cache_from_another_worker_is_preserved(self):
        Image.new('RGB', (4, 6), 'red').save(self.dst, 'WEBP')
        original = self.dst.read_bytes()
        with mock.patch.object(builder.os, 'replace', side_effect=PermissionError('다른 작업이 먼저 썼습니다')):
            self.assertEqual(builder._shrink((str(self.src), str(self.dst))), str(self.dst))
        self.assertEqual(self.dst.read_bytes(), original)
        self.assert_no_parts()

    def test_partial_encode_is_removed_on_failure(self):
        error = OSError('저장 공간이 부족합니다')

        def failed_save(image, path, *args, **kwargs):
            Path(path).write_bytes(b'incomplete')
            raise error

        with mock.patch.object(Image.Image, 'save', autospec=True, side_effect=failed_save):
            with self.assertRaises(OSError) as caught:
                builder._shrink((str(self.src), str(self.dst)))
        self.assertIs(caught.exception, error)
        self.assertFalse(self.dst.exists())
        self.assert_no_parts()

    def test_other_replace_error_is_not_retried(self):
        error = OSError('파일을 옮길 수 없습니다')
        with mock.patch.object(builder.os, 'replace', side_effect=error) as replace:
            with self.assertRaises(OSError) as caught:
                builder._shrink((str(self.src), str(self.dst)))
        self.assertIs(caught.exception, error)
        self.assertEqual(replace.call_count, 1)
        self.assertFalse(self.dst.exists())
        self.assert_no_parts()


if __name__ == '__main__':
    unittest.main()
