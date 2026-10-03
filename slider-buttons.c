#include <math.h>
#include <stdlib.h>
#include "lv2/lv2plug.in/ns/lv2core/lv2.h"
#define PLUGIN_URI "https://jesse-hufstetler.github.io/plugins/slider-buttons"

typedef enum {
	DOWN_BUTTON,
	UP_BUTTON,
	CV_OUTPUT,
	SPEED,
	VALUE_OUT
} PortIndex;
typedef struct {
    float* down_button;
    float* up_button;
    float* cv_output;
    float* speed;
    float* value_out;
	double srate;
	float current_value;
} StateData;
static LV2_Handle instantiate(const LV2_Descriptor* descriptor, double rate, const char* bundle_path, const LV2_Feature* const* features) {
	StateData* stateData = (StateData*)malloc(sizeof(StateData));
    stateData->srate = rate;
    stateData->current_value = 0;
    stateData->value_out = NULL;
	return (LV2_Handle)stateData;
}
static void connect_port(LV2_Handle instance, uint32_t port, void* data) {
	StateData* stateData = (StateData*)instance;
	switch ((PortIndex)port) {
	case DOWN_BUTTON: stateData->down_button = (float*)data; break;
	case UP_BUTTON: stateData->up_button = (float*)data; break;
	case CV_OUTPUT: stateData->cv_output = (float*)data; break;
	case SPEED: stateData->speed = (float*)data; break;
	case VALUE_OUT: stateData->value_out = (float*)data; break;
	}
}
static void activate(LV2_Handle instance) { }


static void run(LV2_Handle instance, uint32_t n_samples) {
	StateData* stateData = (StateData*)instance;
	const float srate = stateData->srate;
	const float down_button = *(stateData->down_button);
	const float up_button = *(stateData->up_button);
	const float speed = *(stateData->speed);
	float* const cv_output = stateData->cv_output;
	for (uint32_t pos = 0; pos < n_samples; pos++) {
		if (down_button > 0.5) stateData->current_value -= speed/srate;
		if (up_button > 0.5) stateData->current_value += speed/srate;
		if (stateData->current_value < 0) stateData->current_value = 0;
		if (stateData->current_value > 10) stateData->current_value = 10;
		cv_output[pos] = stateData->current_value;
	}
	// Report the level on a control port so the GUI can show it (a GUI cannot read a CV port).
	if (stateData->value_out) *(stateData->value_out) = stateData->current_value;
}
static void deactivate(LV2_Handle instance){}
static void cleanup(LV2_Handle instance) {
	free(instance);
}
static const void* extension_data(const char* uri) {
	return NULL;
}
static const LV2_Descriptor descriptor = {
	PLUGIN_URI,
	instantiate,
	connect_port,
	activate,
	run,
	deactivate,
	cleanup,
	extension_data
};
LV2_SYMBOL_EXPORT
const LV2_Descriptor* lv2_descriptor(uint32_t index)
{
	switch (index) {
		case 0:  return &descriptor;
		default: return NULL;
	}
}
