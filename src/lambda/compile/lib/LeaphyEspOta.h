/*
	Library containing functionality for updating Leaphy robot Over-The-Air
*/
#ifndef LeaphyEspOta_h
#define LeaphyEspOta_h

#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>

class LeaphyEspOta {
	public:
		void setupOta();
		void handleLoop();
};

#endif