const tableName = process.env.CONNECTIONS_TABLE;
const url = process.env.CONNECTION_URL;
const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();

const apiGwMngmnt = new AWS.ApiGatewayManagementApi({
    apiVersion: '2018-11-29',
    endpoint: url
})

exports.handler = async (event, context) => {
    const requestBody = JSON.parse(event.body);
    const robotId = requestBody.robotId;
    const connectionId = event.requestContext.connectionId;
    
    // TODO: Handle situation where robot is not registered (in the same wifi SSID?)

    // Add robotId to the client connection record
    const params = {
        TableName: tableName,
        Key: {
            ConnectionId: connectionId
        },
        UpdateExpression: "set RobotId = :r, IsRobotConnection=:b",
        ExpressionAttributeValues:{
            ":r":robotId,
            ":b":false
        },
        ReturnValues:"UPDATED_NEW"
    }
    try {
        const result = await ddb.update(params).promise();
        const message = {
            event: 'CLIENT_PAIRED_WITH_ROBOT',
            message: `Succesfully paired client to robot ${robotId}`
        };
        await apiGwMngmnt.postToConnection({
            ConnectionId: connectionId,
            Data: JSON.stringify(message)
        }).promise();
    } catch (error) {
        console.log(error);
    }
    
    return { statusCode: 200};
}