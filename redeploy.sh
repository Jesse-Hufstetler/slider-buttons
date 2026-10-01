. ~/mod-plugin-builder/local.env moddwarf
rm ./slider-buttons.lv2/slider-buttons.so
make
tar cz slider-buttons.lv2 | base64 | curl -F 'package=@-' http://192.168.51.1/sdk/install
echo -e "\n\n"