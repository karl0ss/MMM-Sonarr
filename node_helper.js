const NodeHelper = require("node_helper");
const https = require("https");
const http = require("http");
const url = require("url");

module.exports = NodeHelper.create({
    start: function() {
        console.log("Starting node helper for: " + this.name);
    },

    socketNotificationReceived: function(notification, payload) {
        if (notification === "START_SONARR") {
            this.config = payload;
            this.getUpcoming();
            this.getHistory();
            this.scheduleUpdate();
        }
    },

    scheduleUpdate: function() {
        setInterval(() => {
            this.getUpcoming();
            this.getHistory();
        }, this.config.updateInterval);
    },

    getUpcoming: function() {
        const apiUrl = `${this.config.baseUrl}/api/v3/calendar`;
        const currentDate = new Date();
        const futureDate = new Date(currentDate.getTime() + 24 * 24 * 60 * 60 * 1000); // 24 days from now
    
        const params = new URLSearchParams({
            start: currentDate.toISOString(),
            end: futureDate.toISOString(),
            includeSeries: "true",
            includeEpisodeFile: "false"
        });
    
        this.sendRequest(apiUrl, params, (response) => {
            if (!Array.isArray(response)) {
                console.error("Unexpected response format from Sonarr API");
                return;
            }
    
            this.sendSocketNotification("SONARR_UPCOMING", response);
        });
    },

    getHistory: function() {
        const apiUrl = `${this.config.baseUrl}/api/v3/history`;
        const params = new URLSearchParams({
            page: 1,
            pageSize: 50, // Fetch more items and limit in MMM-Sonarr.js
            sortKey: "date",
            sortDirection: "descending",
            includeSeries: true,
            includeEpisode: true,
            eventType: 1,
        });

        this.sendRequest(apiUrl, params, (response) => {
            this.sendSocketNotification("SONARR_HISTORY", response.records);
        });
    },

    sendRequest: function(apiUrl, params, callback) {
        const fullUrl = `${apiUrl}?${params.toString()}`;
        const parsedUrl = url.parse(fullUrl);
        
        const options = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port,
            path: parsedUrl.path,
            method: 'GET',
            headers: {
                "X-Api-Key": this.config.apiKey,
            },
        };

        const protocol = parsedUrl.protocol === 'https:' ? https : http;

        const req = protocol.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    callback(jsonData);
                } catch (error) {
                    console.error("Error parsing JSON:", error);
                }
            });
        });

        req.on('error', (error) => {
            console.error("Error fetching Sonarr data:", error);
        });

        req.end();
    },

});
