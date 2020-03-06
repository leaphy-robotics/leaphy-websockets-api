const service = require('./service.js');
const messages = require('./messages.js');

exports.handler = async (event, context) => {
    const requestBody = JSON.parse(event.body);
    const pairingCode = requestBody.pairingCode;
    const clientConnectionId = event.requestContext.connectionId;

    // Find the robot with the pairing code
    const getRobotConnections = await service.getConnectionsByPairingCode(pairingCode);
    const robotConnections = getRobotConnections.Items.filter((item) => item.IsRobotConnection === true);

    if(!robotConnections.length) {
        await service.postMessageToConnection(messages.robotNotRegistered, clientConnectionId);
        return { statusCode: 200 };
    }

    const robotId = robotConnections[0].RobotId;

    // Remove any other pairings that may exist for this robot
    const getOldPairings = await service.getConnectionsByRobotId(robotId);
    const oldPairedClientConnections = getOldPairings.Items.filter((item) => item.IsRobotConnection === false);

    if(oldPairedClientConnections.length) {
        oldPairedClientConnections.forEach(async connection => {
            await service.clearRobotIdFromClientConnection(connection.ConnectionId);
        });
    }

    // Add robotId to the client connection record
    await service.updateRobotIdOnClient(clientConnectionId, robotId);

    // Send CLIENT_PAIRED_WITH_ROBOT message to client with RobotId in the message
    await service.postMessageToConnection(messages.clientPairedWithRobot(robotId), clientConnectionId);
    
    return { statusCode: 200 };
}