const AWS = require('aws-sdk');
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
    const sketch = requestBody.sketch;

    console.log(sketch);

    const message = {
        event: 'COMPILE_REQUEST_RECEIVED',
        message: `Succesfully received compile request`
    };
    await apiGwMngmnt.postToConnection({
        ConnectionId: connectionId,
        Data: JSON.stringify(message)
    }).promise();

    return {statusCode: 200};

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
    
    const robotClientId = data.Items.filter((item) => item.IsRobotConnection === true)[0].ConnectionId;

    const payload = { 
        sketch: sketch,
        robotId: robotId,
        clientConnectionId: event.requestContext.connectionId,
        robotConnectionId: robotClientId
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
    console.log(result);
    return {statusCode: 200};
};