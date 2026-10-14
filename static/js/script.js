// ============================================================
// DEADLOCK PREVENTION & STRATEGY SIMULATOR
// ============================================================

let currentAllocation = [];
let currentRequest = [];
let currentAvailable = [];


// ============================================================
// GENERATE TABLES
// ============================================================

function generateTables() {

    const processCount =
        parseInt(document.getElementById("processCount").value);

    const resourceCount =
        parseInt(document.getElementById("resourceCount").value);

    if (processCount <= 0 || resourceCount <= 0) {
        alert("Please enter valid process and resource counts.");
        return;
    }

    generateAllocationTable(processCount, resourceCount);
    generateRequestTable(processCount, resourceCount);
    generateAvailableTable(resourceCount);

    drawGraph();
}


// ============================================================
// GENERATE ALLOCATION TABLE
// ============================================================

function generateAllocationTable(processCount, resourceCount) {

    const container =
        document.getElementById("allocationTable");

    let html = `
        <table>
            <thead>
                <tr>
                    <th>Process</th>
    `;

    for (let j = 0; j < resourceCount; j++) {
        html += `<th>R${j + 1}</th>`;
    }

    html += `
                </tr>
            </thead>

            <tbody>
    `;

    for (let i = 0; i < processCount; i++) {

        html += `
            <tr>
                <td>
                    <strong>P${i + 1}</strong>
                </td>
        `;

        for (let j = 0; j < resourceCount; j++) {

            html += `
                <td>
                    <input
                        type="number"
                        min="0"
                        value="0"
                        class="allocation-input"
                        data-process="${i}"
                        data-resource="${j}"
                    >
                </td>
            `;
        }

        html += `
            </tr>
        `;
    }

    html += `
            </tbody>
        </table>
    `;

    container.innerHTML = html;

    addInputListeners();
}


// ============================================================
// GENERATE REQUEST TABLE
// ============================================================

function generateRequestTable(processCount, resourceCount) {

    const container =
        document.getElementById("requestTable");

    let html = `
        <table>
            <thead>
                <tr>
                    <th>Process</th>
    `;

    for (let j = 0; j < resourceCount; j++) {
        html += `<th>R${j + 1}</th>`;
    }

    html += `
                </tr>
            </thead>

            <tbody>
    `;

    for (let i = 0; i < processCount; i++) {

        html += `
            <tr>
                <td>
                    <strong>P${i + 1}</strong>
                </td>
        `;

        for (let j = 0; j < resourceCount; j++) {

            html += `
                <td>
                    <input
                        type="number"
                        min="0"
                        value="0"
                        class="request-input"
                        data-process="${i}"
                        data-resource="${j}"
                    >
                </td>
            `;
        }

        html += `
            </tr>
        `;
    }

    html += `
            </tbody>
        </table>
    `;

    container.innerHTML = html;

    addInputListeners();
}


// ============================================================
// GENERATE AVAILABLE RESOURCE TABLE
// ============================================================

function generateAvailableTable(resourceCount) {

    const container =
        document.getElementById("availableTable");

    let html = `
        <table>
            <thead>
                <tr>
                    <th>Resource</th>
                    <th>Available Instances</th>
                </tr>
            </thead>

            <tbody>
    `;

    for (let j = 0; j < resourceCount; j++) {

        html += `
            <tr>

                <td>
                    <strong>R${j + 1}</strong>
                </td>

                <td>

                    <input
                        type="number"
                        min="0"
                        value="0"
                        class="available-input"
                        data-resource="${j}"
                    >

                </td>

            </tr>
        `;
    }

    html += `
            </tbody>
        </table>
    `;

    container.innerHTML = html;

    addInputListeners();
}


// ============================================================
// LIVE GRAPH UPDATE
// ============================================================

function addInputListeners() {

    const inputs = document.querySelectorAll(
        ".allocation-input, .request-input, .available-input"
    );

    inputs.forEach(input => {

        input.addEventListener("input", function () {

            drawGraph();

        });

    });
}


// ============================================================
// READ ALLOCATION MATRIX
// ============================================================

