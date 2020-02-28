const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.CONNECTIONS_TABLE;
const url = process.env.CONNECTION_URL;

const apiGwMngmnt = new AWS.ApiGatewayManagementApi({
    apiVersion: '2018-11-29',
    endpoint: url
})

const getPairingCode = () => {
    const randomNumberString = Math.floor(Math.random() * 999999)+"";
    return randomNumberString.padStart(6, "0");
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
    const pairingCode = getPairingCode();
    // Add robotId and pairingcode to the robot connection record
    const params = {
        TableName: tableName,
        Key: {
            ConnectionId: connectionId
        },
        UpdateExpression: "set RobotId = :r, IsRobotConnection=:b, PairingCode=:p",
        ExpressionAttributeValues:{
            ":r":robotId,
            ":b":true,
            ":p":pairingCode
        }
    }
    try {
        await ddb.update(params).promise();
    } catch (error) {
        console.log(error);
        throw error;
    }

    postMessageToConnection('PAIRINGCODE_UPDATED', pairingCode, connectionId);

    // Try to find the client connection to inform the client
    const queryParams = {
        TableName: tableName,
        IndexName: "RobotIdGSI",
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
        await postMessageToConnection('ROBOT_REGISTERED', `Robot with ${robotId} just registered`, clientConnection.ConnectionId);
    }
    
    return { statusCode: 200};
}