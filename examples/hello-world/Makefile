bin = ../../node_modules/.bin
sjs = $(bin)/sjs

%.js: %.sjs
	$(sjs) --readable-names \
	       --module ../../macros \
	       --output $@ \
	       $<

all: index.js

run: all
	node index
