const service = require('./service.js');
const messages = require('./messages.js');

exports.handler = async (event, context) => {
    const requestBody = JSON.parse(event.body);
    const robotId = requestBody.robotId;
    const clientConnectionId = event.requestContext.connectionId;

    // Client does a reload, still has a RobotId in its local storage, and tries to reconnect with it

    // First we should check the robot connection
    const getRobotConnections = await service.getConnectionsByRobotId(robotId);
    const robotConnections = getRobotConnections.Items.filter(item => item.IsRobotConnection === true);

    if (!robotConnections.length) {
        await service.postMessageToConnection(messages.robotNotRegistered, clientConnectionId);
        return { statusCode: 200 };
    }

    // If another client has paired with this robot in the meantime, send the pairing needed message 
    const otherClientConnections = getRobotConnections.Items.filter(
        item => item.IsRobotConnection === false && item.ConnectionId !== clientConnectionId
    );

    if (otherClientConnections.length) {
        await service.postMessageToConnection(messages.pairingNeeded, clientConnectionId);
        return { statusCode: 200 };
    }

    await service.updateRobotIdOnClient(clientConnectionId, robotId);
    // send the CLIENT_RECONNECTED_WITH_ROBOT message
    await service.postMessageToConnection(messages.clientReconnectedWithRobot, clientConnectionId);

    return { statusCode: 200 };
}