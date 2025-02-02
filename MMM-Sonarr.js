Module.register("MMM-Sonarr", {
    defaults: {
        apiKey: "",
        baseUrl: "http://localhost:8989",
        upcomingLimit: 5,
        historyLimit: 5,
        updateInterval: 1 * 60 * 1000, // 1 minute
        language: "en",
    },

    start: function() {
        console.log("Starting MMM-Sonarr module");
        
        // Initialize state
        this.loaded = false;
        this.upcoming = [];
        this.history = [];
        this.translations = {
            upcoming: "Upcoming Episodes",
            recent: "Recent Episodes"
        };

        // Start Sonarr data fetch immediately
        console.log("MMM-Sonarr: Sending START_SONARR notification");
        this.sendSocketNotification("START_SONARR", this.config);
    },

    getStyles: function() {
        return ["MMM-Sonarr.css"];
    },

    getDom: function() {
        const wrapper = document.createElement("div");
        wrapper.className = "sonarr-wrapper";

        if (!this.loaded) {
            const loading = document.createElement("div");
            loading.textContent = "Loading...";
            wrapper.appendChild(loading);
            return wrapper;
        }

        if (this.config.upcomingLimit > 0) {
            const upcomingSection = this.createSection("upcoming", this.upcoming, this.config.upcomingLimit);
            wrapper.appendChild(upcomingSection);
        }

        if (this.config.historyLimit > 0) {
            const historySection = this.createSection("recent", this.history, this.config.historyLimit);
            wrapper.appendChild(historySection);
        }

        return wrapper;
    },

    createSection: function(section_type, data, limit) {
        const section = document.createElement("div");
        section.className = "sonarr-section";

        const header = document.createElement("h2");
        header.textContent = this.translations[section_type];
        section.appendChild(header);

        const list = document.createElement("ul");
        
        if (!Array.isArray(data)) {
            console.warn(`MMM-Sonarr: Data for ${section_type} is not an array:`, data);
            return section;
        }
        
        const uniqueEntries = new Set();
        
        data.forEach(item => {
            try {
                let entryText;
                if (section_type === "upcoming") {
                    entryText = `${item.series.title} - ${item.seasonNumber}x${item.episodeNumber}`;
                } else {
                    entryText = `${item.series.title} - ${item.episode.seasonNumber}x${item.episode.episodeNumber}`;
                }
                
                if (!uniqueEntries.has(entryText) && uniqueEntries.size < limit) {
                    uniqueEntries.add(entryText);
                    const listItem = document.createElement("li");
                    listItem.textContent = entryText;
                    list.appendChild(listItem);
                }
            } catch (error) {
                console.error("MMM-Sonarr: Error creating list item:", error);
            }
        });

        section.appendChild(list);
        return section;
    },

    socketNotificationReceived: function(notification, payload) {
        console.log(`MMM-Sonarr: Received socket notification: ${notification}`);
        
        if (notification === "SONARR_UPCOMING") {
            console.log("MMM-Sonarr: Received upcoming data");
            this.upcoming = payload;
            this.loaded = true;
            this.updateDom();
        } else if (notification === "SONARR_HISTORY") {
            console.log("MMM-Sonarr: Received history data");
            this.history = payload;
            this.loaded = true;
            this.updateDom();
        }
    },
});

