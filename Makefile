IMAGES= $(patsubst test-data/%.png,\
	test-data/%-binary.pbm,\
	$(wildcard test-data/*.png))\
	$(patsubst test-data/%.png,\
	test-data/%-ascii.pbm,\
	$(wildcard test-data/*.png))

test: $(IMAGES)
	mocha

test-data/%-binary.pbm: test-data/%.png
	pngtopnm $^ | pamditherbw | pamtopnm > $@

test-data/%-ascii.pbm: test-data/%.png
	pngtopnm $^ | pamditherbw | pamtopnm -plain > $@

clean:
	rm -f $(IMAGES)
