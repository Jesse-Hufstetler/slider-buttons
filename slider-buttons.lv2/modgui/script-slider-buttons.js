// Drives the output level meter from the plugin's "Value" control output port.
function (event) {
    var fill = event.icon.find('.meter-fill');

    function show(value) {
        var v = Math.max(0, Math.min(10, value));
        fill.css('width', (v / 10 * 100) + '%');
    }

    if (event.type == 'start') {
        var ports = event.ports;
        for (var p in ports) {
            if (ports[p].symbol == 'Value') {
                show(ports[p].value);
            }
        }
    } else if (event.type == 'change' && event.symbol == 'Value') {
        show(event.value);
    }
}
