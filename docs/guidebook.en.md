<!-- English manuscript of the in-game Play Guidebook (Controls → Play Guidebook). Mirrors docs/guidebook.md section for section.
     After editing: python tools/guidebook/build.py → rebuilds js/data/guidebook.js (G.GUIDEBOOK and G.GUIDEBOOK_I18N.en).
     Screenshots are of the Korean screens; the numbers match the red numbers in each picture. -->

## Getting Started

Each page shows a screenshot with red numbers, and what the button with that number does. Turn pages with **← →**, and click a picture to enlarge it.

### Title Screen

![Title screen](guide/p01_title)

| # | Button | What it does |
| --- | --- | --- |
| 1 | New Voyage | Create your admiral and start in your home port on May 1, 1480 |
| 2 | First Voyage (Tutorial) | An 18-step guided voyage starting in Seville in 1480. Your crew teach you one thing at a time |
| 3 | Story: Father's Photo | Story mode that follows a set plot |
| 4 | Load Logbook | Load from 5 autosave slots and 5 inn logbook slots |
| 5 | Controls | A summary of key controls, and this guidebook |
| 6 | Display · Fonts | Text size, font and text rendering (two pages on) |

### Creating Your Admiral

![Creating your admiral](guide/p02_create)

| # | Button | What it does |
| --- | --- | --- |
| 1 | Previous face · Next face | Choose your looks. At forty your admiral turns into a bearded man in his forties |
| 2 | Given name · Surname | Entered separately. The button beside each gives another name |
| 3 | Birthday | Sets your star sign, which gives +6 to one stat |
| 4 | Age (18–40) | Younger means more Vitality and Strength; older means more Intelligence and Charm, and more bonus points |
| 5 | Nationality | Portugal (start in Lisbon) · Spain (start in Seville) |
| 6 | Profession | Each starts with different skills (table below) |
| 7 | Difficulty | Easy · Normal · Strict Rules (table below) |
| 8 | Stats ＋ − | Spread your age bonus points over Vitality, Intelligence, Strength and Charm |
| 9 | Reroll | Roll new stats |
| 10 | Skills · Languages ＋ − | Spend remaining points on skills (17 kinds) and languages |
| 11 | Back to Title | Stop creating |
| 12 | Ready to Sail | Start the game as is |

### Professions and Difficulty

- Age bonus: stat points 4 + (age − 18) × 0.5, skill points 3 + (age − 18) ÷ 4.
- Learning bonus: from Intelligence 40, +1 skill point for every 15 (up to +3); +4 at Intelligence 99 or above.

| Profession | Starting skills |
| --- | --- |
| Explorer | Navigation 2 · Surveying 2 · Seamanship 1 |
| Excavator | History 2 · Eloquence 2 |
| Hunter | Seamanship 3 · Science 1 |
| Conquistador | Swordplay 3 · Gunnery 1 |
| Missionary | Theology 3 · Eloquence 1 |
| Merchant | Accounting 3 · Eloquence 1 (first ship: a Caravel) |
| Soldier | Gunnery 2 · Marksmanship 2 |

| Difficulty | Entering/leaving port | Starting money | Saving |
| --- | --- | --- | --- |
| Easy | 1 day | 5,000 gold | Anywhere |
| Normal | 3 days | 3,000 gold | At inns |
| Strict Rules | 10 days | 3,000 gold | Only at inns in your home country's cities |

### Display · Fonts

![Display · Fonts window](guide/p03_display)

| # | Button | What it does |
| --- | --- | --- |
| 1 | Text size | DEFAULT is set to suit your monitor's size and pixel density. Windows and menus grow and shrink with it (remembered on this device only) |
| 2 | Font | DEFAULT is Nanum Myeongjo on dense screens, Noto Serif on coarser ones |
| 3 | Text rendering | Sharp (default): redraws text at the monitor's real size · Classic: stretches the whole screen |

### Saving

- **Autosave** — while you play, the game saves every minute, rotating through 5 slots (overwriting the oldest first). You can turn it off in Settings.
- **Inn logbook** — at an inn, use "Services → Write in the Logbook (Save)", or save at your home; pick one of 5 slots.
- On "Strict Rules" difficulty you can only write your logbook at inns in your home country's cities.

## The City

### City Screen

![Lisbon street](guide/p04_city)

| # | Button | What it does |
| --- | --- | --- |
| 1 | Date · City · Language | Language: how well your party (interpreters included) speaks this city's tongue ●○○ |
| 2 | Latitude · Longitude | Always shown in cities |
| 3 | Food · Water · Fatigue | Food and water are shown in days left. Under 7 days is "Short", under 3 "Critical" |
| 4 | Contract | Days left. Hover for the sponsor, goal and deadline |
| 5 | Gold · Fame · Rank | Rank: if you have no title of nobility, a name based on your fame |
| 6 | City nameplate | Ruling nation, leader, culture, religion and language |
| 7 | Things to do here | Up to 6 lines: contracts to report, profitable trades, departure readiness and so on. Click one to go to that building |
| 8 | Building list | Click and your admiral walks over and goes in. Discoveries inside the city (★) are listed here too |
| 9 | Street | ←→ walk · Shift run · ↑ enter a building · or just click a building |
| 10 | Logbook buttons | Admiral, Fleet, Items, Discoveries, Contracts, Requests, Chart, Log, Notebook — opens that tab of the Voyage Notebook |
| 11 | Settings | The Settings window (later pages) |

- Entering a building takes a day.
- Your rank name rises with your fame. The table below shows every title from the first up to the last at 2,000,000 fame. If you hold a title of nobility, it is shown first on the city's top bar.

{{명성_칭호}}

### Voyage Notebook

![Voyage Notebook — Admiral tab](guide/p05_book)

| # | Tab | What it shows |
| --- | --- | --- |
| 1 | Admiral | Age, fame by kind, gold, savings, notoriety, health, title, weapons, spouse, children, stats, skills, languages |
| 2 | Fleet | Discipline, fatigue, minimum–maximum crew, food, water, cargo, ship list, fleet speed (set by the slowest ship) |
| 3 | Companions | Your companions' stats (Vitality, Intelligence, Strength, Charm), skills and languages |
| 4 | Migrants | Navigators you have news of, and where they were when you heard |
| 5 | Belongings | Up to 40 slots — equip, discard, read |
| 6 | Discoveries | Number found, % of the chart drawn, cards by kind (reported, announced, unreported, rivals) |
| 7 | Clues | Clues you have gathered |
| 8 | Achievements | Achievements |
| 9 | Contracts | Sponsor contracts and guild requests |
| 10 | Trade Notes | Prices recorded in cities you visited, demand of the age |
| 11 | European Affairs | Relations between the nations of Europe |
| 12 | Sea Chart | Seas you have explored, route experience |
| 13 | Log | Entries by date (newest first) |

- When you hear a migrant's whereabouts at a tavern, that migrant stays in that port for 59 days. Hearing about the same person again does not extend it; you're told the days left, reduced by the days that have passed. The "Migrants" tab also shows how many days of their stay remain.
- The "Migrants" tab only lists navigators you have seen in person, heard news of, or sailed with. The place shown is where they were when you heard, so as time passes it fades to "formerly in ○○".
- If you ask a tavern maid to "Find a navigator's whereabouts" and give the exact name of a navigator you have met or known, she will ask the sailors around and find out where they are, unless it's too far away. You hear the news by visiting that maid again some time later.
- As your admiral ages, or as mates sail with you for a long time, a mate may die, fall ill, or leave the ship for other reasons. Medicine in the hold, a ship's doctor, or a doctor in port can sometimes pull them through.

### Settings

![Settings window](guide/p06_settings)

| # | Item | What it does |
| --- | --- | --- |
| 1 | Difficulty | Current difficulty and where you can save |
| 2 | Sound effects · Music | Volume |
| 3 | Full screen | The game's own full screen. F11 also toggles it |
| 4 | Quality | Fast · Normal |
| 5 | Text size | Same as "Display · Fonts" |
| 6 | Font | Same as "Display · Fonts" |
| 7 | Text rendering | Same as "Display · Fonts" |
| 8 | Autosave | On · Off |
| 9 | Sea-battle shake and flashes | On · Off |

### Settings (continued)

Scroll the window down to see more:

| Item | What it does |
| --- | --- |
| Crew chatter on discoveries | On · Off |
| Arrow keys at sea | Compass directions (↑N ↓S ←W →E) / Steer by hand (hold ↑ to move ahead · ←→ turn the bow · ↓ stop) |
| Follow the mouse | On: after one click, the ship turns wherever you move the mouse · Off: sails to where you clicked |
| Control sensitivity | Slow · Normal · Fast — how quickly you turn with the mouse or arrow keys |
| Port and gate prompts | Notify only · Ask only when stopped · Always ask |
| Keyboard settings | Click an item, then press the new key. If the key is already used, the two items swap keys |

## Buildings

### Harbor

![Harbor](guide/p10_harbor)

