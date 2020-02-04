const AWS = require('aws-sdk');
const decomment = require('decomment');

const lambda = new AWS.Lambda();
const ddb = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.CONNECTIONS_TABLE;
const lambdaName = process.env.COMPILE_LAMBDA;
const url = process.env.CONNECTION_URL;
const apiGwMngmnt = new AWS.ApiGatewayManagementApi({
    apiVersion: '2018-11-29',
    endpoint: url
})

exports.handler = async (event, context) => {
    const connectionId = event.requestContext.connectionId;
    const requestBody = JSON.parse(event.body); 
    const robotId = requestBody.robotId;
    const sketch = decomment.text(requestBody.sketch);

    const prepareMessage = {
        event: 'PREPARING_COMPILATION_ENVIRONMENT',
        message: `Preparing compilation pipeline`
    };
    await apiGwMngmnt.postToConnection({
        ConnectionId: connectionId,
        Data: JSON.stringify(prepareMessage)
    }).promise();

    // Find the robot connectionId using the RobotId
    const queryParams = {
        TableName: tableName,
        IndexName: "robotGSI",
        KeyConditionExpression: "#r = :rid",
        ExpressionAttributeNames:{
            "#r": "RobotId"
        },
        ExpressionAttributeValues: {
            ":rid": requestBody.robotId
        }
    };

    let data;
    try {
        data = await ddb.query(queryParams).promise();
    } catch (error) {
        console.log(error);
        return { statusCode: 500 };
    }
    
    const robotConnection = data.Items.filter((item) => item.IsRobotConnection === true)[0];

    if(!robotConnection) {
        const noRobotMessage = {
            event: 'ROBOT_NOT_CONNECTED',
            message: `Robot ${robotId} not connected`
        };
        await apiGwMngmnt.postToConnection({
            ConnectionId: connectionId,
            Data: JSON.stringify(noRobotMessage)
        }).promise();
        return {statusCode: 200};
    }

    const payload = { 
        sketch: sketch,
        robotId: robotId,
        clientConnectionId: event.requestContext.connectionId,
        robotConnectionId: robotConnection.ConnectionId
    };
    const params = {
        FunctionName: lambdaName,
        InvocationType: "Event",
        Payload: JSON.stringify(payload)
    };

    let result;
    try {
        result = await lambda.invoke(params).promise();
    } catch (error) {
        console.log(error);
        return { statusCode: 500 };
    }
    return {statusCode: 200};
};