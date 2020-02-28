const tableName = process.env.CONNECTIONS_TABLE;
const url = process.env.CONNECTION_URL;
const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();

const apiGwMngmnt = new AWS.ApiGatewayManagementApi({
    apiVersion: '2018-11-29',
    endpoint: url
})

exports.handler = async (event, context) => {
    const connectionId = event.requestContext.connectionId;

    const result = await ddb.delete({
        TableName: tableName,
        Key: {
            ConnectionId: connectionId
        },
        ReturnValues: 'ALL_OLD'
    }).promise();

    if (result.Attributes && result.Attributes.IsRobotConnection && result.Attributes.RobotId) {
        const robotId = result.Attributes.RobotId;
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
            const robotDisconnectedMessage = {
                event: 'ROBOT_DISCONNECTED',
                message: `Robot ${robotId} disconnected`
            };
            await apiGwMngmnt.postToConnection({
                ConnectionId: clientConnection.ConnectionId,
                Data: JSON.stringify(robotDisconnectedMessage)
            }).promise();
        }
    }
    return { statusCode: 200 }
}