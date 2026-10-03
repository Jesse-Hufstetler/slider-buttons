// Runs the pedal script the way MOD does, so GUI logic can be checked without a device.
//
// What MOD actually does (see triggerJS in mod-ui's modgui.js):
//   - it calls the script's function afresh for EVERY update, with a new `event` each time;
//   - the only thing carried from one call to the next is `event.data`, one object kept for the life of the pedal;
//   - if the function ever throws, MOD disables the script for good.
// Animation frames are driven by hand here so the smoothing can be checked exactly.
//
// Usage: node tests/modgui-script-test.js
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '..', 'slider-buttons.lv2', 'modgui', 'script-slider-buttons.js'), 'utf8').trim();
const fn = eval('(' + src + ')');

// Animation frames, advanced by hand.
let frames = [];
let now = 1000;
global.window = { requestAnimationFrame(f) { frames.push(f); return frames.length; } };
function advance(ms) {
  for (let t = 0; t < ms; t += 16) {
    now += 16;
    const batch = frames; frames = [];
    batch.forEach(f => f(now));
  }
}

// A stand-in for MOD's icon: remembers the last thing the script wrote to each element.
const written = {};
const icon = {
  0: { isConnected: true },
  find(selector) {
    return {
      css(key, value) { written[selector + ' ' + key] = value; return this; },
      text(value) { written[selector + ' text'] = value; return this; },
    };
  },
};
const data = {};
let broken = null;
function send(event) {
  if (broken) return;
  event.icon = icon; event.data = data; event.api_version = 3;
  try { fn(event); } catch (err) { broken = err; }
}
const width = () => parseFloat(written['.meter-fill width']);

let failures = 0;
function check(name, ok) { console.log((ok ? 'PASS' : 'FAIL') + '  ' + name); if (!ok) failures++; }

send({ type: 'start', ports: [{ symbol: 'Value', value: 2 }] });
check('start shows the value at once, with no animation', width() === 20 && written['.out-value text'] === '2.00 V' && frames.length === 0);

send({ type: 'change', symbol: 'Value', value: 8 });
check('a new value does not jump: the bar has not moved yet', width() === 20);
check('a new value starts exactly one animation loop', frames.length === 1);
send({ type: 'change', symbol: 'Value', value: 8.5 });
send({ type: 'change', symbol: 'Value', value: 9 });
check('more updates do not start extra loops', frames.length === 1);

advance(64);
const early = width();
check('the bar glides: partway between old and new after a few frames', early > 20 && early < 90);
advance(64);
check('the bar keeps moving toward the target', width() > early && width() < 90);
const text = parseFloat(written['.out-value text']);
check('the number glides along with the bar', text > 2 && text < 9);

advance(2000);
check('the bar settles exactly on the final value', width() === 90 && written['.out-value text'] === '9.00 V');
check('the loop stops once it has settled', frames.length === 0);

send({ type: 'change', symbol: 'Value', value: 1 });
advance(64);
check('it glides back down too', width() < 90 && width() > 10);
advance(2000);
check('and settles at the lower value', width() === 10);

send({ type: 'change', symbol: 'Value', value: 14 });
advance(2000);
check('a value above 10 V fills the bar but no further', width() === 100);
send({ type: 'change', symbol: 'Value', value: -3 });
advance(2000);
check('a value below 0 V empties the bar', width() === 0);

send({ type: 'change', symbol: 'Value', value: 5 });
icon[0].isConnected = false;
advance(200);
check('animation stops when the pedal is removed from the page', frames.length === 0);
icon[0].isConnected = true;

send({ type: 'change', symbol: 'Value', value: 'oops' });
send({ type: 'change', symbol: 'Value', value: NaN });
send({ type: 'change', symbol: 'SomethingElse', value: 1 });
check('bad or unknown updates never throw (MOD would disable the script)', broken === null);

console.log(failures ? 'FAILED (' + failures + ')' : 'ALL PASSED');
process.exit(failures ? 1 : 0);
