/**
 * Part 3: Permanent Admin Registry Memory Module
 */

const BrosHQDatabase = {
    cacheKeyName: "BrosLiveRegistry_V10_Final",

    // Pulls all registered members from the browser memory cache
    fetchActiveRegistry: function() {
        const structuralRawJSON = localStorage.getItem(this.cacheKeyName);
        if (!structuralRawJSON) return [];
        try { return JSON.parse(structuralRawJSON); } 
        catch(err) { return []; }
    },

    // Commits a newly approved player account record token into the local file lines
    commitPlayerToDatabase: function(nameValue, passValue, rankString) {
        const operatingRegistryList = this.fetchActiveRegistry();
        const timeString = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

        // Check if an account with this exact username already exists to prevent duplication
        const duplicateIndex = operatingRegistryList.findIndex(p => p.playerName.toLowerCase() === nameValue.toLowerCase());
        
        const formattedPayload = {
            uid: "BROS-" + Math.floor(1000 + Math.random() * 9000),
            playerName: nameValue,
            password: passValue,
            level: rankString,
            timestamp: timeString
        };

        if (duplicateIndex !== -1) {
            // Overwrite existing placeholder setup account details with fresh profile maps
            operatingRegistryList[duplicateIndex] = formattedPayload;
        } else {
            operatingRegistryList.push(formattedPayload);
        }

        localStorage.setItem(this.cacheKeyName, JSON.stringify(operatingRegistryList));
        return formattedPayload;
    }
};
