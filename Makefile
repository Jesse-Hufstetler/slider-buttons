include Makefile.mk
PREFIX  ?= /usr/local
DESTDIR ?=
all: build
build: build-slider-buttons
build-slider-buttons: slider-buttons.lv2/slider-buttons$(LIB_EXT) slider-buttons.lv2/manifest.ttl
slider-buttons.lv2/slider-buttons$(LIB_EXT): slider-buttons.c
	$(CC) $^ $(BUILD_C_FLAGS) $(LINK_FLAGS) -lm $(SHARED) -o $@
slider-buttons.lv2/manifest.ttl: slider-buttons.lv2/manifest.ttl.in
	sed -e "s|@LIB_EXT@|$(LIB_EXT)|" $< > $@
clean:
	rm -f slider-buttons.lv2/slider-buttons$(LIB_EXT) slider-buttons.lv2/manifest.ttl
install: build
	install -d $(DESTDIR)$(PREFIX)/lib/lv2/slider-buttons.lv2
	install -m 644 slider-buttons.lv2/*.so  $(DESTDIR)$(PREFIX)/lib/lv2/slider-buttons.lv2/
	install -m 644 slider-buttons.lv2/*.ttl $(DESTDIR)$(PREFIX)/lib/lv2/slider-buttons.lv2/
