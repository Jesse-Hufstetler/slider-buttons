// Drives the output level meter from the plugin's "Value" control output port. MOD only reports the value a few
// times a second, so the bar and the number glide to each new value instead of jumping.
function (event) {
    var icon = event.icon;
    // Milliseconds: how quickly the display catches up with the latest value. Small on purpose, so the smoothing
    // only hides the steps between MOD's updates without trailing noticeably behind what you hear.
    var TAU = 30;

    // MOD calls this function afresh for every update; only event.data carries over between calls, so the
    // state lives there. (If this function ever throws, MOD disables the script for good.)
    var s = event.data.state || (event.data.state = { target: 0, shown: 0, last: 0, running: false });

    var fill = icon.find('.meter-fill');
    var label = icon.find('.out-value');

    function draw() {
        var v = Math.max(0, Math.min(10, s.shown));
        fill.css('width', (v / 10 * 100) + '%');
        label.text(s.shown.toFixed(2) + ' V');
    }

    function frame(now) {
        s.running = false;
        var el = icon[0];
        if (el && el.isConnected === false) { return; } // the pedal was removed: stop animating
        var dt = Math.min(now - (s.last || now), 100);
        s.last = now;
        s.shown += (s.target - s.shown) * (1 - Math.exp(-dt / TAU));
        if (Math.abs(s.target - s.shown) < 0.002) { s.shown = s.target; }
        draw();
        if (s.shown !== s.target) { request(); }
    }

    function request() {
        s.running = true;
        window.requestAnimationFrame(frame);
    }

    function start() {
        if (s.running) { return; }
        s.last = 0; // a fresh animation: the first frame only sets the clock
        request();
    }

    function set(value, animate) {
        value = Number(value);
        if (!isFinite(value)) { return; }
        s.target = value;
        if (animate) { start(); } else { s.shown = value; draw(); }
    }

    if (event.type == 'start') {
        var ports = event.ports;
        for (var p in ports) {
            if (ports[p].symbol == 'Value') {
                set(ports[p].value, false);
            }
        }
    } else if (event.type == 'change' && event.symbol == 'Value') {
        set(event.value, true);
    }
}
