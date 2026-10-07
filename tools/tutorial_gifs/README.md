# 튜토리얼 발견 GIF

튜토리얼에서 찾는 `herc_cave`(헤라클레스의 동굴)의 발견 원화를 4×2 시간 흐름 판으로 보관하고,
24장·8.4초짜리 GIF와 마지막 장면, 게임용 장면 판으로 만듭니다.

```powershell
python tools/tutorial_gifs/build.py
python tools/ruin_gifs/sheets.py herc_cave
python tools/images.py
```

## 원화 프롬프트

Codex 내장 이미지 생성 도구에 기존 `images/discoveries/herc_cave.jpg`를 참고 그림으로 주고 다음 지시로 만들었습니다.
기존 정지 그림은 `reference/herc_cave.jpg`에 보존했습니다.

> Use case: historical-scene  
> Asset type: discovery animation storyboard for a browser exploration game  
> Primary request: Create one cohesive 4×2 storyboard contact sheet of eight consecutive cinematic frames
> showing the same Hercules Cave at Cape Spartel, Morocco, based on the reference image. The sequence should feel
> like one locked place over a few dramatic seconds: dim blue dawn inside the sea cave, warm sunlight gradually
> entering through the ocean-facing opening, waves surging across the foreground rocks, suspended sea mist
> catching the light, and a calm golden final frame. Keep the cave opening, rock formations, horizon, camera
> height, scale, and geographic identity rigorously consistent across every panel.  
> Scene/backdrop: rugged tidal sea cave opening onto the Strait of Gibraltar and distant North African coast  
> Style/medium: museum-quality photorealistic historical discovery artwork, natural rock and seawater textures,
> painterly cinematic finish compatible with a late-15th-century exploration game  
> Composition/framing: exactly eight equal landscape cells in a clean 4 columns × 2 rows grid, chronological order
> left-to-right on the top row then left-to-right on the bottom row; wide 9:4 framing inside every cell; no gutters
> or decorative borders; full scene in every cell  
> Lighting/mood: mysterious dawn becoming a triumphant warm sunrise, realistic light shafts and restrained atmosphere  
> Constraints: no people, no ships, no modern objects, no fantasy architecture, no statues, no torch, no text,
> no captions, no labels, no UI, no watermark; do not crop the cave opening; preserve environmental continuity
> across all eight panels
