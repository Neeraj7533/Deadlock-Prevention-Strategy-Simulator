def _resource_list(values):
    return [
        f"R{j + 1} ({amount})"
        for j, amount in enumerate(values)
        if amount > 0
    ]


def prevent_hold_and_wait(
    allocation, requests, available, wait_timeout=5, mode="timeout"
):
    """
    Hold-and-Wait prevention with two modes:

    1. timeout: a process may wait only up to wait_timeout. If the
       request is still unavailable, it releases all held resources.
    2. simultaneous: processes requesting resources at the same time
       are treated as one atomic group. Either the complete group can
       be allocated together, or no process in that group gets a
       partial allocation.
    """
    processes = len(allocation)
    resources = len(available)

    new_allocation = [row[:] for row in allocation]
    new_available = available[:]
    actions = []
    process_steps = []

    if mode == "simultaneous":
        pending = [i for i in range(processes) if any(requests[i])]

        # Calculate the total resource requirement of the simultaneous group.
        total_required = [0] * resources
        for i in pending:
            for j in range(resources):
                total_required[j] += requests[i][j]

        can_allocate_group = all(
            total_required[j] <= new_available[j] for j in range(resources)
        )

        group_details = []
        for i in pending:
            held_text = ", ".join(_resource_list(new_allocation[i])) or "None"
            request_text = ", ".join(_resource_list(requests[i])) or "None"
            group_details.append(
                f"P{i + 1} holds: {held_text}. P{i + 1} requests: {request_text}."
            )

        if can_allocate_group:
            # Atomic allocation: allocate every simultaneous request together.
            for i in pending:
                allocated = []
                for j in range(resources):
                    amount = requests[i][j]
                    if amount > 0:
                        new_allocation[i][j] += amount
                        new_available[j] -= amount
                        allocated.append(f"R{j + 1} ({amount})")

                process_steps.append({
                    "process": f"P{i + 1}",
                    "status": "GRANTED - SIMULTANEOUS",
                    "details": [
                        f"P{i + 1} was part of the simultaneous request group.",
                        f"Requested: {', '.join(_resource_list(requests[i])) or 'None'}.",
                        "The complete group request was available, so all requests were allocated at the same time.",
                        "Allocated: " + ", ".join(allocated) + ".",
                    ]
                })
                actions.append(
                    f"P{i + 1}: Request granted simultaneously with the other pending processes."
                )

            for i in range(processes):
                if not any(requests[i]):
                    process_steps.append({
                        "process": f"P{i + 1}",
                        "status": "NO REQUEST",
                        "details": [f"P{i + 1} has no pending resource request."]
                    })
        else:
            unavailable = []
            for j in range(resources):
                if total_required[j] > new_available[j]:
                    unavailable.append(
                        f"R{j + 1} (group requested {total_required[j]}, available {new_available[j]})"
                    )

            for i in pending:
                process_steps.append({
                    "process": f"P{i + 1}",
                    "status": "REJECTED - GROUP NOT AVAILABLE",
                    "details": [
                        f"P{i + 1} was part of the simultaneous request group.",
                        f"Requested: {', '.join(_resource_list(requests[i])) or 'None'}.",
                        "All simultaneous requests cannot be satisfied together because "
                        + ", ".join(unavailable) + ".",
                        "No partial allocation is made, so no process is allowed to hold resources while waiting."
                    ]
                })
                actions.append(
                    f"P{i + 1}: Request rejected because the complete simultaneous group could not be allocated."
                )

            for i in range(processes):
                if not any(requests[i]):
                    process_steps.append({
                        "process": f"P{i + 1}",
                        "status": "NO REQUEST",
                        "details": [f"P{i + 1} has no pending resource request."]
                    })

        return {
            "success": True,
            "strategy": "Hold-and-Wait Prevention",
            "mode": "simultaneous",
            "mode_label": "Simultaneous Allocation",
            "message": "Simultaneous allocation applied: requests in the same batch are allocated together or not partially allocated.",
            "wait_timeout": None,
            "allocation": new_allocation,
            "request": [row[:] for row in requests],
            "available": new_available,
            "actions": actions,
            "process_steps": process_steps,
            "simultaneous_group": [f"P{i + 1}" for i in pending],
            "group_request": total_required,
        }

    # Default mode: timeout
    for i in range(processes):
        required = requests[i][:]
        step_lines = []

        held_text = ", ".join(_resource_list(new_allocation[i])) or "None"
        request_text = ", ".join(_resource_list(required)) or "None"

        step_lines.append(f"P{i + 1} currently holds: {held_text}.")
        step_lines.append(f"P{i + 1} requests: {request_text}.")

        if not any(required):
            step_lines.append(f"P{i + 1}: No pending resource request. Process can continue.")
            actions.append(f"P{i + 1}: No pending request; no allocation required.")
            process_steps.append({
                "process": f"P{i + 1}",
                "status": "NO REQUEST",
                "details": step_lines
            })
            continue

        unavailable = []
        for j in range(resources):
            if required[j] > new_available[j]:
                unavailable.append(
                    f"R{j + 1} (requested {required[j]}, available {new_available[j]})"
                )

        if not unavailable:
            allocated = []
            for j in range(resources):
                if required[j] > 0:
                    new_allocation[i][j] += required[j]
                    new_available[j] -= required[j]
                    allocated.append(f"R{j + 1} ({required[j]})")

            step_lines.append("All requested resources are available simultaneously.")
            step_lines.append("Allocated together: " + ", ".join(allocated) + ".")
            step_lines.append("Available resources updated after allocation.")

            actions.append(f"P{i + 1}: Request granted; all requested resources allocated together.")
            status = "GRANTED"
        else:
            step_lines.append(
                "The complete request cannot be allocated because: " + ", ".join(unavailable) + "."
            )
            step_lines.append(
                f"P{i + 1} is allowed to wait for a maximum of {wait_timeout} seconds."
            )

            released = []
            for j in range(resources):
                if new_allocation[i][j] > 0:
                    released.append(f"R{j + 1} ({new_allocation[i][j]})")
                    new_available[j] += new_allocation[i][j]
                    new_allocation[i][j] = 0

            if released:
                step_lines.append("Wait timeout reached. Released held resources: " + ", ".join(released) + ".")
            else:
                step_lines.append("Wait timeout reached. No resources were held by this process.")

            step_lines.append(
                f"P{i + 1} exits after the {wait_timeout}-second wait timeout; its pending request is not allocated."
            )
            actions.append(
                f"P{i + 1}: Request denied after {wait_timeout}s timeout; held resources released and process exited."
            )
            status = "TIMEOUT / RELEASED"

        process_steps.append({
            "process": f"P{i + 1}",
            "status": status,
            "details": step_lines
        })

    return {
        "success": True,
        "strategy": "Hold-and-Wait Prevention",
        "mode": "timeout",
        "mode_label": "Wait Timeout",
        "message": f"Hold-and-Wait prevention applied with a {wait_timeout}-second maximum wait timeout.",
        "wait_timeout": wait_timeout,
        "allocation": new_allocation,
        "request": [row[:] for row in requests],
        "available": new_available,
        "actions": actions,
        "process_steps": process_steps
    }
