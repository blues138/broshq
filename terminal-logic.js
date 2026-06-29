/**
 * Part 4: Account-Matching Workflow Logic Routing Engine
 */

const hqCommunicationChannel = new BroadcastChannel('bros_hq_gateway_network');
let holdTokenForDecisionCycle = null;

// DEFINE SYSTEM ADMIN POSITIONS MANUALLY HERE (Change these to match your exact usernames and passwords)
const PRE_SET_ADMINS = {
    owner: { name: "gmothersole", pass: "8981" },       // <-- Enter your friend's Owner details here
    coowner: { name: "blues138", pass: "9822812" }     // <-- Enter your details here
};

document.addEventListener("DOMContentLoaded", function() {
    refreshHistoryLedgerView();
    initializeTerminalConsole();
    
    hqCommunicationChannel.onmessage = function(event) {
        if (event.data.type === "INCOMING_ENTRY_REQUEST") {
            processGatewayAuthentication(event.data.name, event.data.pass);
        } else if (event.data.type === "REGISTRY_UPDATE_BROADCAST") {
            refreshHistoryLedgerView();
            if(event.data.lastRecord) {
                renderActiveDigitalKeycard(event.data.lastRecord);
            }
        }
    };
});

function initializeTerminalConsole() {
    const stateLabelNode = document.getElementById("systemStateText");
    stateLabelNode.innerText = "HQ GATE TERMINAL: STANDBY MODE";
    stateLabelNode.style.color = "#3b82f6";
    
    // Automatically load the pre-set Owner and Co-Owner accounts into memory on first startup
    BrosHQDatabase.commitPlayerToDatabase(PRE_SET_ADMINS.owner.name, PRE_SET_ADMINS.owner.pass, "owner");
    BrosHQDatabase.commitPlayerToDatabase(PRE_SET_ADMINS.coowner.name, PRE_SET_ADMINS.coowner.pass, "coowner");
    refreshHistoryLedgerView();
}

function handlePlayerSubmission(event) {
    event.preventDefault();
    const nameText = document.getElementById("pName").value.trim();
    const passText = document.getElementById("pPass").value;

    hqCommunicationChannel.postMessage({ type: "INCOMING_ENTRY_REQUEST", name: nameText, pass: passText });
    processGatewayAuthentication(nameText, passText);
}

// NEW: Evaluates credentials against your admin rules
function processGatewayAuthentication(nameText, passText) {
    const lowerName = nameText.toLowerCase();

    // Check if the credentials typed match your friend's pre-configured profile rules
    if (lowerName === PRE_SET_ADMINS.owner.name.toLowerCase() && passText === PRE_SET_ADMINS.owner.pass) {
        const savedToken = BrosHQDatabase.commitPlayerToDatabase(nameText, passText, "owner");
        finalizeAndBroadcastRecord(savedToken);
        return;
    }

    // Check if the credentials typed match your pre-configured profile rules
    if (lowerName === PRE_SET_ADMINS.coowner.name.toLowerCase() && passText === PRE_SET_ADMINS.coowner.pass) {
        const savedToken = BrosHQDatabase.commitPlayerToDatabase(nameText, passText, "coowner");
        finalizeAndBroadcastRecord(savedToken);
        return;
    }

    // Standard player check-in loop: Lock form and require manual manager level assignment
    holdTokenForDecisionCycle = { name: nameText, pass: passText };
    document.getElementById("targetPlayerNameText").innerText = nameText.toUpperCase();
    document.getElementById("decisionControlModule").style.display = "block";
    
    const actionBtn = document.getElementById("submitButtonAction");
    actionBtn.disabled = true;
    actionBtn.innerText = "Awaiting Owner Clearance Decision...";
}

function assignRankLevelDecision(chosenLevelString) {
    if (!holdTokenForDecisionCycle) return;

    const newlyCreatedMemberToken = BrosHQDatabase.commitPlayerToDatabase(
        holdTokenForDecisionCycle.name, 
        holdTokenForDecisionCycle.pass, 
        chosenLevelString
    );
    
    holdTokenForDecisionCycle = null;
    document.getElementById("decisionControlModule").style.display = "none";
    
    const actionBtn = document.getElementById("submitButtonAction");
    actionBtn.disabled = false;
    
    finalizeAndBroadcastRecord(newlyCreatedMemberToken);
}

function finalizeAndBroadcastRecord(recordToken) {
    renderActiveDigitalKeycard(recordToken);
    clearInputFormFields();
    hqCommunicationChannel.postMessage({ type: "REGISTRY_UPDATE_BROADCAST", lastRecord: recordToken });
}

function renderActiveDigitalKeycard(profilePayload) {
    const cardElement = document.getElementById("activeKeycardNode");
    cardElement.className = "digital-keycard card-" + profilePayload.level;

    document.getElementById("cardNameField").innerText = profilePayload.playerName.toUpperCase();
    document.getElementById("cardLevelField").innerText = profilePayload.level.toUpperCase();
    
    const passFieldNode = document.getElementById("cardPassField");
    passFieldNode.innerText = profilePayload.password;
    passFieldNode.classList.remove("reveal");
}

function refreshHistoryLedgerView() {
    const logBoxContainer = document.getElementById("ledgerLogsContainer");
    const activeList = BrosHQDatabase.fetchActiveRegistry();
    if (activeList.length === 0) return;

    logBoxContainer.innerHTML = "";
    activeList.forEach(member => {
        let leftBorderIndicatorColor = "#cbd5e1";
        if (member.level === "owner") leftBorderIndicatorColor = "#2563eb";
        if (member.level === "coowner") leftBorderIndicatorColor = "#4ade80";
        if (member.level === "normal") leftBorderIndicatorColor = "#16a34a";
        if (member.level === "coadmin") leftBorderIndicatorColor = "#3b82f6";
        if (member.level === "admin") leftBorderIndicatorColor = "#dc2626";

        const rowElement = document.createElement("div");
        rowElement.className = "ledger-row-entry";
        rowElement.style.borderLeftColor = leftBorderIndicatorColor;
        rowElement.innerHTML = `
            <span><strong>${member.playerName}</strong> (${member.level.toUpperCase()})</span>
            <span>
                <span class="log-pass-span">🔑 ${member.password}</span>
                <span style="color: #4b5563; font-size: 11px; font-family: monospace; margin-left:10px;">${member.uid} | ${member.timestamp}</span>
            </span>
        `;
        logBoxContainer.appendChild(rowElement);
    });
}

function toggleMasterPasswordVisibility(buttonElement) {
    const viewNode = document.getElementById("ledgerLogsContainer");
    const isShowing = viewNode.classList.toggle("show-passwords");
    buttonElement.innerText = isShowing ? "Hide Saved Passwords" : "Show Saved Passwords";
}

function clearInputFormFields() {
    document.getElementById("entryForm").reset();
    refreshHistoryLedgerView();
    
    const stateLabelNode = document.getElementById("systemStateText");
    stateLabelNode.innerText = "HQ GATE TERMINAL: STANDBY MODE";
    stateLabelNode.style.color = "#3b82f6";
}
