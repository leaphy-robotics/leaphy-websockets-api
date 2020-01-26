# leaphy-websockets-api

Websockets API Gateway based backend for Leaphy Robocoder

## Packaging and deploying Cloudformation locally

`aws cloudformation package --template-file src/cfn-template.yml --s3-bucket robocoder-cfn-templates --output-template-file packaged-template.json`
`aws cloudformation deploy --template-file C:\Dev\Leaphy\Repos\leaphy-websockets-api\packaged-template.json --stack-name robocoder-websockets-api  --capabilities CAPABILITY_NAMED_IAM`

## Testing

One could use the following blink sketch:

`#include <Arduino.h>\nvoid setup() {\npinMode(LED_BUILTIN, OUTPUT);\n}\nvoid loop() {\ndigitalWrite(LED_BUILTIN, LOW);\ndelay(500);\ndigitalWrite(LED_BUILTIN, HIGH);\ndelay(500);\n}`

Same sketch pretty-printed:

```c++
#include <Arduino.h>

void setup() {
  pinMode(LED_BUILTIN, OUTPUT);
}

void loop() {
  digitalWrite(LED_BUILTIN, LOW);
  delay(500);
  digitalWrite(LED_BUILTIN, HIGH);
  delay(500);
}
```
