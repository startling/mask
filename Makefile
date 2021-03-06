IMAGES= $(patsubst test-data/%.png,\
	test-data/%-binary.pbm,\
	$(wildcard test-data/*.png))\
	$(patsubst test-data/%.png,\
	test-data/%-ascii.pbm,\
	$(wildcard test-data/*.png))

test: $(IMAGES) mask.js test.js
	mocha

lint: $(wildcard *.js)
	$(foreach file,$^,jsl -process $(file) -nologo;)

bench: benchmark.js mask.js
	node $<

docs: doc.html

doc.html: mask.js
	dox-foundation -t "mask" < $< > $@

test-data/%-binary.pbm: test-data/%.png
	pngtopnm $^ | pamditherbw | pamtopnm > $@

test-data/%-ascii.pbm: test-data/%.png
	pngtopnm $^ | pamditherbw | pamtopnm -plain > $@

clean:
	rm -f $(IMAGES)

.PHONY: test lint clean docs
