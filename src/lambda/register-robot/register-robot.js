const service = require('./service.js');
const messages = require('./messages.js');

const getPairingCode = () => {
    const randomNumberString = Math.floor(Math.random() * 999999)+"";
    return randomNumberString.padStart(6, "0");
}

exports.handler = async (event, context) => {
    const requestBody = JSON.parse(event.body);
    const robotConnectionId = event.requestContext.connectionId;
    const robotId = requestBody.robotId;
    const pairingCode = getPairingCode();
    console.log(`Sending pairing code ${pairingCode} to robot ${robotId} using connection ${robotConnectionId}`);

    // Add robotId and pairingcode to the robot connection record
    await service.updateRobotRegistration(robotConnectionId, robotId, pairingCode);

    // Inform the robot of its pairing code
    await service.postMessageToConnection(messages.pairingCodeUpdated(pairingCode), robotConnectionId);

    // Try to find the client connection to inform the client
    const getClientConnectionQuery = await service.getConnectionsByRobotId(robotId);
    const clientConnections = getClientConnectionQuery.Items.filter((item) => item.IsRobotConnection === false);

    if (clientConnections.length) {
        const clientConnectionId = clientConnections[0].ConnectionId;
        await service.postMessageToConnection(messages.robotRegistered, clientConnectionId);
    }
    
    return { statusCode: 200};
}