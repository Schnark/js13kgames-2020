JS = show-time.js audio.js play.js air.js earth.js fire.js water.js game.js
GLOBAL = showTime, audio, play, air, earth, fire, water

.PHONY: check
check: min/game.zip
	@echo
	@echo "Current size:"
	@wc -c min/game.zip

min/all.js: $(JS)
	(echo "(function(){var $(GLOBAL);" && cat $(JS) && echo "})()") > min/all.js

min/min.js: min/all.js
	minify-js min/all.js > min/min.js

#based on xem's mini minifier
min/min.css: game.css
	tr '\t\n\r' ' ' < game.css | sed -e's/\(\/\*[^*]\+\*\/\| \)\+/ /g' | sed -e's/^ \|\([ ;]*\)\([^a-zA-Z0-9:*.#"()% -]\)\([ ;]*\)\|\*\?\(:\) */\2\4/g' > min/min.css

min/index.html: min/min.js min/min.css index.html
	sed -f modify.sed index.html > min/index.html

min/game.zip: min/index.html
	cd min && zip -9 game.zip index.html

.PHONY: clean
clean:
	rm min/all.js min/min.js min/min.css min/index.html min/game.zip

.PHONY: lint
lint:
	jshint -a *.js
	jscs -a *.js