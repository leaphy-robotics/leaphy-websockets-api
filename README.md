# leaphy-websockets-api

Websockets API Gateway based backend for Leaphy Robocoder

## Packaging and deploying Cloudformation locally

`aws cloudformation package --template-file src/cfn-template.yml --s3-bucket robocoder-cfn-templates --output-template-file packaged-template.json`
`aws cloudformation deploy --template-file C:\Dev\Leaphy\Repos\leaphy-websockets-api\packaged-template.json --stack-name robocoder-websockets-api  --capabilities CAPABILITY_NAMED_IAM`