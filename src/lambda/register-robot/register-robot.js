const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.CONNECTIONS_TABLE;
const url = process.env.CONNECTION_URL;

const apiGwMngmnt = new AWS.ApiGatewayManagementApi({
    apiVersion: '2018-11-29',
    endpoint: url
})

exports.handler = async (event, context) => {
    const requestBody = JSON.parse(event.body);
    const robotId = requestBody.robotId;
    const connectionId = event.requestContext.connectionId;
    
    // Add robotId to the robot connection record
    const params = {
        TableName: tableName,
        Key: {
            ConnectionId: connectionId
        },
        UpdateExpression: "set RobotId = :r, IsRobotConnection=:b",
        ExpressionAttributeValues:{
            ":r":robotId,
            ":b":true
        },
        ReturnValues:"UPDATED_NEW"
    }
    try {
        const result = await ddb.update(params).promise();
    } catch (error) {
        console.log(error);
    }

    const queryParams = {
        TableName: tableName,
        IndexName: "robotGSI",
        KeyConditionExpression: "#r = :rid",
        ExpressionAttributeNames: {
            "#r": "RobotId"
        },
        ExpressionAttributeValues: {
            ":rid": robotId
        }
    };

    let data;
    try {
        data = await ddb.query(queryParams).promise();
    } catch (error) {
        console.log(error);
        return { statusCode: 500 };
    }
    const clientConnection = data.Items.filter((item) => item.IsRobotConnection === false)[0];
    if (clientConnection && clientConnection.ConnectionId) {
        const robotRegisteredMessage = {
            event: 'ROBOT_REGISTERED',
            message: `Robot with ${robotId} just registered`
        };
        await apiGwMngmnt.postToConnection({
            ConnectionId: clientConnection.ConnectionId,
            Data: JSON.stringify(robotRegisteredMessage)
        }).promise();
    }
    
    return { statusCode: 200};
}