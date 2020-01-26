const AWS = require('aws-sdk');
const lambda = new AWS.Lambda();
const ddb = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.CONNECTIONS_TABLE;
const lambdaName = process.env.COMPILE_LAMBDA;

exports.handler = async (event, context) => {
    const requestBody = JSON.parse(event.body); 
    const robotId = requestBody.robotId;
    const sketch = requestBody.sketch;

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