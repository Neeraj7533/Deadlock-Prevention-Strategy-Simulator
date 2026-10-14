from flask import Flask, render_template, request, jsonify

from algorithms.hold_wait import prevent_hold_and_wait
from algorithms.no_preemption import prevent_no_preemption
from algorithms.circular_wait import prevent_circular_wait
from algorithms.deadlock_detection import detect_deadlock

# Database functions
from database import (
    initialize_database,
    save_simulation,
    get_simulations
)


app = Flask(__name__)


# Initialize database
initialize_database()


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/simulate", methods=["POST"])
def simulate():

    data = request.get_json()

    strategy = data.get("strategy")
    allocation = data.get("allocation")
    request_matrix = data.get("request")
    available = data.get("available")
    wait_timeout = data.get("wait_timeout", 5)
    hold_wait_mode = data.get("hold_wait_mode", "timeout")

    try:
        wait_timeout = max(1, int(wait_timeout))
    except (TypeError, ValueError):
        wait_timeout = 5


    # ==========================================
    # DEADLOCK DETECTION
    # ==========================================

    deadlock_result = detect_deadlock(
        allocation,
        request_matrix,
        available
    )


    # ==========================================
    # SELECT DEADLOCK PREVENTION STRATEGY
    # ==========================================

    if strategy == "hold_wait":

        result = prevent_hold_and_wait(
            allocation,
            request_matrix,
            available,
            wait_timeout,
            hold_wait_mode
        )


    elif strategy == "no_preemption":

        result = prevent_no_preemption(
            allocation,
            request_matrix,
            available
        )


    elif strategy == "circular_wait":

        result = prevent_circular_wait(
            allocation,
            request_matrix,
            available
        )


    else:

        return jsonify({
            "success": False,
            "message": "Invalid strategy"
        }), 400


    # ==========================================
    # ADD DEADLOCK DETECTION TO RESULT
    # ==========================================

    result["deadlock_detection"] = deadlock_result
    result["initial_allocation"] = allocation
    result["initial_request"] = request_matrix
    result["initial_available"] = available


    # ==========================================
    # SAVE COMPLETE SIMULATION TO DATABASE
    # ==========================================

    save_simulation(
        strategy,
        allocation,
        request_matrix,
        available,
        result
    )


    # ==========================================
    # SEND RESULT BACK TO FRONTEND
    # ==========================================

    return jsonify(result)


# ==============================================
# VIEW STORED SIMULATIONS
# ==============================================

@app.route("/history", methods=["GET"])
def history():

    simulations = get_simulations()

    return jsonify({
        "success": True,
        "simulations": simulations
    })


# ==============================================
# START FLASK SERVER
# ==============================================

if __name__ == "__main__":

    app.run(debug=True)