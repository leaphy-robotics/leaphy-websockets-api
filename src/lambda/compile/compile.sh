function handler () {
    set -e 
    EVENT_DATA=$1
    CLIENTCONNECTIONID=$(echo $EVENT_DATA | jq -r '.clientConnectionId')
    ROBOTCONNECTIONID=$(echo $EVENT_DATA | jq -r '.robotConnectionId')
    SKETCH=$(echo $EVENT_DATA | jq -r '.sketch')
    ROBOTID=$(echo $EVENT_DATA | jq -r '.robotId')
    ENDPOINT=$(printenv CONNECTION_URL)
    echo "Sending Compilation started message to client"
    aws apigatewaymanagementapi post-to-connection --endpoint $ENDPOINT --data "{\"event\": \"COMPILATION_STARTED\", \"message\": \"Compiling\"}" --connection-id "$CLIENTCONNECTIONID"
    
    rm -rdf "/tmp/${ROBOTID}"
    mkdir -p "/tmp/${ROBOTID}/src"
    cp lib/* /tmp/${ROBOTID}/src/
    LOCALDESTINATION="/tmp/${ROBOTID}/sketch.ino"
    TIMESTAMP=$(echo $(($(date +%s%N)/1000000))) # Number of milliseconds since epoch
    CLOUDDESTINATION="s3://test-compiled/${ROBOTID}/${TIMESTAMP}/sketch.bin"
    OBJECTURL="http://test-compiled.s3-eu-west-1.amazonaws.com/${ROBOTID}/${TIMESTAMP}/sketch.bin"
    printf "%s" "$SKETCH" > "$LOCALDESTINATION" #https://stackoverflow.com/a/49418406/1056283
    
    echo "Calling arduino compile"
    arduino-cli compile --fqbn esp8266:esp8266:nodemcuv2 $LOCALDESTINATION --config-file /opt/bin/arduino-cli.yaml

    echo "Sending compilation complete message to client"
    aws apigatewaymanagementapi post-to-connection --endpoint $ENDPOINT --data "{\"event\": \"COMPILATION_COMPLETE\", \"message\": \"Finished compilation\"}" --connection-id "$CLIENTCONNECTIONID"
    
    echo "Copying bin to s3"
    aws s3 cp "${LOCALDESTINATION}.esp8266.esp8266.nodemcuv2.bin" $CLOUDDESTINATION --acl public-read

    echo "Sending binary published message to client"
    aws apigatewaymanagementapi post-to-connection --endpoint $ENDPOINT --data "{\"event\": \"BINARY_PUBLISHED\", \"message\": \"Sketch published\"}" --connection-id "$CLIENTCONNECTIONID"
    echo "Sending binary published message to robot"
    aws apigatewaymanagementapi post-to-connection --endpoint $ENDPOINT --data "{\"event\":\"BINARY_PUBLISHED\",\"message\":\"$OBJECTURL\"}" --connection-id "$ROBOTCONNECTIONID"
    
    echo "$EVENT_DATA" 1>&2; #Sends the response
}