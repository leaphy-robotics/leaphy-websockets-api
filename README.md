# leaphy-websockets-api

Websockets API Gateway based backend for Leaphy Robocoder

## Packaging and deploying Cloudformation locally

`aws cloudformation package --profile ll-liquidlogic --template-file src/cfn-template.yml --s3-bucket robocoder-cfn-templates --output-template-file packaged-template.json`
`aws cloudformation deploy  --profile ll-liquidlogic --template-file C:\Dev\Leaphy\Repos\leaphy-websockets-api\packaged-template.json --stack-name robocoder-websockets-api  --capabilities CAPABILITY_NAMED_IAM --region eu-west-1`

## Testing Compile Lambda

It expects the following payload:

```json
{
  "sketch": string,
  "robotId": string,
  "clientConnectionId": string,
  "robotConnectionId": string
}
```

One could use the following blink sketch:

`#include <Arduino.h>\n#include \"src/LeaphyEspOta.h\"\n\nLeaphyEspOta Leaphy;\n\nint ledState = LOW;\nconst long blinkWaitInterval = 500;\n\nvoid setup() {\n  Leaphy.setupOta();\n  pinMode(LED_BUILTIN, OUTPUT);\n}\n\nvoid loop() {\n  Leaphy.handleLoop();\n  digitalWrite(LED_BUILTIN, LOW);\n  delay(blinkWaitInterval);\n  digitalWrite(LED_BUILTIN, HIGH);\n  delay(blinkWaitInterval);\n}\n`

Same sketch pretty-printed:

```c++
#include <Arduino.h>
#include "src/LeaphyEspOta.h"

LeaphyEspOta Leaphy;

int ledState = LOW;
const long blinkWaitInterval = 500;

void setup() {
  Leaphy.setupOta();
  pinMode(LED_BUILTIN, OUTPUT);
}


void loop() {
  Leaphy.handleLoop();

  digitalWrite(LED_BUILTIN, LOW);
  delay(blinkWaitInterval);
  digitalWrite(LED_BUILTIN, HIGH);
  delay(blinkWaitInterval);
}
```

## Useful commands for developing

Making a Windows symlink to reuse lambda service and messages code:

`mklink /H src\lambda\pair-client\service.js src\lambda\service.js`
`mklink /H src\lambda\pair-client\messages.js src\lambda\messages.js`
