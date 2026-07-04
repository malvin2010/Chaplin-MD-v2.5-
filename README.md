# Chaplin MD v2.5

WhatsApp Multi-Device bot. Created by Malvin C. Powered by Handsome Tech ZW.

## What's actually in this build

- 280 real, distinct, working commands, verified programmatically: loaded the actual command registry, counted it, checked for duplicate names, checked every command has real executable code. Zero placeholders.
- Every outgoing message is auto-styled in small-caps font, wrapped once around sock.sendMessage in index.js, so all 280 commands get it automatically. URLs are left untouched so links still work.
- Pairing is code-based, not QR — visit the website, enter your number, get an 8-digit pairing code.
- public/ has exactly one file: index.html, fully self-contained (CSS and JS inlined).
- commands/ has exactly one file: index.js, containing all 280 commands (large by design, consolidated as requested).
- Two index.js files total: one at the project root (entry point / connection logic) and one inside commands/ (every command).

## No APIs / no signup, honestly

Downloading a song or fetching an anime picture is inherently a network call to something. This bot only uses free, keyless, no-signup services: yt-dlp for YouTube audio/video, waifu.pics + nekos.best for anime, wttr.in for weather, opentdb for trivia, restcountries, nominatim, worldtimeapi, etc. No API keys anywhere. The "Handsome Ai's" category is a lightweight rule-based responder, not a real LLM, labeled honestly as such in the code.

## Commands overview (280 total)

- General (10): menu (image + buttons), ping, alive, about, owner, pair, chatbot, addplaylist, playlist, runtime
- Owner (3, exactly as requested): restart, addpremium, delpremium
- Download (4): song (info card then choose audio/document), video, lyrics, ytsearch
- Anime (47): waifu.pics (31 reactions) + nekos.best (16 more)
- Fun (14): joke, meme, fact, 8ball, roast, compliment, ship, truth, dare, quote, chucknorris, catfact, dogfact, rps
- Utility (99): sticker, translate, weather, qr, shorturl, expandurl, calc, currency, define, base64, morse/demorse, binary/hex encode-decode, rot13, leet, piglatin, palindrome, word/char counters, case converters, password/username generators, bmi/bmr/tip/vat/discount/loan calculators, unit converters, number-base converters, fancy-text converters, country lookup, random user, number facts, dns lookup, world clock, timezone lookup, moon phase, sunrise/sunset, distance between cities, and more
- Zim Special (25): zimfact, shonaproverb, zimslang, zimjoke, zimflag, city info (Harare, Bulawayo, Mutare, Vic Falls, Gweru, Kwekwe, Chinhoyi, Masvingo), national parks, zimcurrency, zimsport, zimfood, zimwildlife, zimmusic, zimindependence, zimgreeting, zimlanguages
- Malvin C's (15): creator, malvinquote, malvinstatus, handsometech, support, and more branded commands
- Boredom (30): riddle + riddleanswer, wyr, neverhaveiever, trivia + 15 category-specific trivia commands, flip, guessnumber (interactive game)
- Crazy (15): dice, rate, zalgo, reverse, mock, chaos, randomnumber, fancytext, wordscramble, doublestruck, spacedout, clap, vaporwave, shout, whisper
- Handsome Ai's (16): ai, advice, motivate, horoscope, wisdom, airoast, aicompliment, aistory, ainame, aipickup, aigreeting, aiencourage, aiplan, zodiaccompatibility, numerology, lovecalculator, aiquiz, aiforecast

Run .menu in WhatsApp any time for the live, up-to-date list with images and buttons.

## How pairing works

This bot does not print a QR code or pairing code in the server logs. Instead:

1. Deploy the bot (steps below). It starts up with no session.
2. Visit your deployed website (the Render URL).
3. Enter the WhatsApp number you want the bot to run as, digits only, with country code.
4. You'll get an 8-digit pairing code. In WhatsApp: Linked Devices, Link a Device, Link with phone number instead, then enter the code.
5. Once linked, the bot saves its session to the session/ folder and stays connected.

.pair typed in a chat just replies with the link to this website.

## Deploy to Render

1. Push this folder to a GitHub repo.
2. On Render: New, Web Service, connect the repo.
3. Render will detect render.yaml and use the Docker build (this installs ffmpeg + yt-dlp, both required for downloads).
4. Set environment variables (Render dashboard, Environment):
   - OWNER_NUMBER: your number, digits only (used for the 3 owner commands)
   - SELF_URL: fill this in after first deploy, with your Render URL
5. Deploy. Once live, visit the URL and pair your number as above.

## Keeping it awake on Render's free tier

Render's free web services sleep after about 15 minutes of no traffic. No code running inside the app can prevent that once it's fully asleep; that has to come from outside. The fix (free, 2 minutes):

1. Go to uptimerobot.com (or cron-job.org) and create a free account.
2. Add a new monitor: type HTTP(s), URL = your Render URL + /ping, interval = every 5 minutes.
3. Save. Regular pings keep the service from ever fully sleeping.

## Local development

npm install
cp .env.example .env
npm start

Then visit http://localhost:3000 to pair.

## Customizing the look

- config.js MENU_IMAGE: swap for any image URL to change the .menu banner.
- public/index.html: the style block at the top controls the pairing site's colors.
- lib/style.js SMALLCAPS_MAP: controls the auto-applied message font. Edit or remove letters for a different look, or delete the sock.sendMessage wrap in index.js to turn styling off entirely.
- config.js BOT_NAME, OWNER_NAME, POWERED_BY: your branding, used everywhere.

## Adding more commands

Everything lives in commands/index.js now. Add a new object to whichever category array (or start a new one) with name, aliases, category, desc, execute, then add it to the module.exports spread at the bottom if it's a new array.
