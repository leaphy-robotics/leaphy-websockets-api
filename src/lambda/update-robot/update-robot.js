const service = require('./service.js');
const messages = require('./messages.js');

exports.handler = async (event, context) => {
    const requestBody = JSON.parse(event.body);
    const robotConnectionId = event.requestContext.connectionId;
    const robotId = requestBody.robotId;

    const getClientConnectionQuery = await service.getConnectionsByRobotId(robotId);
    const clientConnections = getClientConnectionQuery.Items.filter((item) => item.IsRobotConnection === false);

    if (clientConnections.length) {
        const clientConnectionId = clientConnections[0].ConnectionId;
        await service.postMessageToConnection(messages.robotUpdating, clientConnectionId);
    }
    
    return { statusCode: 200};
}