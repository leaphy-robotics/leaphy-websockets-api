const service = require('./service.js');
const messages = require('./messages.js');

exports.handler = async (event, context) => {
    const requestBody = JSON.parse(event.body);
    const robotId = requestBody.robotId;
    const clientConnectionId = event.requestContext.connectionId;

    // Client does a reload, still has a RobotId in its local storage, and tries to reconnect with it
    // If the connection was active less than 4 hours ago, reconnect

    // First we should check the robot connection
    const getRobotConnections = await service.getConnectionsByRobotId(robotId);
    const robotConnections = getRobotConnections.Items.filter((item) => item.IsRobotConnection === true);

    if (!robotConnections.length) {
        await service.postMessageToConnection(messages.robotNotRegistered, clientConnectionId);
        return { statusCode: 200 };
    }

    // Get the Client connection record
    const getClientConnections = await service.getConnectionsByConnectionId(clientConnectionId);
    const clientConnection = getClientConnections.Items[0];

    // If the Client Connection so indicates, we need to pair again.
    const ticksThreeHoursAgo = Date.now() - (3 * 60 * 60 * 1000);
    const timeThreshold = new Date(ticksThreeHoursAgo);
    if (!clientConnection.RobotId
        || clientConnection.RobotId != robotId
        || clientConnection.LastActiveDateTime < timeThreshold) {
        await service.postMessageToConnection(messages.pairingNeeded, clientConnectionId);
        return { statusCode: 200 };
    }

    // Reconnecting consists of updating the lastActive time
    await service.updateLastActiveTime(clientConnectionId);
    // send the CLIENT_PAIRED_WITH_ROBOT message
    await service.postMessageToConnection(messages.clientPairedWithRobot(robotId), clientConnectionId);
    
    return { statusCode: 200 };
}