function readAllocationMatrix() {

    const processCount =
        parseInt(document.getElementById("processCount").value);

    const resourceCount =
        parseInt(document.getElementById("resourceCount").value);

    const matrix = [];

    for (let i = 0; i < processCount; i++) {

        const row = [];

        for (let j = 0; j < resourceCount; j++) {

            const input = document.querySelector(
                `.allocation-input[data-process="${i}"][data-resource="${j}"]`
            );

            row.push(
                parseInt(input?.value) || 0
            );
        }

        matrix.push(row);
    }

    return matrix;
}


// ============================================================
// READ REQUEST MATRIX
// ============================================================

function readRequestMatrix() {

    const processCount =
        parseInt(document.getElementById("processCount").value);

    const resourceCount =
        parseInt(document.getElementById("resourceCount").value);

    const matrix = [];

    for (let i = 0; i < processCount; i++) {

        const row = [];

        for (let j = 0; j < resourceCount; j++) {

            const input = document.querySelector(
                `.request-input[data-process="${i}"][data-resource="${j}"]`
            );

            row.push(
                parseInt(input?.value) || 0
            );
        }

        matrix.push(row);
    }

    return matrix;
}


// ============================================================
// READ AVAILABLE RESOURCES
// ============================================================

function readAvailableResources() {

    const resourceCount =
        parseInt(document.getElementById("resourceCount").value);

    const available = [];

    for (let j = 0; j < resourceCount; j++) {

        const input = document.querySelector(
            `.available-input[data-resource="${j}"]`
        );

        available.push(
            parseInt(input?.value) || 0
        );
    }

    return available;
}


// ============================================================
// RUN SIMULATION
// ============================================================

async function simulate() {

    const strategy =
        document.getElementById("strategy").value;

    const allocation =
        readAllocationMatrix();

    const request =
        readRequestMatrix();

    const available =
        readAvailableResources();

    const waitTimeoutInput =
        document.getElementById("waitTimeout");

    const waitTimeout =
        Math.max(
            1,
            parseInt(waitTimeoutInput?.value) || 5
        );

    const holdWaitMode =
        document.getElementById("holdWaitMode")?.value || "timeout";


    currentAllocation = allocation;
    currentRequest = request;
    currentAvailable = available;


    const resultBox =
        document.getElementById("result");


    // --------------------------------------------------------
    // LOADING
    // --------------------------------------------------------

    resultBox.innerHTML = `

        <div class="result-placeholder">

            <div class="result-icon">
                ...
            </div>

            <h3>
                Running simulation...
            </h3>

            <p>
                Analyzing resource allocation and
                deadlock conditions.
            </p>

        </div>

    `;


    try {

        // ----------------------------------------------------
        // SEND DATA TO FLASK
        // ----------------------------------------------------

        const response = await fetch("/simulate", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                strategy: strategy,

                allocation: allocation,

                request: request,

                available: available,

                wait_timeout: waitTimeout,

                hold_wait_mode: holdWaitMode

            })

        });


        // ----------------------------------------------------
        // CHECK RESPONSE
        // ----------------------------------------------------

        if (!response.ok) {

            throw new Error(
                `Server returned status ${response.status}`
            );
        }


        // ----------------------------------------------------
        // GET JSON RESULT
        // ----------------------------------------------------

        const result =
            await response.json();


        // ----------------------------------------------------
        // DISPLAY RESULT
        // ----------------------------------------------------

        displayResult(result);


        // ----------------------------------------------------
        // UPDATE GRAPH
        // ----------------------------------------------------

        drawGraph();


    } catch (error) {

        console.error(
            "Simulation Error:",
            error
        );


        resultBox.innerHTML = `

            <div class="result-placeholder">

                <div class="result-icon">
                    !
                </div>

                <h3>
                    Simulation Error
                </h3>

                <p>
                    ${escapeHtml(error.message)}
                </p>

            </div>

        `;
    }
}


// ============================================================
// DISPLAY SIMULATION RESULT
// ============================================================

