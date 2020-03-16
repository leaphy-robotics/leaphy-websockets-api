const service = require('./service.js');
const messages = require('./messages.js');

exports.handler = async (event, context) => {
    const connectionId = event.requestContext.connectionId;
    const deleteConnectionResponse = await service.deleteConnection(connectionId);

    if (!deleteConnectionResponse.Attributes
        || !deleteConnectionResponse.Attributes.IsRobotConnection) {
        // This is a client connection, you're done
        return { statusCode: 200 }
    }

    const robotId = deleteConnectionResponse.Attributes.RobotId;
    const getPairedClientConnectionQuery = await service.getConnectionsByRobotId(robotId);
    const clientConnections = getPairedClientConnectionQuery.Items.filter((item) => item.IsRobotConnection === false);

    if(!clientConnections.length) {
        // No paired clients found, you're done
        return { statusCode: 200 }
    }

    const clientConnectionId = clientConnections[0].ConnectionId;
    await service.postMessageToConnection(messages.robotNotRegistered, clientConnectionId);
    return { statusCode: 200 }
}