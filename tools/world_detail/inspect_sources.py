"""새 지형 작업의 자료·의존성 확인 및 PDF 참고 화면 추출."""
from pathlib import Path
import importlib.util, json

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'artifacts'/'world-detail-20261125'
OUT.mkdir(parents=True,exist_ok=True)
print('DEPENDENCIES',json.dumps({n:bool(importlib.util.find_spec(n)) for n in ['numpy','scipy','PIL','rasterio','shapefile','fitz','requests']},ensure_ascii=False),flush=True)
import fitz
pdf=fitz.open(r'D:/download/download 12/문명 7_자연경관 - 나무위키.pdf')
reference=OUT/'reference'; reference.mkdir(exist_ok=True)
for i,p in enumerate(pdf):
    print('PAGE',i+1,p.get_text()[:1300],flush=True)
    p.get_pixmap(matrix=fitz.Matrix(.9,.9)).save(reference/f'wonders-{i+1:02}.png')
print('PDF_PAGES',len(pdf),flush=True)
