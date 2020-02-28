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
    const pairingCode = requestBody.pairingCode;
    const connectionId = event.requestContext.connectionId;

    // Find the robot with the pairing code
    const findRobotParams = getRobotIdByPairingCodeParams(pairingCode);
    let robotData;
    try {
        robotData = await ddb.query(findRobotParams).promise();
    } catch (error) {
        console.log(error);
        return { statusCode: 500 };
    }
    const robotConnection = robotData.Items.filter((item) => item.IsRobotConnection === true)[0];

    if(!robotConnection) {
        // TODO inform the client of problem
        return;
    }
    // If found, add robotId to the client connection record
    const updateConnectionParams = getUpdateClientConnectionParams(connectionId, robotConnection.ConnectionId);
    try {
        await ddb.update(updateConnectionParams).promise();
    } catch (error) {
        console.log(error);
        return { statusCode: 500 };
    }

    // Send CLIENT_PAIRED_WITH_ROBOT message to client with RobotId in the message
    await postMessageToConnection("CLIENT_PAIRED_WITH_ROBOT", robotConnection.RobotId, connectionId);
    
    return { statusCode: 200 };
}