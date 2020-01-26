const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.CONNECTIONS_TABLE;

exports.handler = async (event, context) => {
    const requestBody = JSON.parse(event.body);
    const robotId = requestBody.robotId;
    const connectionId = event.requestContext.connectionId;
    
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
    } catch (error) {
        console.log(error);
    }
    
    return { statusCode: 200};
}