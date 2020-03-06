const AWS = require('aws-sdk');
const decomment = require('decomment');

const service = require('./service.js');
const messages = require('./messages.js');

const lambda = new AWS.Lambda();
const lambdaName = process.env.COMPILE_LAMBDA;

exports.handler = async (event, context) => {
    const clientConnectionId = event.requestContext.connectionId;
    const requestBody = JSON.parse(event.body); 
    const robotId = requestBody.robotId;
    const sketch = decomment.text(requestBody.sketch);

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