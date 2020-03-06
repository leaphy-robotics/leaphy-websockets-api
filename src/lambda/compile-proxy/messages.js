exports.pairingNeeded = {
    event: 'PAIRING_NEEDED',
    message: 'The client needs to be paired with the robot'
};

exports.clientPairedWithRobot = (robotId) => {
    return {
        event: 'CLIENT_PAIRED_WITH_ROBOT',
        message: robotId
    }
};

exports.robotNotRegistered = {
    event: 'ROBOT_NOT_REGISTERED',
    message: 'No robot connection was found'
};

exports.preparingCompilation = {
    event: 'PREPARING_COMPILATION_ENVIRONMENT',
    message: `Preparing compilation pipeline`
};