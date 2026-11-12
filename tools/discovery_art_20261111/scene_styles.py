"""발견물 갈래에 맞는 기존 게임 연출로 원화를 재생 장면으로 바꾼다."""
from pathlib import Path
import sys

TOOLS = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(TOOLS))
sys.path.insert(0, str(TOOLS / 'ruin_gifs'))

from animal_gifs import build as animals
from discovery83 import build as culture
from plant_gifs import build as plants
from treasure_gifs import build as treasures
import build_cinematic as ruins


def measured_storyboard(original, layout):
    """행마다 칸 수가 다른 원화에서 검수한 16장만 순서대로 자른다."""
    rows, skip = layout['columnsPerRow'], set(layout['skipFrames'])
    source = original.convert('RGB')
    frames = []
    index = 0
    for row, columns in enumerate(rows):
        top = round(row * source.height / len(rows)) + 6
        bottom = round((row + 1) * source.height / len(rows)) - 6
        for column in range(columns):
            if index not in skip:
                left = round(column * source.width / columns) + 7
                right = round((column + 1) * source.width / columns) - 7
                frames.append(ruins.fit_whole(source.crop((left, top, right, bottom))))
            index += 1
    return frames


def animate(style, did, path, original, layout=None):
    if style in ('ruin', 'people'):
        if style == 'ruin':
            frames = measured_storyboard(original, layout) if layout else ruins.storyboard_cells(path)
            durations = ruins.DURATIONS
        else:
            frames = culture.source_cells(path)
            durations = [430] * 4 + [480] * 8 + [1000] * 3 + [1260]
        if len(frames) != 16:
            raise ValueError(f'{did} 원화의 4×4 칸 경계를 확인하세요: {len(frames)}칸')
        return frames, durations
    source = original.convert('RGB')
    if style == 'treasure':
        # 종이·상아·나무·말갈기에는 금속 반짝임을 얹지 않는다.
        treasures.PROFILES[did] = {'glints': did in {
            'gallehus', 'mjolnir', 'tolstaya', 'attila', 'filippovka', 'nagyszentmiklos', 'hunnicauldron'}}
        return treasures.animation(did, source), treasures.DURATIONS
    if style == 'ani':
        return animals.animation(source), [animals.DURATION] * animals.FRAME_COUNT
    if style == 'plant':
        return plants.animation(source, did)
    if style == 'nat':
        return culture.nature.animation(source, did)
    raise ValueError(f'{did} 발견물 연출 갈래를 확인하세요: {style}')
