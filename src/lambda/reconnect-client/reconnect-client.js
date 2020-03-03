const tableName = process.env.CONNECTIONS_TABLE;
const url = process.env.CONNECTION_URL;
const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();

const apiGwMngmnt = new AWS.ApiGatewayManagementApi({
    apiVersion: '2018-11-29',
    endpoint: url
})

const getRobotIdByPairingCodeParams = (pairingCode) => {
    const queryParams = {
        TableName: tableName,
        IndexName: "PairingCodeGSI",
        KeyConditionExpression: "#p = :pid",
        ExpressionAttributeNames: {
            "#p": "PairingCode"
        },
        ExpressionAttributeValues: {
            ":pid": pairingCode
        }
    };
    return queryParams;
}

const getUpdateClientConnectionParams = (connectionId, robotId) => {
    const updateParams = {
        TableName: tableName,
        Key: {
            ConnectionId: connectionId
        },
        UpdateExpression: "set RobotId = :r, IsRobotConnection=:b",
        ExpressionAttributeValues: {
            ":r": robotId,
            ":b": false
        }
    }
    return updateParams;
}

const postMessageToConnection = async (event, message, connectionId) => {
    const payload = {
        event: event,
        message: message
    };
    await apiGwMngmnt.postToConnection({
        ConnectionId: connectionId,
        Data: JSON.stringify(payload)
    }).promise();
}

exports.handler = async (event, context) => {
    const requestBody = JSON.parse(event.body);
    const robotId = requestBody.robotId;
    const connectionId = event.requestContext.connectionId;
    
    // Client does a reload, still has a RobotId in its local storage, and tries to reconnect with it
    // If the connection was active less than 4 hours ago, reconnect

    // Get the Client connection record

    // If the record does not contain the same robotId, we need to re-pair

    // If the lastActive timestamp is more than 4 hours old, we need to re-pair

    // If not, we should check the robot connection

    // If the robot connection is there
    
        // send the CLIENT_PAIRED_WITH_ROBOT message
        // Update the lastActive time

    // Else

        // Inform the client of the robot not being there


    return { statusCode: 200 };
}