#include <ESP8266WiFi.h>
#include <DNSServer.h>
#include <ESP8266WebServer.h>
#include <WiFiManager.h> 
#include <ArduinoWebsockets.h>
#include <ESP8266httpUpdate.h>
#include <jsonlib.h>

#include "LeaphyEspOta.h"

using namespace websockets;

// The url is injected just before compilation time
const char* ServerUrl;
//const char* ServerUrl = "wss://6lge1rqji3.execute-api.eu-west-1.amazonaws.com/test/";

WebsocketsClient wsclient;
boolean wsConnected = false;

WiFiClient wificlient;
String robotId;

LeaphyEspOta::LeaphyEspOta(char* serverUrl)
{
	ServerUrl = serverUrl;
}

void setupWifi(){
    robotId = WiFi.macAddress();
    robotId.replace(":", "");

    WiFiManager wifiManager;
    char* ssid = "Leaphy-";
    strcat(ssid, robotId.c_str());
    Serial.print("Generated ssid: ");
    Serial.println(ssid);
    // TODO: Show ssid in screen
    wifiManager.autoConnect(ssid);
}

void onMessageCallback(WebsocketsMessage message) {
    Serial.print("Got Message: ");
    String messageData = message.data();
    Serial.println(messageData);
    String event = jsonExtract(messageData, "event");
    // If pairing code, save and show it on the screen
    if(event == "PAIRINGCODE_UPDATED"){
        String pairingCode = jsonExtract(messageData, "message");
    } else if(event == "BINARY_PUBLISHED"){
        String registerMessage = "{ \"action\": \"update-robot\", \"robotId\": \"" + robotId + "\"}";
        wsclient.send(registerMessage);
        String s3Location = jsonExtract(messageData, "message");
        t_httpUpdate_return ret = ESPhttpUpdate.update(wificlient, s3Location);
		switch (ret) {
			case HTTP_UPDATE_FAILED:
			Serial.printf("HTTP_UPDATE_FAILD Error (%d): %s", ESPhttpUpdate.getLastError(), ESPhttpUpdate.getLastErrorString().c_str());
			break;
		
			case HTTP_UPDATE_NO_UPDATES:
			Serial.println("HTTP_UPDATE_NO_UPDATES");
			break;
		
			case HTTP_UPDATE_OK:
			Serial.println("HTTP_UPDATE_OK");
			break;
		}
    }
}

void onEventsCallback(WebsocketsEvent event, String data); 

void setupWS(){
    // Setup Callbacks
    wsclient.onMessage(onMessageCallback);
    wsclient.onEvent(onEventsCallback);
    
    // Connect to server
    wsclient.connect(ServerUrl);
}

void onEventsCallback(WebsocketsEvent event, String data) {
    if(event == WebsocketsEvent::ConnectionOpened) {
        wsConnected = true;
        Serial.println("Connnection Opened, registering robot");
        // Register the robot with its mac address
        String registerMessage = "{ \"action\": \"register-robot\", \"robotId\": \"" + robotId + "\"}";
        wsclient.send(registerMessage);
    } else if(event == WebsocketsEvent::ConnectionClosed) {
        Serial.println("Connnection Closed");
        wsConnected = false;
    } else if(event == WebsocketsEvent::GotPing) {
        Serial.println("Got a Ping!");
    } else if(event == WebsocketsEvent::GotPong) {
        Serial.println("Got a Pong!");
    }
}

void LeaphyEspOta::setupOta(){
    Serial.begin(115200);
    Serial.println("Starting OTA Setup");
    setupWifi();
    Serial.println("Connected to WiFi, connecting to WS API");
    setupWS();
}

void LeaphyEspOta::handleLoop(){
	// Handle the WS stuff
    if(wsConnected){
        wsclient.poll();
    } else {
        Serial.println("Reopening Connection");
        wsclient = WebsocketsClient();
        setupWS();
    }
}