function displayResult(result) {

    const resultBox =
        document.getElementById("result");


    let html = `

        <div class="section-heading">

            <div>

                <span class="section-number">
                    05
                </span>

                <div class="section-title">

                    <h2>
                        Simulation Result
                    </h2>

                    <p>
                        Results produced by the selected
                        prevention strategy.
                    </p>

                </div>

            </div>

        </div>

    `;


    // ========================================================
    // DEADLOCK DETECTION
    // ========================================================

    if (result.deadlock_detection) {

        const detection =
            result.deadlock_detection;


        // ----------------------------------------------------
        // DEADLOCK
        // ----------------------------------------------------

        if (detection.deadlock === true) {

            html += `

                <div class="deadlock-result-card">

                    <div class="result-icon danger-icon">
                        !
                    </div>

                    <div class="result-content">

                        <h2>
                            DEADLOCK DETECTED
                        </h2>

                        <p>

                            <strong>
                                Deadlocked Processes:
                            </strong>

                            ${detection.deadlocked_processes.join(", ")}

                        </p>

                        <p class="result-description">

                            These processes cannot complete
                            with the currently available
                            resources.

                        </p>

                    </div>

                </div>

            `;

        }


        // ----------------------------------------------------
        // NO DEADLOCK
        // ----------------------------------------------------

        else {

            html += `

                <div
                    class="deadlock-result-card
                           safe-result-card"
                >

                    <div class="result-icon safe-icon">
                        ✓
                    </div>

                    <div class="result-content">

                        <h2>
                            NO DEADLOCK DETECTED
                        </h2>

                        <p class="result-description">

                            All processes can complete
                            with the currently available
                            resources.

                        </p>

                    </div>

                </div>

            `;
        }
    }


    // ========================================================
    // PREVENTION STRATEGY CARD
    // ========================================================

    html += `

        <div class="prevention-result-card">

            <div class="result-card-header">

                <div>

                    <span class="result-small-label">
                        PREVENTION STRATEGY
                    </span>

                    <h2>
                        Strategy Execution
                    </h2>

                </div>

                <div class="success-badge">

                    ✓ Successful

                </div>

            </div>

    `;


    // ========================================================
    // STRATEGY MESSAGE
    // ========================================================

    if (result.message) {

        html += `

            <div class="strategy-message">

                <span class="message-icon">
                    ✓
                </span>

                <div>

                    <strong>
                        Strategy Applied
                    </strong>

                    <p>
                        ${escapeHtml(result.message)}
                    </p>

                </div>

            </div>

        `;
    }


    // ========================================================
    // WAIT TIMEOUT
    // ========================================================

    if (result.strategy === "Hold-and-Wait Prevention") {
        if (result.mode === "timeout" && result.wait_timeout) {
            html += `<div class="timeout-summary"><strong>Hold-and-Wait method: Wait Timeout</strong><br>Maximum wait: ${escapeHtml(result.wait_timeout)} seconds. If the complete request is not granted, the process releases its held resources and exits.</div>`;
        }
        if (result.mode === "simultaneous") {
            html += `<div class="timeout-summary"><strong>Hold-and-Wait method: Simultaneous Allocation</strong><br>Requests in the same batch are allocated together only when the complete group can be satisfied. No partial allocation is made.</div>`;
        }
    }


    // ========================================================
    // ACTIONS
    // ========================================================

    if (Array.isArray(result.actions)) {

        html += `

            <div class="result-section">

                <h3>
                    Actions Taken
                </h3>

                <div class="action-list">

        `;


        result.actions.forEach(
            (action, index) => {

                html += `

                    <div class="action-item">

                        <div class="action-number">
                            ${index + 1}
                        </div>

                        <div>
                            ${escapeHtml(action)}
                        </div>

                    </div>

                `;

            }
        );


        html += `

                </div>

            </div>

        `;
    }


    // ========================================================
    // DETAILED PROCESS-BY-PROCESS EXECUTION
    // ========================================================

    if (Array.isArray(result.process_steps)) {

        html += `

            <div class="result-section">

                <h3>
                    Detailed Process Execution
                </h3>

                <p class="result-section-description">
                    Each step below is generated from the entered
                    Allocation, Request, and Available matrices.
                </p>

                <div class="process-step-list">

        `;

        result.process_steps.forEach((step) => {

            const statusClass =
                String(step.status || "")
                    .toLowerCase()
                    .includes("granted")
                    ? "step-granted"
                    : String(step.status || "")
                        .toLowerCase()
                        .includes("reject")
                        || String(step.status || "")
                            .toLowerCase()
                            .includes("timeout")
                        ? "step-rejected"
                        : String(step.status || "")
                            .toLowerCase()
                            .includes("preempt")
                        ? "step-preempted"
                        : "step-neutral";

            html += `

                <div class="process-step-card">

                    <div class="process-step-header">

                        <strong>
                            ${escapeHtml(step.process)}
                        </strong>

                        <span class="step-status ${statusClass}">
                            ${escapeHtml(step.status || "PROCESSED")}
                        </span>

                    </div>

                    <ol class="process-step-details">

            `;

            (step.details || []).forEach(detail => {

                html += `
                    <li>
                        ${escapeHtml(detail)}
                    </li>
                `;

            });

            html += `

                    </ol>

                </div>

            `;

        });

        html += `

                </div>

            </div>

        `;
    }


    // ========================================================
    // ALLOCATION
    // ========================================================

    if (Array.isArray(result.allocation)) {

        html += `

            <div class="result-section">

                <h3>
                    Allocation Matrix
                </h3>

                ${createMatrixTable(
                    result.allocation
                )}

            </div>

        `;
    }


    // ========================================================
    // REQUEST
    // ========================================================

    if (Array.isArray(result.request)) {

        html += `

            <div class="result-section">

                <h3>
                    Request Matrix
                </h3>

                ${createMatrixTable(
                    result.request
                )}

            </div>

        `;
    }


    // ========================================================
    // REQUEST MATRIX ALTERNATIVE KEY
    // ========================================================

    if (
        Array.isArray(result.request_matrix) &&
        !Array.isArray(result.request)
    ) {

        html += `

            <div class="result-section">

                <h3>
                    Request Matrix
                </h3>

                ${createMatrixTable(
                    result.request_matrix
                )}

            </div>

        `;
    }


    // ========================================================
    // AVAILABLE
    // ========================================================

    if (Array.isArray(result.available)) {

        html += `

            <div class="result-section">

                <h3>
                    Available Resources
                </h3>

                ${createAvailableTable(
                    result.available
                )}

            </div>

        `;
    }


    // ========================================================
    // CLOSE PREVENTION CARD
    // ========================================================

    html += `

        </div>

    `;


    resultBox.innerHTML = html;
}


