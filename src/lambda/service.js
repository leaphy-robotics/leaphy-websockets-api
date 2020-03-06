const tableName = process.env.CONNECTIONS_TABLE;
const url = process.env.CONNECTION_URL;

const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();

const apiGwMngmnt = new AWS.ApiGatewayManagementApi({
    apiVersion: '2018-11-29',
    endpoint: url
})

exports.getConnectionsByConnectionId = async (connectionId) => {
    const queryParams = {
        TableName: tableName,
        KeyConditionExpression: "#c = :cid",
        ExpressionAttributeNames: {
            "#c": "ConnectionId"
        },
        ExpressionAttributeValues: {
            ":cid": connectionId
        }
    };
    return await ddb.query(queryParams).promise();
}

exports.getConnectionsByPairingCode = async (pairingCode) => {
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
    return await ddb.query(queryParams).promise();
}

exports.getConnectionsByRobotId = async (robotId) => {
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
    return await ddb.query(queryParams).promise();
}

exports.updateLastActiveTime = async (connectionId) => {
    const updateParams = {
        TableName: tableName,
        Key: {
            ConnectionId: connectionId
        },
        UpdateExpression: "set LastUpdateTime = :t",
        ExpressionAttributeValues: {
            ":t": Date.now()
        }
    }

    return await ddb.update(updateParams).promise();
}

exports.updateRobotIdOnClient = async (clientConnectionId, robotId) => {
    const updateParams = {
        TableName: tableName,
        Key: {
            ConnectionId: clientConnectionId
        },
        UpdateExpression: "set RobotId = :r, IsRobotConnection=:b, LastUpdateTime = :t",
        ExpressionAttributeValues: {
            ":r": robotId,
            ":b": false,
            ":t": Date.now()
        }
    }

    return await ddb.update(updateParams).promise();
}

exports.clearRobotId = async (clientConnectionId) => {
    const updateParams = {
        TableName: tableName,
        Key: {
            ConnectionId: clientConnectionId
        },
        UpdateExpression: "remove RobotId, LastUpdateTime"
    }

    return await ddb.update(updateParams).promise();
}

exports.postMessageToConnection = async (message, connectionId) => {
    await apiGwMngmnt.postToConnection({
        ConnectionId: connectionId,
        Data: JSON.stringify(message)
    }).promise();
}