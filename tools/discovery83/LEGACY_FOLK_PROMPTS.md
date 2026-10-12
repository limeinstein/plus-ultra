# 옛 민족 발견물 문화 스토리보드

`legacy-folk.json`의 16종은 예전 자연 파노라마 제작기가 정지 화면 또는 낮→밤
색 변화로만 만들던 발견물이다. 이제 `build.py --only ID`로 새 민족 발견물과 같은
문화 활동 GIF·마지막 장면·런타임 시트를 만든다.

## 공통 생성 프롬프트

```text
Use case: historical-scene
Asset type: browser exploration game discovery GIF source, exact 4x4 storyboard
Style/medium: refined historical exploration watercolor, delicate ink contours,
warm paper undertone, natural textures, believable anatomy.
Composition: ONE image, exact 4 columns by 4 rows, 16 equal landscape cells,
overall 2048x1536, read left-to-right top-to-bottom. Same identifiable performers,
dress, location, light and spatial positions; genuine successive hand/body/action
changes; full figures and instruments within each cell.
Constraints: respectful culturally specific public/social activities, varied individual
faces; no generic stereotypes, caricature, modern objects, fantasy regalia, text,
captions, labels, borders, gutters, logos or watermark; not a repeated static view,
not a simple zoom, not merely day/night filters.
```

각 원화는 위 공통 프롬프트에 `legacy-folk.json`의 `brief`를 붙여 만들었다.
1행은 악기·일·도구의 연속 동작, 2~3행은 같은 사람들의 여덟 연속 전신 동작,
4행은 음식 준비·나눔에서 마을 전체 조망으로 이어진다. `antpeople`만 실제
민족을 꾸미지 않고, 원경의 사람 같은 형상이 황제펭귄 군락으로 드러나는
동물 행동 연속 장면으로 삼았다.