// ============================================================
// CREATE MATRIX TABLE
// ============================================================

function createMatrixTable(matrix) {

    if (
        !Array.isArray(matrix) ||
        matrix.length === 0
    ) {
        return "";
    }


    let html = `

        <div class="result-table-wrapper">

            <table class="result-matrix-table">

                <thead>

                    <tr>

                        <th>
                            Process
                        </th>

    `;


    const resourceCount =
        matrix[0].length;


    for (
        let j = 0;
        j < resourceCount;
        j++
    ) {

        html += `

            <th>
                R${j + 1}
            </th>

        `;
    }


    html += `

                    </tr>

                </thead>

                <tbody>

    `;


    matrix.forEach(
        (row, i) => {

            html += `

                <tr>

                    <td>
                        <strong>
                            P${i + 1}
                        </strong>
                    </td>

            `;


            row.forEach(
                value => {

                    html += `

                        <td>
                            ${value}
                        </td>

                    `;
                }
            );


            html += `

                </tr>

            `;
        }
    );


    html += `

                </tbody>

            </table>

        </div>

    `;


    return html;
}


// ============================================================
// CREATE AVAILABLE RESOURCE TABLE
// ============================================================

function createAvailableTable(available) {

    let html = `

        <div class="available-result-grid">

    `;


    available.forEach(
        (value, index) => {

            html += `

                <div class="available-result-item">

                    <span>
                        R${index + 1}
                    </span>

                    <strong>
                        ${value}
                    </strong>

                    <small>
                        available
                    </small>

                </div>

            `;

        }
    );


    html += `

        </div>

    `;


    return html;
}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHtml(value) {

    return String(value)

        .replace(/&/g, "&amp;")

        .replace(/</g, "&lt;")

        .replace(/>/g, "&gt;")

        .replace(/"/g, "&quot;")

        .replace(/'/g, "&#039;");
}


// ============================================================
// RESOURCE ALLOCATION GRAPH
// ============================================================

function drawGraph() {

    const container =
        document.getElementById(
            "allocationGraph"
        );


    if (!container) {
        return;
    }


    const processCount =
        parseInt(
            document.getElementById(
                "processCount"
            ).value
        );


    const resourceCount =
        parseInt(
            document.getElementById(
                "resourceCount"
            ).value
        );


    // --------------------------------------------------------
    // TABLES NOT CREATED YET
    // --------------------------------------------------------

    const allocationInputs =
        document.querySelectorAll(
            ".allocation-input"
        );


    const requestInputs =
        document.querySelectorAll(
            ".request-input"
        );


    const availableInputs =
        document.querySelectorAll(
            ".available-input"
        );


    if (
        allocationInputs.length === 0 ||
        requestInputs.length === 0 ||
        availableInputs.length === 0
    ) {

        container.innerHTML = `

            <p class="graph-placeholder">

                Generate the tables and enter
                resource values to visualize
                the graph.

            </p>

        `;

        return;
    }


    const allocation =
        readAllocationMatrix();


    const request =
        readRequestMatrix();


    const available =
        readAvailableResources();


    // ========================================================
    // GRAPH SIZE
    // ========================================================

    const width =
        Math.max(
            900,
            resourceCount * 220
        );


    const height =
        Math.max(
            500,
            processCount * 170
        );


    // ========================================================
    // PROCESS POSITIONS
    // ========================================================

    const processPositions = [];


    for (
        let i = 0;
        i < processCount;
        i++
    ) {

        processPositions.push({

            x: 180,

            y:
                processCount === 1
                    ? height / 2
                    :
                    100 +
                    i *
                    (
                        (height - 200) /
                        (processCount - 1)
                    )

        });
    }


    // ========================================================
    // RESOURCE POSITIONS
    // ========================================================

    const resourcePositions = [];


    for (
        let j = 0;
        j < resourceCount;
        j++
    ) {

        resourcePositions.push({

            x: width - 180,

            y:
                resourceCount === 1
                    ? height / 2
                    :
                    100 +
                    j *
                    (
                        (height - 200) /
                        (resourceCount - 1)
                    )

        });
    }


    // ========================================================
    // SVG START
    // ========================================================

    let svg = `

        <svg
            width="${width}"
            height="${height}"
            viewBox="0 0 ${width} ${height}"
            xmlns="http://www.w3.org/2000/svg"
        >

            <defs>

                <!-- Allocation arrow -->

                <marker
                    id="arrowAllocated"
                    markerWidth="10"
                    markerHeight="10"
                    refX="8"
                    refY="3"
                    orient="auto"
                >

                    <path
                        d="M0,0 L0,6 L9,3 z"
                        fill="#2563eb"
                    />

                </marker>


                <!-- Request arrow -->

                <marker
                    id="arrowRequested"
                    markerWidth="10"
                    markerHeight="10"
                    refX="8"
                    refY="3"
                    orient="auto"
                >

                    <path
                        d="M0,0 L0,6 L9,3 z"
                        fill="#ef4444"
                    />

                </marker>

            </defs>

    `;


    // ========================================================
    // ALLOCATION EDGES
    // RESOURCE → PROCESS
    // ========================================================

    for (
        let i = 0;
        i < processCount;
        i++
    ) {

        for (
            let j = 0;
            j < resourceCount;
            j++
        ) {

            const amount =
                allocation[i][j];


            if (amount > 0) {

                const p =
                    processPositions[i];

                const r =
                    resourcePositions[j];


                svg += `

                    <line

                        x1="${r.x - 70}"
                        y1="${r.y}"

                        x2="${p.x + 55}"
                        y2="${p.y}"

                        stroke="#2563eb"

                        stroke-width="4"

                        marker-end="
                            url(#arrowAllocated)
                        "

                    />


                    <text

                        x="${(r.x + p.x) / 2}"

                        y="${(r.y + p.y) / 2 - 10}"

                        text-anchor="middle"

                        font-size="16"

                        font-weight="bold"

                    >

                        ${amount}

                    </text>

                `;
            }
        }
    }


    // ========================================================
    // REQUEST EDGES
    // PROCESS → RESOURCE
    // ========================================================

    for (
        let i = 0;
        i < processCount;
        i++
    ) {

        for (
            let j = 0;
            j < resourceCount;
            j++
        ) {

            const amount =
                request[i][j];


            if (amount > 0) {

                const p =
                    processPositions[i];

                const r =
                    resourcePositions[j];


                svg += `

                    <line

                        x1="${p.x + 55}"
                        y1="${p.y}"

                        x2="${r.x - 70}"
                        y2="${r.y}"

                        stroke="#ef4444"

                        stroke-width="3"

                        stroke-dasharray="8,6"

                        marker-end="
                            url(#arrowRequested)
                        "

                    />


                    <text

                        x="${(r.x + p.x) / 2}"

                        y="${(r.y + p.y) / 2 + 18}"

                        text-anchor="middle"

                        font-size="16"

                        font-weight="bold"

                    >

                        ${amount}

                    </text>

                `;
            }
        }
    }


    // ========================================================
    // PROCESS NODES
    // ========================================================

    for (
        let i = 0;
        i < processCount;
        i++
    ) {

        const p =
            processPositions[i];


        svg += `

            <circle

                cx="${p.x}"

                cy="${p.y}"

                r="55"

                fill="#2563eb"

                stroke="#1d4ed8"

                stroke-width="3"

            />


            <text

                x="${p.x}"

                y="${p.y + 6}"

                text-anchor="middle"

                fill="white"

                font-size="18"

                font-weight="bold"

            >

                P${i + 1}

            </text>

        `;
    }


    // ========================================================
    // RESOURCE NODES
    // ========================================================

    for (
        let j = 0;
        j < resourceCount;
        j++
    ) {

        const r =
            resourcePositions[j];


        svg += `

            <rect

                x="${r.x - 70}"

                y="${r.y - 48}"

                width="140"

                height="96"

                rx="15"

                fill="#10b981"

                stroke="#047857"

                stroke-width="3"

            />


            <text

                x="${r.x}"

                y="${r.y - 5}"

                text-anchor="middle"

                font-size="17"

                font-weight="bold"

            >

                R${j + 1}

            </text>


            <text

                x="${r.x}"

                y="${r.y + 22}"

                text-anchor="middle"

                font-size="14"

            >

                ${available[j]} instances

            </text>

        `;
    }


    // ========================================================
    // CLOSE SVG
    // ========================================================

    svg += `

        </svg>

    `;


    container.innerHTML = svg;
}


// ============================================================
// HOLD-AND-WAIT TIMEOUT VISIBILITY
// ============================================================

function updateTimeoutVisibility() {
    const strategy = document.getElementById("strategy")?.value;
    const holdWaitControl = document.getElementById("holdWaitModeControl");
    if (!holdWaitControl) return;
    holdWaitControl.style.display = strategy === "hold_wait" ? "block" : "none";
    updateHoldWaitModeVisibility();
}

function updateHoldWaitModeVisibility() {
    const mode = document.getElementById("holdWaitMode")?.value || "timeout";
    const timeoutSettings = document.getElementById("timeoutSettings");
    const simultaneousInfo = document.getElementById("simultaneousInfo");
    if (timeoutSettings) timeoutSettings.style.display = mode === "timeout" ? "block" : "none";
    if (simultaneousInfo) simultaneousInfo.style.display = mode === "simultaneous" ? "block" : "none";
}


// ============================================================
// PAGE LOAD
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        // Do not automatically generate tables.
        // The HTML button calls generateTables().

        drawGraph();
        updateTimeoutVisibility();

    }
);