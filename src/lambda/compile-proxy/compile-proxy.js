const AWS = require('aws-sdk');
const decomment = require('decomment');

const service = require('./service.js');
const messages = require('./messages.js');

const lambda = new AWS.Lambda();
const lambdaName = process.env.COMPILE_LAMBDA;

const wsServerUrl = process.env.SERVER_URL;

exports.handler = async (event, context) => {
    const clientConnectionId = event.requestContext.connectionId;
    const requestBody = JSON.parse(event.body); 
    const robotId = requestBody.robotId;
    let sketch = decomment.text(requestBody.sketch);
    sketch = `#include "src/LeaphyEspOta.h" \nLeaphyEspOta Leaphy("${wsServerUrl}");\n` + sketch;
    sketch = sketch.replace(/void\s*setup\s*\(\)[\n\r\s]*{/g, "void setup(){ Leaphy.setupOta();");
    sketch = sketch.replace(/void\s*loop\s*\(\)[\n\r\s]*{/g, "void loop(){ Leaphy.handleLoop();");

    await service.postMessageToConnection(messages.preparingCompilation, clientConnectionId);

    const getRobotConnections = await service.getConnectionsByRobotId(robotId);
    const robotConnections = getRobotConnections.Items.filter((item) => item.IsRobotConnection === true);

    if (!robotConnections.length) {
        await service.postMessageToConnection(messages.robotNotRegistered, clientConnectionId);
        return { statusCode: 200 };
    }
    const robotConnectionId = robotConnections[0].ConnectionId;

    const payload = { 
        sketch: sketch,
        robotId: robotId,
        clientConnectionId: clientConnectionId,
        robotConnectionId: robotConnectionId
    };
    const params = {
        FunctionName: lambdaName,
        InvocationType: "Event",
        Payload: JSON.stringify(payload)
    };

    try {
        await lambda.invoke(params).promise();
    } catch (error) {
        console.log(error);
        return { statusCode: 500 };
    }
    return {statusCode: 200};
};