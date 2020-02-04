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

    // Add robotId to the client connection record
    const params = {
        TableName: tableName,
        Key: {
            ConnectionId: connectionId
        },
        UpdateExpression: "set RobotId = :r, IsRobotConnection=:b",
        ExpressionAttributeValues: {
            ":r": robotId,
            ":b": false
        },
        ReturnValues: "UPDATED_NEW"
    }
    try {
        await ddb.update(params).promise();
    } catch (error) {
        console.log(error);
        return { statusCode: 500 };
    }

    // Verify that robot is registered
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
    const robotConnection = data.Items.filter((item) => item.IsRobotConnection === true)[0];
    if (robotConnection) {
        const message = {
            event: 'CLIENT_PAIRED_WITH_ROBOT',
            message: `Succesfully paired client to robot ${robotId}`
        };
        await apiGwMngmnt.postToConnection({
            ConnectionId: connectionId,
            Data: JSON.stringify(message)
        }).promise();

    } else {
        const failedMessage = {
            event: 'FAILED_PAIRING_WITH_ROBOT',
            message: `Robot with ${robotId} was not registered`
        };
        await apiGwMngmnt.postToConnection({
            ConnectionId: connectionId,
            Data: JSON.stringify(failedMessage)
        }).promise();
    }


    return { statusCode: 200 };
}