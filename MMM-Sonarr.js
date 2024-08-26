Module.register("MMM-Sonarr", {
    defaults: {
        apiKey: "",
        baseUrl: "http://localhost:8989",
        upcomingLimit: 5,
        historyLimit: 5,
        updateInterval: 15 * 60 * 1000, // 15 minutes
    },

    start: function() {
        this.upcoming = [];
        this.history = [];
        this.sendSocketNotification("START_SONARR", this.config);
    },

    getStyles: function() {
        return ["MMM-Sonarr.css"];
    },

    getDom: function() {
        const wrapper = document.createElement("div");
        wrapper.className = "sonarr-wrapper";

        const upcomingSection = this.createSection("Upcoming Shows", this.upcoming);
        const historySection = this.createSection("Recently Downloaded", this.history);

        wrapper.appendChild(upcomingSection);
        wrapper.appendChild(historySection);

        return wrapper;
    },

    createSection: function(title, data) {
        const section = document.createElement("div");
        section.className = "sonarr-section";

        const header = document.createElement("h2");
        header.textContent = title;
        section.appendChild(header);

        const list = document.createElement("ul");
        data.forEach(item => {
            const listItem = document.createElement("li");
            if (title === "Upcoming Shows") {
                const date = new Date(item.start);
                listItem.textContent = `${item.title}`;
            } else {
                listItem.textContent = `${item.series.title} - ${item.episode.seasonNumber}x${item.episode.episodeNumber}`;
            }
            list.appendChild(listItem);
        });

        section.appendChild(list);
        return section;
    },

    socketNotificationReceived: function(notification, payload) {
        if (notification === "SONARR_UPCOMING") {
            this.upcoming = payload;
            this.updateDom();
        } else if (notification === "SONARR_HISTORY") {
            this.history = payload;
            this.updateDom();
        }
    },
});
