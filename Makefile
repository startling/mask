IMAGES= $(patsubst test-data/%.bmp,\
	test-data/%-binary.pbm,\
	$(wildcard test-data/*.bmp))\
	$(patsubst test-data/%.bmp,\
	test-data/%-ascii.pbm,\
	$(wildcard test-data/*.bmp))

test: $(IMAGES)
	mocha -R spec

test-data/%-binary.pbm: test-data/%.bmp
	bmptoppm $^ | pamditherbw | pamtopnm > $@

test-data/%-ascii.pbm: test-data/%.bmp
	bmptoppm $^ | pamditherbw | pamtopnm -plain > $@

clean:
	rm -f test-data/*.pbm
