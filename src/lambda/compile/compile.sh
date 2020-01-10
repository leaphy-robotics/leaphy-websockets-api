function handler () {
    set -e
    EVENT_DATA=$1
    cp ./blink.ino /tmp/blink.ino
    arduino-cli compile --fqbn esp8266:esp8266:nodemcuv2 /tmp/blink.ino
    aws s3 cp /tmp/blink.ino.esp8266.esp8266.nodemcuv2.bin s3://test-compiled/blink.bin
    echo "$EVENT_DATA" 1>&2;
    RESPONSE="Echoing request: '$EVENT_DATA'"

    echo $RESPONSE
}