| # | Button | What it does |
| --- | --- | --- |
| 1 | Prepare to Sail | Crew, repairs, food, water and repair materials all at once (next page) |
| 2 | Set Sail | Out to sea. If you have learned a route, "Set sail on autopilot" also appears |
| 3 | Supplies | Set food and water (in days) and repair materials (in barrels) separately. Reducing them sells back at 50% of the supply price |
| 4 | Organize Fleet | Up to 5 ships; the top one is the flagship. Change flagship, people per ship (set automatically), bring ships in from the dock, leave them at the dock, scrap |
| 5 | Town Info | Buy the location of a city you don't know and mark it on your chart (40 + city size × 20 gold each) |
| 6 | Announce a Discovery | Tell the world about something you found — you only get fame (greyed out if there's nothing to announce) |

- You cannot sail when: you have no ship · fewer than 5 sailors, or less than 1/3 of the minimum crew · less than 2 days of food or water.
- Ports on monsoon seas also have "Monsoon conditions".
- "Dock": leave ships taken out of your fleet here. Your home port's dock holds up to 10 ships with no time limit; other ports' docks hold up to 3, and ships are scrapped after 2 years (you're warned at 90 and 30 days left). You can also change your flagship at the shipyard.

### Prepare to Sail

![Prepare to Sail window](guide/p11_prep)

| # | Button | What it does |
| --- | --- | --- |
| 1 | Notes | This port's conditions, such as scurvy and autopilot routes |
| 2 | − ＋ / Days | How many days' worth of voyage to load for |
| 3 | 20 days · 40 days · 60 days · Max | Quick buttons. With a contract, "To the goal" and "Round trip" also appear |
| 4 | Cost | The money it will take |
| 5 | Confirm | Fills crew up to the minimum + 4, repairs (if there's a shipyard), and loads food, water and materials (6 barrels + 3 per ship) |

### Trading Post

![Trading Post](guide/p12_trade)

| # | Button | What it does |
| --- | --- | --- |
| 1 | Buy | Buy trade goods (next page) |
| 2 | Sell | Sell trade goods — goods bought at this trading post can't be sold here for more than you paid |
| 3 | Invest | "Invest in the trading post". From 1,000 gold; not refundable |
| 4 | Chat | Once per visit — market events, fashions, trade tips, clues |
| 5 | Prices | Prices by category of goods (100% = normal), market prices, and the price notebook for other cities |
| 6 | Haggle | If it works, the buying price drops (up to 25%). With a purser, "Drive a hard bargain" |

- Investment tiers: 4,000 · 12,000 · 30,000 · 70,000 · 150,000 gold. Each tier makes buying 3% cheaper, selling 3% dearer, and supplies 6% cheaper. Dividends every 90 days.
- Haggles per day: Accounting level 0 once · levels 1–2 twice · level 3 three times, +1 with a purser. Fails if you can't speak the language at all.
- At Accounting level 3, the "Back-alley Black Market" appears.

### Trading Post — Buy Window

![Buy window](guide/p13_trade_buy)

| # | Field | Meaning |
| --- | --- | --- |
| 1 | Checkboxes | Pick several goods and buy them all at once (clicking a row buys just that one) |
| 2 | Tags | Specialty ×N · Relay · Fashion · Age ▲▼ |
| 3 | Price · Stock | Price per barrel and amount left |
| 4 | Best known price · Profit per barrel | The dearest place recorded in your price notebook, and the profit per barrel |
| 5 | Free space | Remaining hold space (barrels), weight, number of goods |
| 6 | Buy selected | Buy everything ticked in one go |

### Shipyard

![Shipyard](guide/p14_shipyard)

| # | Button | What it does |
| --- | --- | --- |
| 1 | Buy | Ships of this region. Ships above the yard's shipbuilding level are locked |
| 2 | Sell | You can't sell the flagship or borrowed ships |
| 3 | Repair | "Repair all" or one ship at a time |
| 4 | Refit | Cannons · sails (300 gold each) · rigging upgrades · extra gunports (250 gold each) · figurehead (150 gold) · rebuild hull · rename · cabin refit (flagship only). "Refit several ships at once" at the top does sails, cannons and rigging for the ships you pick in one go |
| 5 | Invest in Shipbuilding | In units of 1,000 gold. Every 10,000 · 30,000 · 70,000 gold invested in total raises shipbuilding by one level (max 5) |

- Rigging upgrades (for headwinds): fit a jib → recut sails and better ropes → strengthen the keel. They cost 8%, 12% and 16% of the ship's price and need shipbuilding level 1, 3 and 4.
- Cannons and figureheads unlock up to the shipyard's shipbuilding level. Higher-level ones are shown locked; raise the level with "Invest in Shipbuilding" to fit them.

#### Figurehead Effects

| Effect | What it actually does |
| --- | --- |
| Speed | +% speed for the ship carrying that figurehead (that ship only) |
| Hull | −% damage taken from sea-battle gunfire and storms |
| Storm | −(3×)% chance of meeting storms (max −65%) · −(2×)% storm damage (max −30%) |
| Monster | Sea monsters back off with that chance · −% damage from monsters (max −50%) |
| Battle | +% accuracy for our gunfire |
| Luck | +(2×) percentage points to come through sea events (ghost ship, iceberg, shoals, fever, sirens) unharmed |
| Discipline | +(2×) discipline every day at sea — the Demon King figurehead lowers it |

- If several ships carry figureheads, the largest of each effect counts in full and the others add only ¼. You can see the current totals under "Figurehead effects" at the bottom of the "Fleet" window.
- Figureheads of mythical beasts (fairy, unicorn, griffin, pegasus, siren, triton, qilin, dragon, phoenix, garuda) aren't sold at shipyards. You get them only as relics of great discoveries such as Avalon, the Unicorn, Persepolis, the Parthenon, Troy, Atlantis, the Qilin, the Black Dragon, Saint Sophia of Kyiv and Prambanan.
- ★ The 7 legendary figureheads are salvaged by defeating the legendary sea monsters (Leviathan, Bakunawa, Zaratan, Jörmungandr, Isonade, Cipactli, the Ghost Ship). Each has a "legendary power" no other figurehead has — Calm Seas (storms down to −88%) · Mother's Embrace (half the crew losses) · Healing Shell (1% hull a day) · Whisper from the World's End (a clue every 30 days) · Towing Tail (the speed bonus applies to every ship in the fleet) · Trembling Gunners (enemy accuracy −12%) · Curse (the Demon King figurehead — blocked by the Angel, Virgin Mary, St. Michael and St. Nicholas figureheads).
- If you remove a relic or legendary figurehead, or sell or scrap its ship, it comes back to your belongings.

### Tavern

![Tavern](guide/p15_tavern)

| # | Button | What it does |
| --- | --- | --- |
| 1 | Have a Drink | 4 + city size × 2 gold, fatigue −4. From the 4th cup you may pass out drunk |
| 2 | Buy a Round | Discipline +12, fatigue −15, all mates' loyalty +3, social fame +1 |
| 3 | Hear Trade Gossip | The price of a drink, twice a day |
| 4 | Ask for Information | Only with a contract — talk about your contract's goal |
| 5 | Look Around the Room | Once per visit. You meet someone, or get into a quarrel |
| 6 | Hire Sailors | Set the fleet's crew size. Quick buttons: minimum · comfortable for shifts (minimum × 1.3) · maximum |
| 7 | Look for Navigators | The roster of navigators staying in this city right now (next page) |
| 8 | Talk to the Barmaid | Only in cities that have one |
| 9 | Offer a Game of Poker | Stakes 100 · 500 · 1,000 · 5,000 gold |
| 10 | Assign Crew | Your mates' roles and flagship cabins |
| 11 | Talk to Your Crew | Sit down with a mate (gifts only to mates of the opposite sex) |

### Look for Navigators

![Navigator roster](guide/p16_hire)

| # | Field | Meaning |
| --- | --- | --- |
| 1 | Roster | Name, skill summary, fame needed. Rival explorers are "Not for hire" |
| 2 | Profile card | Origin, where they're staying, years of birth and death, introduction |
| 3 | Stats | Vitality, Intelligence, Strength, Charm |
| 4 | Skills | ●●● levels (max 3) |
| 5 | Languages | Languages they speak and how well they can talk with your party |
| 6 | Hire button | You need the required fame and at least some shared language |

- Starting loyalty = 40 + shared-language level × 10. Wages are paid every month.

### Inn

![Inn](guide/p17_inn)

| # | Button | What it does |
| --- | --- | --- |
| 1 | Stay the Night | 8 + 6 × city size gold a night, 1–60 nights. Fatigue to 0, health +30 a night |
| 2 | Look for Navigators | The innkeeper introduces some (no rival explorers) |
| 3 | Assign Crew | Same as at the tavern |
| 4 | Talk to Your Crew | Same as at the tavern |
| 5 | Odd Jobs | Earn wages and improve the local language. Fame −1 each day. Up to 90 days in total |
| 6 | Services | Write in the Logbook (Save) · Load · Settings |

### Market

![Market](guide/p18_market)

| # | Button | What it does |
| --- | --- | --- |
| 1 | Buy | Weapons, armor, navigation tools, accessories. Stock changes every 45 days. Your home market always has a compass and sextant |
| 2 | Sell | Usually 50% of the base price. Items bought in this city can't sell for more than you paid |
| 3 | Prices | Same as the trading post's price window |
| 4 | Belongings | The Belongings tab (40 slots) |

### Church

![Church](guide/p19_church)

| # | Button | What it does |
| --- | --- | --- |
| 1 | Donate | Notoriety −1 per 200 gold. Social fame = (Theology level + 1) per 1,000 gold donated |
| 2 | Pray | Once per visit. Fewer storms for 120 days. Discipline +5 at Theology level 1 or above |
| 3 | Ask for Healing | Make an offering: health to 100, sick crew to 0 |

### Library

![Library](guide/p20_library)

| # | Button | What it does |
| --- | --- | --- |
| 1 | Browse | Choose a book from the shelves and read it (next picture) |
| 2 | Search | Which city has a book this library doesn't |

### Library — Shelves

![Shelves](guide/p21_shelf)

| # | Field | Meaning |
| --- | --- | --- |
| 1 | Legend | Black = read · Gold = can be read now · Red = can't be read yet |
| 2 | Gold book | Click it or pick it with the arrow keys, then Enter to open |
| 3 | Shelf info | Number of books, and how many you can read now |
| 4 | Hint line | Shows the title and author when you get close to a book |

- Reading a book for the first time takes a day. Your party needs someone who reads the book's language, and for scholarly works, someone who knows that field.
- Language level 3 reads every passage, level 2 about 70%, level 1 about 35%.
- Why a book is red: not yet published · you haven't finished the earlier books in the series · not enough language or learning · it's about a land you don't know yet.

### Palace · Mansion (Sponsors)

![Palace](guide/p22_palace)

| # | Button | What it does |
| --- | --- | --- |
| 1 | Propose a Voyage | Propose a discovery you have a clue for, and sign a contract. "Ask for a small job"; if you have found two or more discoveries, "Report them all at once" |
| 2 | Report | Only while under contract with this sponsor |
| 3 | Talk | The sponsor's tastes. At 25 trust or more they sometimes give a clue or recommend a book |
| 4 | Royal Commands | When the monarch summons you: take one of 3 royal commands (deadline 2 years) — succeed and your title rises one step |
| 5 | Charters | Need a title from that nation — Letter of marque (pirates attack 80% less often) · Tax exemption |

- Your monarch summons you every time your total fame rises by 10,000.
- **Chart reports** (king and scholar sponsors only): receive gold and exploration fame for the share of new chart drawn since your last report. Kings pay more gold; scholars give more fame, and for a large chart they tell you a clue about that sea. Sponsors versed in geography give +20%.
  - The chart grows more detailed each time you pass the same place — ① outline → ② rivers → ③ mountains → ④ terrain. Each square is worth ① 1 · ② 2.5 · ③ 4.5 · ④ 7.5, so the more detailed, the more you get.
  - With a map room (Surveying★, Drawing☆), the flagship's lookout post, and mates skilled in Surveying in the lookout posts of other ships, a single pass fills in more detail (mapping speed, up to +150%).

### When Your Fame Falls Short

- If your fame isn't high enough, the steward turns you away. Even then you can "Ask whether the master has any small task" and take a small job (charting, procuring goods, checking rumors).

![When your fame falls short — the steward](guide/p23_butler)

![A small job](guide/p24_errand)

### Guild

![Guild](guide/p25_guild)

| # | Button | What it does |
| --- | --- | --- |
| 1 | Browse Requests | Requests on the board. Up to 3 at a time |
| 2 | Report a Request | Requests you have finished |
| 3 | Accepted Requests | Progress |
| 4 | Train a Skill | (level+1) × 1,500 gold, (level+1) × 10 days. Higher Intelligence makes success more likely |
| 5 | Study a Language | The language of this city and neighboring regions. (level+1) × 1,000 gold, (level+1) × 15 days |

- If you finish within the grace period after the deadline, you get half the reward and fame. Giving up costs fame −(the request's fame × 1.5).

### Town Gate

![Town Gate](guide/p26_gate)

| # | Button | What it does |
| --- | --- | --- |
| 1 | Set Out on an Expedition | 5 or more sailors. If you choose a mount, preparation takes 10 days |
| 2 | Stables | Buy, stable or sell back mounts (next page) |

### Town Gate — Stables

![Stables](guide/p27_stable)

| # | Field | Meaning |
| --- | --- | --- |
| 1 | Mount card | Price, riders carried, pace by terrain |
| 2 | Terrain suitability | ◎ excellent · ○ good · △ slightly better · × poor |
| 3 | Legend | If you're short of animals, the effect shrinks accordingly |
| 4 | Buy and stable | Buy the chosen mount for the size of your party and leave them in the stables |

| Mount | Price | Strong terrain (pace multiplier) |
| --- | --- | --- |
| Porters | 25 (wages) | Jungle 1.3 · Forest 1.25 |
| Donkey | 60 | Mountains 1.5 · Grassland/Steppe 1.4 |
| Horse | 180 | Steppe 2.4 · Grassland 2.2 |
| Wagon | 450 | Grassland 2.8 · Steppe 2.6 |
| Camel | 160 | Desert 3.0 |
| Llama | 45 | Mountains 2.4 · Snowfield 1.9 |
| Elephant | 1,200 | Jungle 2.2 · Forest 2.0 |
| Reindeer sled | 90 | Tundra 3.0 · Snowfield 2.8 · Ice field 2.6 |
| Yak | 80 | Snowfield 2.4 · Mountains 2.2 |

Which mounts are for sale depends on the city's culture and the year.

### Restaurant · Residence

| Building | Button | What it does |
| --- | --- | --- |
| Restaurant | See the Menu | One meal a day per city. Dish grade 1/2/3: fatigue −6/−8/−10, health +1/+2/+3, discipline +2/+3/+4 |
| Residence | Rest | 3 days pass; health to 100, fatigue to 0 |
| Residence | Write in the Logbook (Save) | Save |
| Residence | Strongbox | Deposit and withdraw. 0.3% interest a month |
| Residence | Storeroom | Store things without using belonging slots (not evidence of discoveries you haven't reported or announced yet). Filter with the type buttons; "Store all" skips equipped, pinned items and navigation tools |
| Residence | Retire | Retire |
| Residence | Hold a Ball | If you hold a title. Once every 90 days, 3,000 gold + 1,500 per rank of your title. Social fame |
| Residence | Prepare a Debut | For a daughter aged fifteen to seventeen. Gowns at 2,000 · 6,000 · 15,000 gold. If she becomes "the Belle of Society", a royal proposal is easier at her wedding at eighteen |

**Balls** — Once you are a noble, you can hold balls at your residence. Beauties from Ludwig I's "Gallery of Beauties" and Habsburg archduchesses come as guests, a little ahead of their time (Maria Theresa · Maria Antonia · Marie of Bavaria · Auguste of Tuscany · Caroline von Holnstein · Amalie von Schintling · Friederike von Gumppenberg · Alexandra of Denmark · Lola Montez · Jane Digby · Marianna Florenzi · Helene Sedlmayr).

- A young lady approaches the admiral or a grown son. Approach her through what she likes — dancing, tales of the sea, politics and learning, or music — and her affection rises sharply. You can also introduce your son and turn her toward him.
- At 100 affection she proposes — to a single admiral as his wife, to a married one as second wife (with a house in her homeland), or to your son as his bride (she becomes the wife if he succeeds you). Royals bring a dowry of 40,000 gold, nobles 15,000.
- Envy and jealousy: each lady has a rival, and favoring one makes her rival jealous. When jealousy builds up, the rival schemes: gossip (social fame −), tale-telling (trust of that nation's monarch −), spilled drinks (her rival's affection −), or sulking. Your wife gets jealous too.
- Politics: favoring a lady gives +2 trust with her nation's monarch, marrying her +20, turning down her proposal −10, and marrying her gives −10 with her rival's nation.
- The uninvited witch: Griselda, the Thistle Witch, crashes in. Ask her to dance, apologize and give her the seat of honor, or impress her by facing her with a sword, and she joins you as a companion (she also joins the witches' circle aboard ship). Throw her out with the guards and the ball is ruined.


**Children** — Meet your children under "Family" at your residence to teach them, play with them, and take them aboard as apprentices.

- **Natural capacity** — Luck decides how far each child can grow in each stat (starting stat + 6 to 26, more generous for natural talents). Below that cap they grow well, but once they reach it they barely rise. The same teaching makes each child grow differently.
- **Skills** — A tutor isn't guaranteed every year. Higher levels are harder, higher Intelligence learns better, and before adulthood (16) a child can reach level 2 at most. Level 3 is learned as an adult in a ship's cabin or at a guild.
- **Each year's luck** (ages 6–15) — In a "good year" one stat gets +1 regardless of capacity; in a "hard year" (fever, waywardness) there is no natural growth that year.
- **Mother's languages and skills** — A child can learn one language and one skill a year from the mother they live with (up to her level). A mother who was a barmaid speaks her home language (fluent) and a language common in that region (average), and has one or two skills (level 1–2) among Eloquence, Cooking, Music and Accounting. A mother who was a mate has that person's languages and skills. A child aboard ship can't learn from their mother.
- **Sailing together** — Grown sons and unmarried daughters can join the fleet as navigators via "Family" → "Take them aboard". You assign their cabin, role and even the captaincy of another ship as with any mate; they get half wages, and their loyalty depends on how they get on with their father. A child aboard as an apprentice becomes a full navigator automatically at sixteen. Skills and languages learned aboard stay with the child, and "Have them stay home" or dismissing them sends them home (you can take them aboard again).
- **A son over thirty leaves home** — A son who isn't aboard ship, once past thirty, leaves to make his own way when you visit the residence (a merchant captain, a university scholar, a knight of some monarch, or a port merchant, depending on his best stat). You can give him travel money, bless him, or say "Then come aboard my ship" and sail together. If you never visit, he leaves a letter at thirty-three and goes. A son who has left **can still succeed you** (you can choose him at retirement; he comes back if he succeeds), and each year your wife passes on his letter, and you can call him back with "Come to my ship".
- **Succession** — A son aboard ship leaves the fleet to become admiral, and any brothers aboard stay on as navigators under their younger brother.

### Royal Museum — Donations

Complete a museum, gallery or zoo royal command and a Royal Museum, Gallery or Zoo goes up in that monarch's city. Go in to look over what you have given, and **donate** new things.

![Donating to the museum](guide/p27_museum)

| # | Field | Meaning |
| --- | --- | --- |
| 1 | Notes | Donated things leave your belongings and are hung in the gallery |
| 2 | Discovery relics | Can be donated to the museum |
| 3 | Masterpiece | Paintings and sculptures from the studio and sculpture room — museum and gallery |
| 4 | Value | The item's worth (you receive no money) |

- Each piece (or each species, for animals) gives social fame +75 and +1 trust with that nation's monarch. To the zoo you donate rare animals you've newly found.

## Sailing

### Sea Screen — Top Bar and Panels

![Sea screen](guide/p30_sea)

| # | Button | What it does |
| --- | --- | --- |
| 1 | Latitude · Longitude | Latitude needs an astrolabe or sextant, or Surveying 2; longitude needs a sextant (otherwise "?") |
| 2 | Sailing · Food · Water · Crew · Fatigue | Days since departure and supplies left |
| 3 | Contract | Days left, ✓ once found |
| 4 | Status line | What you're doing now, headwind, about n days to arrival / n days of supplies, sea name, speed |
| 5 | Mini chart | Centered on your ship, 40° of longitude wide. Click to open the chart window |
| 6 | Wind panel | Wind direction, wind speed (●1–5), tailwind/crosswind/headwind, clouds |

### Sea Screen — Bottom Buttons

![Sea screen](guide/p30_sea)

| # | Button | What it does |
| --- | --- | --- |
| 7 | Stop / Go | Furl the sails and stop — your route is kept, and Go carries on |
| 8 | Search | Only when stopped. Spend a day searching the area widely |
| 9 | ×0.5 ×1 ×2 ×4 | Game speed. At ×1 a day = 1.25 real seconds |
| 10 | Enter ○○ | When a known port is within 0.55° |
| 11 | Land | Land within 0.4° and 5 or more sailors — the whole crew goes as an expedition party |
| 12 | Fish | Fishing (later pages) |
| 13 | Sea Chart | The chart window (M) |
| 14 | Notebook | The Voyage Notebook |
| 15 | Follow the mouse | On/off (Shift) |
| 16 | ＋ − | Zoom in and out (the wheel works too) |
| 17 | Settings | The Settings window |

Time passes even when you're stopped — days go by, food and water run down, and other ships keep moving.

### Keys at Sea

| Key | What it does |
| --- | --- |
| ↑ ↓ ← → | The bow turns to that direction; release and you sail straight that way (two keys = diagonal) |
| Space | Stop. If you're stopped next to a port, enter it |
| Enter | Enter port |
| Numpad 1–9 | Eight compass headings; 5 stops |
| ` · 1 · 2 · 3 | Speed ×0.5 · ×1 · ×2 · ×4 |
| M · L · F | Chart · Land · Fish |
| ＋ − | Zoom in · Zoom out |
| Shift | Follow the mouse on/off |
| Right click | Clear the destination |
| Click | Sea = head that way · City = to that port · "?" or ruins = head that way · Another ship = approach it |

- Wind panel: with less than 45° between bow and wind it's a "Tailwind", under 110° a "Crosswind", under 150° a "Quartering headwind", and beyond that a "Headwind".
- Keep your bow within ±18° of the direction the clouds are drifting to get the full cloud-path tailwind (up to +8%, varies by sea).

### Sea Chart (M)

![Chart window](guide/p31_chart)

| # | Button | What it does |
| --- | --- | --- |
| 1 | ＋ − | Zoom in and out (wheel, drag and double-click work too) |
| 2 | All | The whole world |
| 3 | Here | To your current position |
| 4 | Legend | ⚑ capital · model size large/medium/small · teal corners = autopilot available · underline color = ruling nation · gold diamond = sponsor · red flag = contracted sponsor · navy dot = your position |
| 5 | Cities · Sea | Click a city for a summary and a "Autopilot to ○○" button · click the sea for "Go here" |
| 6 | Hint line | A summary of the controls |

- **How autopilot opens up**: sail from port A straight into port B without calling anywhere else, and the A–B route opens in both directions.
- If you touch the arrow keys, numpad or click the sea during autopilot, it disengages and can't be used again on that voyage.

### Pirates and Other Ships

![Meeting pirates](guide/p32_pirate)

| # | Button | What it does |
| --- | --- | --- |
| 1 | Fight | Sea battle |
| 2 | Flee (about n%) | Success chance 0.35 + (your fleet speed − pirate speed) × 0.5 + Navigation × 0.08 (10–90%). Failure means a sea battle |
| 3 | Pay the toll | 200 gold + 8% of your gold. Not enough money means a sea battle |
| 4 | Plead | Only when your gold + strongbox + cargo value is 10,000 or less — the pirates let you pass |

- Approach a ship that isn't hostile and you can choose "Ask for news" (clues or prices), "Buy food and water" (merchant ships only, 4 gold a barrel), "Attack" and so on. Attacking merchant ships or fleets raises your notoriety.
- A letter of marque from the palace makes pirates attack 80% less often.

### Famous Pirates · Wanted Posters · Pirate Flags

- In every sea, pirates famous in history and pirates of rumor lead their own pirate crews (they turn up rarely among pirate bands).
- **Restaurant "Look at the wanted posters"**: posters for the famous pirates active right now in that city's sea. Click a poster to see the portrait, crew, flag and bounty up close. Defeat that pirate's fleet and **"Claim the bounty"** at any port's restaurant.
- **Pirate rumors**: Restaurant "Listen to the customers' pirate tales" (once per visit, free, short deadline) · Tavern barmaid "Pay her and ask for news → Rumors of famous pirates" (costs a fee, generous deadline). Go to the waters you heard about within the deadline and that pirate's fleet really appears. It's noted in your notebook's "To Do".
- **Pirate flags**: each pirate crew has one flag — you get it the first time you defeat a pirate of that crew (belongings type "Pirate flag"). Take a pirate den and you get the den crew's flag too. The number collected shows under "Pirate dens" in your notebook.
- Defeat three different famous pirates in one sea and a pirate den is revealed. Rumors tell you first about pirates you haven't counted yet.
- **Absorption**: when you defeat a famous pirate, the rest of his band flows to another famous pirate in the same sea (same crew first, up to two per pirate). An absorbed pirate doesn't appear again; the absorbing pirate gains a ship for each one absorbed, stronger crew and gunnery, and a higher bounty. Posters show it as "Remnants absorbed 1/2". If there's no one to take them in, the defeated pirate gathers ships again.

### Rain Gear

![Rain at sea](guide/p33_rain)

| # | Field | What it does |
| --- | --- | --- |
| 1 | Status line | Showers or downpour, and your current measure |
| 2 | Rain gear | Only shown while it rains — choose one of the three below |

| Measure | Effect |
| --- | --- |
| Keep working on deck | Speed unchanged (×0.92 in a downpour). Catches a little rainwater |
| Rest in the cabins by turns | Fatigue −1.2, discipline +0.2, speed ×0.85 |
| Spread sailcloth to catch rainwater | Catch 1.2× a day's water use (2.5× in a downpour). Fatigue +0.4, speed ×0.95 |

Fatigue from getting soaked differs by sea — within 25° latitude, showers actually give −0.6; beyond 50°, showers +1.0 · downpours +2.0.

### Fishing (F)

| Step | Controls |
| --- | --- |
| Cast | Press Space (or the button) on the rising and falling power bar. More power reaches deeper water |
| Wait | Strike when the float sinks and "!" appears. Strike too early and the fish gets away |
| Reel in | Hold to reel, release to let line out. You only reel in while the tension is inside the green zone (the zone widens with each Seamanship level) |

- 3 baits a day. You can't fish in a storm.
- Fish become food, and rare fish become discoveries. You might also hook a message in a bottle (a clue), a pearl oyster or amber.

## Land Expeditions

### Land Screen

![Land expedition](guide/p40_land)

| # | Button | What it does |
| --- | --- | --- |
| 1 | Expedition · Party · Daily cost | Cost = (5 + party size) × mount multiplier (desert ×1.5). If you can't pay it all, fatigue +6, and members may leave |
| 2 | Terrain · Mount | How well your mount suits the ground here (◎○△×) |
| 3 | Go / Stop | Walk or stand — a day of walking takes 1.3 real seconds |
| 4 | Back | "Return to the starting point" → once there, "Board the ship" or "Return to the city" |
| 5 | Enter city | When a city is within 0.3° |
| 6 | Camp | The camp menu (next page) |
| 7 | Sea Chart | Map of the area (60° of longitude wide) |
| 8 | Follow the mouse | Same as at sea |

- Click the ground to walk there. Arrow keys keep walking in that direction; numpad 1–9 gives eight directions.
- A faint "?" on the map is a discovery your scouts have noticed. The area narrows as you get closer. Colors: geography sky blue · nature green · ruins orange · treasure gold · creatures red · people purple.
- When the expedition ends, mounts are left at the gate stables if you come back to the city, or handed over to a coastal village for 30% of their price if you go back to the ship.

### Camp

![Camp menu](guide/p41_camp)

| # | Button | What it does |
| --- | --- | --- |
| 1 | Rest (3 days) | Fatigue −25 (more with Seamanship, Cooking and Music skill) |
| 2 | Repair the ships (2 days) | Where the ships are in sight (within 1.2°) and you have damaged ships and materials |
| 3 | Hunt (1 day) | Food, where the ships are in sight. You may have to fight a herd of beasts |
| 4 | Draw water (1 day) | Water, where the ships are in sight. The amount depends on the land |
| 5 | Scout (2 days) | Reveal the map widely and survey the area. Sometimes finds a shortcut |
| 6 | Gather herbs (1 day) | If it works, less fever for 12 days and fatigue −8 |

## Combat

### Sea Battle

![Sea battle](guide/p50_battle)

| # | Button | What it does |
| --- | --- | --- |
| 1 | Allies · Enemies | Number of ships and crew |
| 2 | Wind · Battlefield | The wind and where you're fighting |
| 3 | Fleet Orders | Keys 1–7 (table below) |
| 4 | Our flagship | Ship no. 1. Lose it and you lose the battle |
| 5 | Enemy flagship | Ship no. 1. Sink or capture it to win |
| 6 | Pause | P. You can still give orders while paused |
| 7 | ×1 ×2 ×3 | Battle speed (＋ −). Kept for the next battle |
| 8 | Board | B. Close in on an enemy ship and board it |
| 9 | Retreat | The whole fleet slips away to the edge of the battlefield |

### Fleet Orders (1–7)

| Key | With ships fighting alongside | Flagship alone |
| --- | --- | --- |
| 1 | Follow the flagship — stay behind it and fire on the same enemy | Steer yourself |
| 2 | Crane Wing — wrap around in a half circle with the flagship in the middle | (off) |
| 3 | All-out attack — close in on one enemy | Charge |
| 4 | Gunnery Duel — guns only, from the edge of range | Gunnery focus |
| 5 | Guard the flagship — protect the area around it | (off) |
| 6 | Free attack — each ship takes the nearest enemy | Auto-engage |
| 7 | Withdraw — that ship alone leaves the battlefield | Retreat |

- Steer the flagship with the arrow keys; click the sea to go there, click an enemy ship to attack it. Cannons fire on their own at enemies on your broadside.
- Click one of your ships or pick one with Tab to give orders to that ship only.
- Right click: sends the selected ship (or the flagship, if none is selected) to that spot (it goes and holds). Right click on an enemy ship to target it.
- Enemies split their targets, swing around toward your bow and stern to avoid your broadsides, and turn to their loaded side while reloading the other. They throw grapples onto shattered ships, and pirates may flee when they lose their flagship.
- Two or more of our ships surrounding one enemy give +20% gunfire, three or more +35%.
- Lose our flagship and you dump half your cargo, and the next ship becomes flagship.

### Duels

![Duel — choosing a stance](guide/p51_duel)

| # | Field | Meaning |
| --- | --- | --- |
| 1 | Health · Momentum | Build up momentum to use techniques |
| 2 | Matchups | Thrust → Slash → Strike → Thrust (each beats the one the arrow points to) |
| 3 | Stance (keys 1–4) | All-out charge · Power attack · Take alive · Self-defense first — the effects are written on the cards |
| 4 | Next move | 0 auto · 1 Slash · 2 Thrust · 3 Strike |
| 5 | Techniques | The number is the momentum it costs (once-only ones can be used one time) |
| 6 | Pause · Faster · Withdraw | Space · — · Esc. With Self-defense first, withdrawing always works (60% with other stances) |

### Duels — Exchanges

![Duel — mid-exchange](guide/p52_duel_fight)

| # | Field | Meaning |
| --- | --- | --- |
| 1 | Exchange | Which exchange you're on |
| 2 | Last exchange | The moves both sides made, and the matchup |
| 3 | Next move | Win the matchup: +15 percentage points to hit, damage ×1.35 · lose it: damage ×0.75 |
| 4 | Techniques | Killing Blow (50) · First Strike (15) · Flank Attack (25) · Capture (20) · Feigned Retreat (15) · Secret Weapon (once) · Lure (15) · Switch (once) · Persuade (30) · Feint (15) · War Cry (20) · Finishing Move (100) |

- Momentum: +10 when hit, +4 when you hit, +6 when you block.
- Some fights let you choose "Leave it to my first mate". If your first mate loses a sea-battle duel, they're injured for 30 days.

### Land Battles

![Land battle — forming units](guide/p42_landwar)

| # | Field | Meaning |
| --- | --- | --- |
| 1 | Unit slots | Click to switch between infantry, musketeers, cavalry and artillery (admiral's unit + up to 5 units) |
| 2 | Admiral's unit | If it breaks, you lose |
| 3 | Enemy chief ★ | Bring them down to win |
| 4 | Begin battle | Start the fight |
| 5 | Avoid | Retreat (if it fails, the enemy strikes your rear) |

### Land Battles — Orders

| Key | Order | Effect |
| --- | --- | --- |
| 1 | Attack | Everyone strikes. Click an enemy unit to target it |
| 2 | Defense | Damage taken ×0.5; melee units strike back |
| 3 | Ambush | Success depends on terrain (high in forest, jungle and mountains). Damages the whole enemy + pins them once |
| 4 | Trap | The next enemy to charge takes heavy damage |
| 5 | Snipe | 50% of the enemy leader's men |
| 6 | Explosive Shell | Needs artillery and explosive shells. Damages the whole enemy |

- 3–6 can each be used once per battle. "Auto" repeats Attack.
- Units: infantry (one enemy unit) · musketeers (the three in front) · cavalry (reaches the back row and the leader; needs horses, camels or elephants) · artillery (the whole enemy; needs cannons and pack animals or wagons; one unit only).
- You also lose if your side falls below 20% of its starting strength. Of the fallen, 25% + Medicine × 15% come back alive.

## Crew and Cabins

### Assign Crew

![Assign Crew](guide/p60_roles)

| # | Field | What it does |
| --- | --- | --- |
| 1 | Flagship Cabin | Place mates in each room (next page) |
| 2 | Auto-assign | Seats mates without a tavern role in flagship cabins and posts on other ships to suit their abilities. On the right: number waiting |
| 3 | People on other ships | Each ship's captain, helmsman, deck, lookout and cabins (set automatically) |
| 4 | Mate's name | Click to choose a flagship role — first mate, navigator, surveyor, interpreter, purser · no role · dismiss |
| 5 | Current post | Where they are now: First Mate's Cabin, deck, "Captain · the ○○" and so on. A blue background means someone on another ship |
| 6 | Red "Waiting" | A mate with no post — loyalty −2 every month |

### Roles and Skills

| Role | Skills used |
| --- | --- |
| First mate | Swordplay, Gunnery, Marksmanship, Medicine, Shipbuilding, Science, Accounting, Eloquence, Theology, History, Craftsmanship |
| Navigator | Navigation, Seamanship, Cooking, Music |
| Surveyor | Surveying, History, Drawing |
| Interpreter | The languages that person knows |
| Purser | Accounting |
| Captain (other ships) | Navigation, Gunnery, Swordplay, Shipbuilding — on their own ship only |
| Helmsman, deck, lookout, cabins (other ships) | Not used — they only keep loyalty from falling |

- The admiral's own skills always count, and for the same skill the highest level is used.
- At loyalty 40 or below a mate works at only ×0.75, at 20 or below ×0.5. Mates with no post (waiting) lose 2 loyalty a month.

### Posts on Other Ships

- Every ship other than the flagship has four posts — **captain · helmsman · deck · lookout** — plus as many cabins as its size allows.
- People take posts **automatically** to suit their abilities: captain goes to someone good at Navigation, Gunnery, Swordplay, Shipbuilding and Strength; helmsman to Navigation and Seamanship; deck to Seamanship and Swordplay; lookout to Surveying and History. If you're short of people, each ship is filled evenly.
- The captain commands that ship (table above). Helmsman, deck, lookout and cabin posts have no fleet effect; they only keep loyalty from falling.
- Automatic filling happens: when you enter a city · when you set sail · every month · when a mate joins · when you change flagship · after a sea battle. Empty flagship rooms are filled then too, but people already seated in flagship cabins stay put.
- Flagship roles set at the tavern (first mate, navigator, surveyor, interpreter, purser) aren't changed by auto-assign.

### Flagship Cabin

![Flagship Cabin](guide/p61_cabin)

| # | Field | Meaning |
| --- | --- | --- |
| 1 | Cabins · Mates · Wages | 2–16 cabin slots depending on ship size. "Waiting n" is mates with no post |
| 2 | Auto-assign | Seats mates without a tavern role, starting with those whose skills suit the room (posts on other ships too) |
| 3 | Name tags | Fixed posts: captain's cabin (admiral) · First Mate's Cabin (first mate) · wheelhouse (navigator) · lookout post (surveyor) · deck |
| 4 | Blue number | The room's power = 1 + the level of the skill that suits the room (lower if loyalty is low) |
| 5 | Empty seat | Click to place someone. You can also drag a mate in |
| 6 | Cabin card | Decide an empty cabin's use with "Cabin refit" at the shipyard |
| 7 | Mate list | Click to assign a seat. Waiting mates are on top with a red background, people from other ships on blue |
| 8 | Abilities applied to the fleet | Skill levels (●●●) and cabin effects in use with the current arrangement. ▲▼ when they change |
| 9 | Other ships | Each ship's captain, helmsman, deck, lookout and cabin count (scroll down) |

### Cabin Types and Effects

| Fixed post | Effect (per point of power) |
| --- | --- |
| Lookout post | Discovery sighting range +0.12° · mapping speed +6% |
| Wheelhouse | Daily fatigue −0.03 |
| Deck | Discipline +0.04 (Seamanship, Swordplay) |
| First mate's room | Each month wages are paid, +1 loyalty for mates under 70 |

| Cabin | Skills | Effect (per point of power) |
| --- | --- | --- |
| Map room | Surveying, Drawing | Chart width +0.15° · mapping speed +10% |
| Galley | Cooking | Daily fatigue −0.05 |
| Mess hall | Cooking, Eloquence | Fatigue −0.04, discipline +0.03 |
| Counting room | Accounting | Haggling +3 percentage points, wages −2% (max −50%) |
| Chapel | Theology | Discipline +0.06 |
| Sickbay | Medicine, Science | Scurvy spread −7% (max 60%) |
| Recreation room | Music | Discipline +0.05 |
| Sail loft | Navigation, Seamanship | Speed +1% (max 8%) |
| Ship repair shop | Shipbuilding | Daily repair +0.1 |
| Livestock pen | Science | Daily food +0.12 |
| Gun room | Gunnery | Gunfire |
| Marines' quarters | Swordplay, Marksmanship | Boarding +4% |
| Studio · Sculpture room | Drawing · Craftsmanship | Make paintings · sculptures |
| Music room | Music | Fatigue −0.07 |
| Staff room | Seamanship, History, Surveying | Land-battle stratagem success +3 percentage points, damage +6% |
| Interpreters' room | — | The languages of people in this room are used for interpreting |

**Adjacent rooms** — Cabin cards are laid out in rows of 6. Rooms that touch above, below, left or right combine their power (not diagonally).

- **Music room ensembles**: from 2 people with Music skill in adjacent music rooms, they play together — 2 a duet · 3 a trio · 4 a quartet · 5–6 a band · 7 or more a group. The higher the members' Music and Eloquence levels and the more of them there are, the more daily fatigue drops and discipline rises at sea, and the bigger the fashion boost when you sell fashionable goods in the city you dock at (up to +75%). The card shows the ensemble's name.
- **Hot meals**: when the galley and mess hall touch, freshly cooked meals go out before they cool — the two rooms' fatigue, discipline and delicacy effects ×1.25, and the galley menu's multiplier +0.25.

Several rooms of the same kind add their power together, up to 8.

## Stats · Skills · Languages

What your admiral is good at comes down to three things — **stats** (natural makeup), **skills** (abilities learned and practiced) and **languages** (the power to understand and speak). This chapter describes "what each is used for" rather than numbers.

### Stats — The Four

There are four stats — **Vitality · Intelligence · Strength · Charm** — shown as bars on the Notebook's "Admiral" tab. (On navigator cards at the tavern, and when teaching children at home, Vitality is also called "Brawn".)

- **What's set at the start** — The younger you are, the higher your Vitality and Strength; the older, the higher your Intelligence and Charm. Your profession adds a little to the stats that suit it, and the star sign of your birthday boosts one stat. The older you are, the more bonus points you get to spread over the stats you want.
- **What changes over a lifetime** — Stats rise little by little through **experience** gained from getting things done (see "Experience and Growth"), and sometimes through **big events** like titles, marriage and sailing around the world.
- **Age** — While young you slowly gain Vitality, but past middle age Vitality and Strength drop every year. Adventures in old age run on Intelligence and Charm.
- **Mates' stats** — Mates have the four stats too. When they duel in your place, when a captain of another ship fights a boarding action, and when they lend a hand at reports and announcements, that mate's stats are used — and their way of speaking and personality reflect their stats as well.
- **Recruiting companions** — Each navigator has things they like, and if your stat that they favor is high, they're easier to win over.

### Vitality · Intelligence

**Vitality** — the power to endure

- Your stamina in duels grows. For mates, it can also mean less injury when hit.
- You can down cup after cup at the tavern without getting drunk and passing out.
- Wages for odd jobs at the inn go up.
- Experience: grows through fine dining, battles and duels. Past middle age it falls a little every year.

**Intelligence** — the power to learn

- Intelligence decides **how many** skills and languages you can learn (the limit when creating your admiral and when training at a guild).
- High Intelligence at creation gives bonus skill points. The highest Intelligence gets one more bonus on top.
- Guild skill training and language study go better. You also pick up the local language faster while doing odd jobs at the inn.
- In duels, tricks like Feigned Retreat, Lure and Feint work better, and you fall for your opponent's tricks less.
- With very high Intelligence you recover a few more fallen members after a land battle.
- When you play chess with a child at home, your Intelligence goes up against the child's.
- Experience: grows through trading, persuasion, socializing, and books read for the first time.

### Strength · Charm

**Strength** — the power to fight

- Duels hit harder — you land more blows, strike more painfully, and draw first.
- Decisive duel techniques work better: Killing Blow (with very high Strength you can go for it even if your opponent isn't badly hurt yet) · Capture · War Cry.
- The **Strength of a mate captaining another ship** becomes that ship's boarding attack. (The flagship, with the admiral aboard, fights with the admiral's weapon.)
- "Lean on them" works better when chasing debts, and "Remind them of a common enemy" carries more weight in diplomatic talks.
- Experience: grows through battles and duels. Past middle age it falls a little every year.

**Charm** — the power to win hearts

- Contract negotiations with sponsors, persuading them with eloquence about discoveries outside their interests, and treaty talks with foreign courts go better.
- Haggling at trading posts and markets works better.
- "Reason with them kindly" when chasing debts, and calming the ringleaders with words during a mutiny, work better.
- When the admiral helps out at reports and announcements, things go over better. With very high Charm you're even more persuasive with sponsors of the opposite sex.
- In duels it's easier to make opponents sheathe their swords with "Persuade", and "War Cry" carries more weight too.
- Experience: grows through persuasion, socializing and trading, and rises when you receive a title or marry.

### Experience and Growth

Every time you get something done, **experience** in that category builds up and is shared out among the stats set for that category.

| Experience | When it builds | Stats that grow |
| --- | --- | --- |
| Persuasion | Persuading, negotiating with and reassuring sponsors · negotiating with garrison captains · calming mutinies · chasing debts (with words) · treaty talks at court · "Persuade" in duels · helping out at reports | Charm · Intelligence |
| Trading | Buying and selling at trading posts (more for bigger profits) · successful haggling | Intelligence · Charm |
| Combat | Sea battles · land battles (more for victories, and for bigger enemies) | Strength · Vitality · Intelligence |
| Duels | Duels where the admiral crosses swords personally (none when a mate fights in your place) | Strength · Vitality |
| Fine dining | A meal at a restaurant (double for a dish you're tasting for the first time) | Vitality · Charm · Intelligence |
| Socializing | Every time you gain social fame | Charm · Intelligence |

- You learn a little from failure too (experience builds even when persuasion fails or you lose a fight).
- **The higher a stat, the much harder it is to raise by 1.** Up to the middle it's quick, but higher up it takes years, even decades.
- Each stat has a cap on the experience it can gain per day and per year, so you can't pump it up by repeating the same thing. Even a whole lifetime of experience alone will almost never reach 100.
- Stats also rise through **big events**: being granted a title · your first marriage · an English knighthood (Charm), rescuing the vanished princess · a great naval victory (Strength), Princess Elizabeth's escape (Intelligence), writing a castaway's account · sailing around the world (Vitality and Intelligence). For stats that are already very high, events don't raise them directly but add experience instead.
- When a stat rises you get a notice and a line in your log. Under "Experience and Growth" on the Notebook's "Admiral" tab you can see the experience in each category and how much remains to the next point.

### Skills — Levels and How They're Used

There are 17 skills, each with **levels 0–3** (◇◇◇ → ◆◆◆).

- **Whose level is used** — Among the admiral, mates in roles that use the skill (first mate, navigator, surveyor, purser) and mates in cabins that use the skill, **the highest level** applies to the whole fleet.
- **Skills that work just by having them aboard** — Cooking, Music, Drawing and Craftsmanship mostly work as long as someone in the fleet has them, even without a role. Medicine against scurvy works from anyone aboard, too.
- **Skills used ship by ship** — Gunfire, boarding, storm damage and repairs on other ships depend on the skills of that ship's captain alone.
- **With low loyalty**, mates don't give their full skill. While injured they give only half.

**Ways to learn skills**

- **Creating your admiral** — Spend points to raise the starting skills set by your profession. Intelligence decides how many you can learn.
- **Guild "Train a Skill"** — Spend money and days to go up one level at a time. Higher Intelligence helps, and higher levels are harder. If it fails, you only lose the money and the days.
- **Mates** — Spending a long time in a cabin, a mate picks up that room's craft, and their level rises over the years (Eloquence in the First Mate's Cabin, Navigation in the wheelhouse, Surveying in the lookout post). A room's main skill (★) gives +1, +2, +3 after 3, 9 and 27 years; its secondary skill (☆) is 1.2× slower, giving +1, +2, +3 after 3.6, 10.8 and 32.4 years (e.g. marines' quarters — ★Swordplay · ☆Marksmanship). Skills go up to 3.
- **Children** — They grow when you teach them at home and take them on apprentice voyages (up to the skill level in the admiral's fleet). Before adulthood (16) they can reach level 2 at most; higher levels are harder and higher Intelligence learns better. They also learn their live-in mother's skills. Once grown and aboard, they learn in cabins like any mate.
- Books don't raise skills. Instead, scholarly works can only be read if someone knows that field.

**LV3 skill combinations — hidden abilities**

When the admiral personally masters three matching skills all to LV3, a hidden ability appears in their profile. Mates' effective levels don't unlock it. Even if you have several combinations, each area has a cap, so they don't become excessively stronger than regular skills, cabins and equipment.

| Hidden ability | Skills needed | Effect |
| --- | --- | --- |
| Invincible Admiral | Swordplay · Marksmanship · Gunnery | Land-battle damage +10% |
| Survival Expert | Navigation · Seamanship · Medicine | Land costs −15%, fatigue gain −10% |
| Mafioso | Eloquence · Accounting · Swordplay | Haggling and debt collection +6 percentage points |
| Living Saint | Theology · Medicine · Music | Land illness −15%, discipline loss −10% |
| Grand Navigator | Navigation · Seamanship · Surveying | Sailing speed +5% |
| Ironclad Commodore | Gunnery · Shipbuilding · Seamanship | Cannon damage +6%, repairs +10% |
| Marine Commander | Swordplay · Marksmanship · Seamanship | Land-battle damage +5%, friendly losses −8% |
| Storm Chaser | Navigation · Shipbuilding · Science | Storm damage −15%, speed +2% |
| Merchant Prince | Accounting · Eloquence · Surveying | Buying prices −2%, selling prices +2% |
| Treasure Doctor | History · Craftsmanship · Surveying | Discovery value and fame +6% |
| Renaissance Man | History · Science · Drawing | Discovery value and fame +5% |
| Master Physician | Medicine · Science · Cooking | Land illness −20%, fatigue gain −5% |
| Idol of the Crew | Music · Eloquence · Theology | Discipline loss −15% |
| Royal Diplomat | Eloquence · History · Theology | Haggling and debt collection +4 percentage points, selling prices +1% |
| Polymath | History · Science · Theology | Discovery value and fame +4%, land illness −5% |
| Grand Master | Craftsmanship · Drawing · History | Discovery value and fame +4%, selling prices +1% |
| Sea Wolf | Navigation · Swordplay · Gunnery | Speed +2%, sea-battle boarding +8% |
| Dead Shot | Marksmanship · Gunnery · Surveying | Cannon accuracy +5%, damage +4% |
| Master of Logistics | Accounting · Seamanship · Cooking | Food and water use −8%, land costs −8% |
| Shipwright King | Shipbuilding · Craftsmanship · Science | Repairs +15%, storm damage −5% |

The final caps on stacked bonuses are sailing speed +8%, cannon damage +10%, sea-battle boarding +8%, discovery value and fame +15%, repairs at sea +20%, and reductions to storm damage, land costs and discipline loss of up to 20–25% each.

### Skills — Ships and the Sea (1)

**Navigation** (navigator · sail loft; on other ships, that ship's captain)

- Reduces the fatigue that builds up each day at sea.
- Reduces damage to ships, crew and food when you hit a storm (it doesn't help you avoid storms). The flagship's Navigation reaches other ships a little too.
- Ships whose captain has high Navigation are faster and lose less when tacking against a headwind.
- Fleeing enemies, avoiding icebergs and shoals, and spotting the signs of a tsunami go better.
- If nobody knows Navigation, your first mate will try to stop you when you set sail. Needed to read some navigation treatises.

**Seamanship** (navigator · deck · sail loft · staff room)

- Crew discipline falls less at sea. When several ships sail together, it helps tow the slower ones so the line falls behind less.
- On land expeditions you walk faster, build up less fatigue, and resting at camp works better. The cost of desert heat and sandstorms drops, and it's easier to protect your party in blizzards and swamps.
- Reduces disaster damage, brings in more when you meet a school of fish, and makes bites come more easily when fishing.
- In the staff room, land-battle stratagems (ambush, trap, snipe) work better.

### Skills — Ships and the Sea (2)

**Surveying** (surveyor · map room · lookout post · staff room)

- **From level 2 you can see latitude at sea** (longitude needs a sextant).
- Widens the range for finding unknown ports, the area your chart reveals, and the distance your lookouts notice things first. Land scouting too.
- Finding sea discoveries without a clue, following seabirds to new ports, and finding old mountain paths go better. You also draw more water at camp.
- Helps with ambushes and traps in land battles and with noticing the signs of disasters. With higher Surveying, treasure maps narrow down the spot with more evidence.
- If no one in the expedition plan knows Surveying, you get a warning. Needed to read some scholarly works.

**Shipbuilding** (first mate · ship repair shop; on other ships, that ship's captain)

- Repairs ships at sea using materials (no materials, no repairs). The ship repair shop repairs the flagship more.
- Repairs go much further when you camp ashore to fix the ships, and in shipwreck events.
- If you know the local language, your notebook can tell you whether a city you haven't visited has a shipyard, and how advanced it is.

### Skills — Combat

**Swordplay** (first mate · deck · marines' quarters; on other ships, that ship's captain)

- Boarding actions in sea battles get stronger. The flagship's marines' quarters make them stronger still.
- Duels: the admiral fights with **the admiral's own Swordplay** (mates' Swordplay isn't added). You hit more often, land more critical hits and first strikes, and read your opponent's moves better. If a mate fights in your place, they use their own Swordplay, and on "Switch" the strongest steps in.
- Land battles: infantry, cavalry and the admiral's unit get stronger, and at level 3 cavalry become heavy cavalry. With Swordplay, Marksmanship and Gunnery all at level 3, the admiral's unit becomes the Invincible Admiral's unit.
- Hunting yields a little more, and it's easier to hold firm against a ghost ship. Also used for "Lean on them" when chasing debts.

**Gunnery** (first mate · gun room; on other ships, that ship's captain)

- In sea battles you reload faster and your shots hit more. The flagship's gun room adds power.
- Land-battle artillery gets stronger, and at level 3 it becomes cannon artillery.

**Marksmanship** (first mate · marines' quarters)

- Not used in sea battles — it's for fighting on land and hunting.
- Land-battle musketeers get stronger, and at level 3 they become musket infantry. The "Snipe" stratagem works better.
- With the duel's "Secret Weapon", you fire a pistol instead of a dagger.
- You get more food from hunting and buffalo-herd events.

### Skills — Caring for the Crew

**Medicine** (first mate · sickbay / for scurvy, anyone aboard)

- Scurvy starts later and spreads more slowly. The sickbay delays it further. It also guards well against fever at sea.
- On land expeditions you lose fewer members to fever, find herbs more easily, and endure blizzards better.
- Reduces disaster damage, and gets some fallen members back on their feet after land battles. Also needed for some scholarly works and old-tale events.

**Cooking** (anyone)

- Meals aboard ship and at camp ease fatigue. It also eases fatigue on rainy days, and supper on hunting days is heartier.
- When a mutiny breaks out you can choose "Throw a feast to calm them" (either Cooking or Music is enough). Feast events at sea happen too.
- Recognizes the worth of edible discoveries like spices and crops, and raises it.
- A cook in the galley serves their homeland's food as well as their skill allows, easing fatigue and raising discipline. Food from the admiral's homeland is welcomed even more.

**Music** (anyone)

- Holds the crew's discipline with songs and instruments. Sea-shanty events come more often, and resting at camp works better.
- Lets you throw a feast during a mutiny (same as Cooking).
- Raises the value of folk discoveries such as people's songs, dances and rituals, and opens hearts on the spot.
- The recreation room looks after discipline, the music room fatigue. Music rooms that touch form an ensemble (duet, trio, quartet, band, group).

**Theology** (first mate · chapel)

- Holds the crew's discipline at sea. The chapel holds it even better.
- Donating to the church raises more fame, and praying at church raises discipline.
- You don't waver when you meet ghost ships or sirens.
- Needed to read theology treatises.

### Skills — People and Trade

**Eloquence** (first mate · mess hall · First Mate's Cabin)

- **You need Eloquence** to try persuading a sponsor about a discovery outside their interests.
- Contract negotiations with sponsors go better, and you lose less when raising the advance or extending the deadline — the higher the level, the better the terms you win.
- Coaxing the steward when your fame falls short, and "Call a witness" when your evidence is weak, work better. At reports and announcements you open with a confident tone.
- When entering port, negotiating with the garrison captain is cheaper and goes better, and sneaking in gets easier.
- Talking to natives to get clues, and winning them over with gifts, work better.
- Used for calming mutiny ringleaders, "Persuade" in duels, holding on to mates and wives who want to leave, breaking up mates' marital quarrels, "Reason with them" when chasing debts, and hearing tales of treasure maps at taverns.
- If you speak the local language and have high Eloquence, you also know the leaders of cities you haven't visited.

**Accounting** (first mate · purser · counting room)

- Haggling at trading posts works better, the discounts are bigger, and you can haggle more times per visit. With a purser, once more.
- **You need Accounting** for "Haggle" to appear at the market.
- Loading cargo evenly increases the weight your ships can bear.
- **At level 3** you can enter the back-alley black market in big ports (each deal adds notoriety).
- If you know the local language, you can learn the specialties and prosperity of cities you haven't visited.
- Having a **purser** makes haggling much more favorable, gives you one more round of contract negotiation with sponsors, and gets you a bigger advance. The counting room cuts wages.

### Skills — Learning and Discovery (1)

**History** (first mate · surveyor · staff room)

- Widens the range for finding land discoveries, and makes them easier to find without clues. Land scouting sees farther too.
- You notice the signs of disasters well. From level 2 you recognize disasters recorded in old chronicles better.
- You know the leaders of cities you haven't visited.
- Needed to read history treatises (some old manuscripts need level 2 to decipher).

**Science** (first mate · sickbay · livestock pen)

- Delays scurvy, guards against fever at sea, and helps you find herbs.
- Widens the range for finding creature and nature discoveries. You notice the signs of disasters well too.
- Rare fish bite more often when fishing. In the Sphinx's riddle, it rules out one wrong answer.
- In the livestock pen it raises food. Needed to read science treatises.

### Skills — Learning and Discovery (2)

**Drawing** (anyone · map room · studio)

- Raises the value of every discovery — fame, report rewards, naming grants.
- Decides the **grade of evidence**: the better your drawing, the more it becomes a "detailed plate"; if it's clumsy, a "sketch"; if nobody can draw, an "oral account", which sponsors may doubt. If a mate who draws well joins later, they redraw it and raise the grade.
- Capture spectacles like whale pods and waterfalls in your sketchbook for fame. Forgeries you hand over are less likely to be caught.
- A mate in the studio paints artworks and loads them in the hold.

**Craftsmanship** (anyone · sculpture room)

- Greatly raises the value of treasure, ruin and folk discoveries, and the others a little. Raises the price when you sell relics, too.
- Gets more of value out of treasures and ruins that have no relic. Also helps the grade of evidence.
- Forgeries are less likely to be caught. Jewelry given to barmaids and mates moves their hearts more.
- A mate in the sculpture room makes sculptures. Some old-tale events only open with Craftsmanship.

### Languages — Understanding

There are 16 languages (Spanish · Portuguese · Romance · Germanic · Slavic · Greek · Arabic · Persian · Chinese · Hindi · Uyghur · African languages · Mesoamerican & Andean languages · Southeast Asian languages · East Asian languages · Korean · North American languages), and the levels are **None · Basic · Normal · Fluent**.

- **A city's language** — Every city has its language, and the "Language" field on the city screen's top bar shows in dots how well your party speaks it. In ports ruled by Portugal or frequented by Portuguese merchants, Portuguese works too.
- **Dialogue window** — If the admiral doesn't know the language well, words they didn't catch appear in that country's unfamiliar script. As your level rises you catch more words, and when fluent you understand everything.
- **Interpreting** — If a mate placed as first mate, interpreter or in the interpreters' room speaks the language better than the admiral, an interpreter window pops up under the dialogue and translates. If the interpreter isn't good either, they translate only part, "roughly understood" or "caught in bits".
- **Natives** — Even with no shared language at all, gestures get a little across.
- **Whose language is used** — The best among the admiral, the first mate, the interpreter and those seated in the interpreters' room. Mates in other roles and captains of other ships don't count. (Only at libraries do all the mates you have with you read together.) But with a **Chief Interpreter** (below), the languages of every mate aboard the flagship are used.

### Languages — What Gets Blocked and What Improves

**What you can't do without any knowledge of the language**

- Haggling at trading posts and markets (buying and selling still work)
- Hearing trade gossip, contract information, destinations and drinking talk at taverns
- Chasing debts, and negotiating with the gate's garrison captain
- An audience with a sponsor (the steward won't deal with you)
- Taking on a navigator as a mate at the tavern (you need a shared language to talk)
- Looking up the specialties and leaders of cities you haven't visited in your notebook
- Reading a library book if nobody knows its language

**What gets better the better you speak**

- Haggling at trading posts and markets, gate negotiations, chasing debts and diplomatic talks go better.
- Sneaking in gets easier. A mate whose mother tongue it is can act as a guide and makes it easier still.
- New mates trust you more from the start. If you aren't fluent, you'll hear that they "haven't fully opened up yet".
- You read more passages of a book at the library. When your language improves, rereading the same book gets you the remaining passages.
- If nobody knows the destination's language in an expedition plan, you get a warning to "take an interpreter".

### Languages — How to Learn · Taking Interpreters

**How to learn languages**

1. **Creating your admiral** — You start fluent in your mother tongue and at Normal in the neighboring Iberian language. Remaining points can raise other languages; Intelligence decides how many you can learn.
2. **Guild "Study a Language"** — Learn the languages of the city and nearby regions one level at a time for money and days. Higher Intelligence helps, and higher levels are harder.
3. **Inn "Odd Jobs"** — Pick up the city's language by ear while doing kitchen work and chopping wood. Higher Intelligence learns faster, but your fame drops a little while you work, and you can't keep it up long.
4. **Living on the same ship** — You pick up a little of your mates' mother tongues every day. The first mate's language, right beside you, improves fastest; other mates' languages more slowly. Mates also learn the admiral's mother tongue and each other's languages.

**Taking interpreters**

- Give someone the **interpreter** role in Assign Crew and their languages are used by the fleet (only their languages are used, not their skills).
- The **first mate**'s skills and languages are both used.
- Build an **interpreters' room** at the shipyard and seat people in it to have several interpreters — if your fleet travels many seas, bring mates who speak different languages.
- **Chief Interpreter** — Seat the person you appointed interpreter in the interpreters' room, and they gather the languages of the admiral and the flagship's mates into an "interpreting ledger" and interpret them all. For languages they don't know, they ask someone who does and translate like "○○ told me —", and they learn languages faster than other navigators (the ledger is in the admiral's notebook).
- The cook in the galley serves their homeland's food — the more mates with different languages, the more varied the ship's table becomes.

## Discoveries and Reports

### Discovery Window

![A new discovery](guide/p62_disc)

| # | Field | Meaning |
| --- | --- | --- |
| 1 | Picture | The discovery |
| 2 | Name · Tags | Category · region · value |
| 3 | Description | The discovery's story |
| 4 | Fame | Fame received on the spot where you found it |
| 5 | OK | Close |

If you got a relic, "Relic obtained" appears with it — report to a sponsor and you hand it over as evidence; announce it yourself in port and it's the admiral's to keep.

### Report or Announce?

|  | **Report** to a sponsor (palace · mansion) | **Announce** in port |
| --- | --- | --- |
| You get | Reward + fame + trust | Fame (discovery fame × 0.9) |
| Relic | Handed over as evidence | The admiral's |
| Without evidence | Reward ×0.55–0.8, fame ×0.8 | Fame ×0.8 |
| Past the deadline | Reward ×0.35–0.7, fame ×0.7 | — |
| Note | Without a contract, from the second report to the same sponsor in the same year the reward shrinks | Announcing a contracted discovery fails that contract |

- **Grade of evidence**: the real thing ×1.05 · detailed plate ×1.05 (Drawing level 2+) · chart ×1 · sketch ×0.95 (Drawing level 1) · oral account ×0.9. With a sketch or oral account, sponsors may be doubtful.
- **Batch report and announcement**: with two or more discoveries to report, "Propose a Voyage" offers "Report them all at once", and at the port's "Announce" you can pick several and announce them together.
- **40 resort islands** (nature): found by bringing your ship close to islands such as Koh Samui, the Maldives, Bali, the Seychelles, Santorini, Madeira, Jeju, Tahiti, Bora Bora and Mauritius. The moment you find one, the "Holiday" effect gives fatigue −25 · discipline +8 (the "Awe" of other nature discoveries is −16 · +2).
- **Filtering and sorting by category**: click the category buttons above the proposal, batch report and announcement windows (All · Geography · Nature · Ruins · Treasure · Creatures · Peoples · Trade goods) to show only that category; "Select all visible" picks only what's shown. "Sort" changes the order to value, category, name or most recently found, and it carries over when you reopen.
- **Pinning items**: click the pin in front of an item in the Notebook's "Belongings", the residence storeroom or the market's sell window to pin it (like a favorite). Pinned items are left out of the market's "Select all" and the storeroom's "Store all", and you can gather them with the "Pinned" type button. Selling or storing keeps the list's scroll position.
- **If a rival announces first**: you can still find it on site later, but the honor of first discovery stays with the rival, and fame and rewards shrink. Sponsor contracts already made and their clues remain until the deadline.

## Chartered Companies and Shares

### When Companies Are Founded

A company with a royal charter is founded in each era. When one is founded, news arrives and a company building appears in the streets of its headquarters city.

| Company | Founded | Headquarters | Monopoly goods |
| --- | --- | --- | --- |
| Casa da Índia (Portugal) | 1501 | Lisbon | Pepper · Cinnamon · Ginger |
| Casa de Contratación (Spain) | 1503 | Seville | Silver · Gold · Dyes |
| Muscovy Company | 1555 | London | Furs · Hemp |
| Levant Company | 1592 | London | Raw silk · Carpets |
| English East India Company | 1600 | London | Cotton cloth · Yarn · Tea |
| United East India Company (VOC) | 1602 | Amsterdam | Nutmeg · Cloves · Cinnamon |
| Dutch West India Company | 1621 | Amsterdam | Sugar · Furs |
| French East India Company | 1664 | Nantes | Coffee · Yarn |

- **Company headquarters**: member roll (join · promotion) · company missions · delivering monopoly goods · share counter
- **Factory** (that company's city overseas): company warehouse · brokerage orders · company missions
- **Exchange** (Antwerp 1531–1585 · London 1571– · Amsterdam 1602–): buy and sell shares in every company

### Becoming a Member

Join at the headquarters' "Member roll" by paying a subscription (total fame 200 or more). 80% of the subscription comes back as shares in that company. You belong to **one company at a time**, and if you leave you can't join any company for a year.

| Benefit | What it does |
| --- | --- |
| Company warehouse | Buy the factory's goods at 60% of the trading-post price — up to your rank's quota, renewed every 60 days |
| Monopoly deliveries | Hand monopoly goods to headquarters for market price × 1.25–1.4. **The more you hand in, the lower the price**, recovering after a month or two |
| Brokerage orders | A chain linking factories and big ports. Each link builds a chain bonus, and completing the chain gives × 1.5 |
| Company missions | Anti-smuggling patrols · homeward-bound fleets · building factories · capturing rival companies (only **companies of nations that are enemies** at the time) |
| Customs | If you're not a member, your hold is searched when you bring that company's monopoly goods into its headquarters port |

As your contribution builds you rise from member → captain → director → governor, and your quota, delivery prices and mission pay grow.

### Shares · Founding Subscriptions

- Share prices swing every month, and **dividends arrive automatically every January**. Fleets returning or sinking, big world events and the admiral's company missions move share prices.
- **Investment limit**: the money put into shares (total purchase price) is capped at **1,000,000** gold. Sell and you can buy that much again. Up to 3,000 shares in any one company.
- **Founding subscriptions**: money paid in the founding events in London (1600), Amsterdam (1602 · 1621) and Paris (1664) becomes shares in that company. Within the historical subscription period you get them at face value (500 gold a share); later additional subscriptions are at that day's price.
- **Founding subscribers**: those who subscribed within the subscription period become members without a subscription **within 10 years** of the company's founding, as long as they still hold all the shares they received then.
- The first settlements (English East India Company 1604 · Dutch East India Company 1610 · West India Company 1629) pay out per share held on that day.
- The exchange's "broker's tip" tells you about coming news in advance, but it isn't always right.

## Frequently Asked Questions

### When You're Stuck

| Question | Answer |
| --- | --- |
| Longitude shows "?" at sea | You need a sextant to see it. Latitude shows with an astrolabe or sextant, or Surveying level 2. Your home market always has a compass and sextant |
| I clicked a port but autopilot won't work | The route only opens once you've sailed straight between the two ports without calling anywhere else |
| I can't meet the sponsor | Your fame isn't high enough. Ask the steward for a small job to build fame and trust |
| I can't set sail | You have fewer than 5 sailors (or less than 1/3 of the minimum crew), or less than 2 days of food or water |
| A book is red | It's one of: not yet published · you haven't finished the earlier books in the series · not enough language or learning · it's about a land you don't know yet |
| Strange script is mixed into the dialogue | Those are words you didn't catch because you don't know the language well. Learn it through inn odd jobs or guild language study, or take a mate who speaks it well as interpreter (the language pages of the "Stats · Skills · Languages" chapter) |
| How do I raise my stats? | Little by little through persuasion, trading, combat, duels, fine dining and socializing experience, and through big events like titles and marriage. The higher they are, the slower they rise (the "Experience and Growth" page) |
| I can't save | On Strict Rules difficulty you can only save at inns in your home country's cities. Check that autosave is on in Settings |
| I don't know what to do | Look at the city's "Things to do here" and the Notebook's "Discoveries" tab |

Good luck, Admiral. On to farther seas!
