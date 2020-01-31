const https = require('https');

export class PostToConnectionService {

    sendMessage(connectionId, messageObject) {
        const postData = JSON.stringify(messageObject);
        const options = {
            hostname: 'https://1mqy98mwx7.execute-api.eu-west-1.amazonaws.com',
            port: 443,
            path: `/test/@connections/${connectionId}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': postData.length
            }
        };
        var req = https.request(options, (res) => {
            console.log('statusCode:', res.statusCode);
            console.log('headers:', res.headers);

            res.on('data', (d) => {
                process.stdout.write(d);
            });
        });
        req.on('error', (e) => {
            console.error(e);
        });
    
        req.write(postData);
        req.end();       
    }
}
module.exports = PostToConnectionService;