function handler () {
    set -e 
    EVENT_DATA=$1
    CLIENTCONNECTIONID=$(echo $EVENT_DATA | jq -r '.clientConnectionId')
    ROBOTCONNECTIONID=$(echo $EVENT_DATA | jq -r '.robotConnectionId')
    SKETCH=$(echo $EVENT_DATA | jq -r '.sketch')
    ROBOTID=$(echo $EVENT_DATA | jq -r '.robotId')
    ENDPOINT=$(printenv CONNECTION_URL)

    aws apigatewaymanagementapi post-to-connection --endpoint $ENDPOINT --data "{\"event\": \"COMPILATION_STARTED\", \"message\": \"Starting compilation\"}" --connection-id "$CLIENTCONNECTIONID"
    
    TIMESTAMP=$(echo $(($(date +%s%N)/1000000))) # Number of milliseconds since epoch
    ROBOTDIR="${ROBOTID}/${TIMESTAMP}"
    TEMPDIR="/tmp/$ROBOTDIR"
    SOURCEDIR="$TEMPDIR/src"
    mkdir -p $SOURCEDIR
    cp ./lib/. $SOURCEDIR
    LOCALDESTINATION="$TEMPDIR/sketch.ino"
    CLOUDDESTINATION="s3://test-compiled/$ROBOTDIR/sketch.bin"
    OBJECTURL="http://test-compiled.s3-eu-west-1.amazonaws.com/$ROBOTDIR/sketch.bin"
    printf "%s" "$SKETCH" > "$LOCALDESTINATION" #https://stackoverflow.com/a/49418406/1056283
    
    arduino-cli compile --fqbn esp8266:esp8266:nodemcuv2 $LOCALDESTINATION --config-file /opt/bin/arduino-cli.yaml

    aws apigatewaymanagementapi post-to-connection --endpoint $ENDPOINT --data "{\"event\": \"COMPILATION_COMPLETE\", \"message\": \"Finished compilation\"}" --connection-id "$CLIENTCONNECTIONID"
    
    aws s3 cp "${LOCALDESTINATION}.esp8266.esp8266.nodemcuv2.bin" $CLOUDDESTINATION --acl public-read
    
    aws apigatewaymanagementapi post-to-connection --endpoint $ENDPOINT --data "{\"event\": \"BINARY_PUBLISHED\", \"message\": \"Sketch published\"}" --connection-id "$CLIENTCONNECTIONID"

    aws apigatewaymanagementapi post-to-connection --endpoint $ENDPOINT --data "{\"event\":\"BINARY_PUBLISHED\",\"message\":\"$OBJECTURL\"}" --connection-id "$ROBOTCONNECTIONID"
    
    echo "$EVENT_DATA" 1>&2; #Sends the response
}