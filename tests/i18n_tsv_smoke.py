"""번역 자료의 빈 조각·선택적 이름·이름 소문자 틀을 확인한다."""
from pathlib import Path
import sys,re
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'tools/i18n'))
from tsv_tools import compile_row
assert compile_row('이','""') == ('text','이','')
kind,pattern,replacement=compile_row('「성을 세워라.@」','"Build a fort.@"')
assert kind=='pat' and re.fullmatch(pattern,'「성을 세워라.」')
assert re.fullmatch(pattern,'「성을 세워라. 제독님」')
kind,pattern,replacement=compile_row('배 종류 @','the {1:lc}')
assert re.fullmatch(pattern,'배 종류 갤리온') and replacement=='the ⟪l⟫⟦$1⟧⟪/l⟫'
print('빈 번역·선택적 이름·이름 소문자 틀 통과')
