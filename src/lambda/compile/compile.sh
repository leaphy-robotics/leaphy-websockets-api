function handler () {
    set -e 
    EVENT_DATA=$1
    CLIENTCONNECTIONID=$(echo $EVENT_DATA | jq -r '.clientConnectionId')
    ROBOTCONNECTIONID=$(echo $EVENT_DATA | jq -r '.robotConnectionId')
    SKETCH=$(echo $EVENT_DATA | jq -r '.sketch')
    ROBOTID=$(echo $EVENT_DATA | jq -r '.robotId')
    
    aws apigatewaymanagementapi post-to-connection --endpoint https://1mqy98mwx7.execute-api.eu-west-1.amazonaws.com/test --data "{\"message\": \"Starting compilation\"}" --connection-id "$CLIENTCONNECTIONID"
    
    TIMESTAMP=$(echo $(($(date +%s%N)/1000000))) # Number of milliseconds since epoch
    mkdir -p "/tmp/${ROBOTID}/${TIMESTAMP}"
    LOCALDESTINATION="/tmp/${ROBOTID}/${TIMESTAMP}/sketch.ino"
    CLOUDDESTINATION="s3://test-compiled/${ROBOTID}/${TIMESTAMP}/sketch.bin"
    printf "%s" "$SKETCH" > "$LOCALDESTINATION" #https://stackoverflow.com/a/49418406/1056283
    
    arduino-cli compile --fqbn esp8266:esp8266:nodemcuv2 $LOCALDESTINATION --config-file /opt/bin/arduino-cli.yaml

    aws apigatewaymanagementapi post-to-connection --endpoint https://1mqy98mwx7.execute-api.eu-west-1.amazonaws.com/test --data "{\"message\": \"Finished compilation\"}" --connection-id "$CLIENTCONNECTIONID"
    
    aws s3 cp "${LOCALDESTINATION}.esp8266.esp8266.nodemcuv2.bin" $CLOUDDESTINATION
    
    aws apigatewaymanagementapi post-to-connection --endpoint https://1mqy98mwx7.execute-api.eu-west-1.amazonaws.com/test --data "{\"message\": \"Sketch published\"}" --connection-id "$ROBOTCONNECTIONID"
    
    echo "$EVENT_DATA" 1>&2; #Sends the response
}