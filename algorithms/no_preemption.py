def _resource_list(values):
    return [
        f"R{j + 1} ({amount})"
        for j, amount in enumerate(values)
        if amount > 0
    ]


def prevent_no_preemption(allocation, requests, available):
    processes = len(allocation)
    resources = len(available)

    new_allocation = [row[:] for row in allocation]
    new_available = available[:]
    actions = []
    process_steps = []

    for i in range(processes):
        required = requests[i][:]
        step_lines = []

        step_lines.append(
            f"P{i + 1} currently holds: "
            + (", ".join(_resource_list(new_allocation[i])) or "None")
            + "."
        )
        step_lines.append(
            f"P{i + 1} requests: "
            + (", ".join(_resource_list(required)) or "None")
            + "."
        )

        if not any(required):
            step_lines.append("No pending request; no action is required.")
            actions.append(f"P{i + 1}: No pending request.")
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

            step_lines.append("All requested resources are currently available.")
            step_lines.append("Allocated: " + ", ".join(allocated) + ".")
            step_lines.append("Available resources updated.")

            actions.append(f"P{i + 1}: Request granted.")
            status = "GRANTED"

        else:
            step_lines.append(
                "Request cannot be granted because: "
                + ", ".join(unavailable) + "."
            )

            released = []
            for j in range(resources):
                if new_allocation[i][j] > 0:
                    released.append(f"R{j + 1} ({new_allocation[i][j]})")
                    new_available[j] += new_allocation[i][j]
                    new_allocation[i][j] = 0

            if released:
                step_lines.append(
                    "Preemption applied. Released: "
                    + ", ".join(released) + "."
                )
                step_lines.append(
                    "The pending request remains unallocated so the process "
                    "can retry later."
                )
                status = "PREEMPTED"
                actions.append(
                    f"P{i + 1}: Request unavailable; preempted "
                    + ", ".join(released) + "."
                )
            else:
                step_lines.append(
                    "No resources are currently held by this process, "
                    "so there is nothing to preempt."
                )
                status = "REJECTED"
                actions.append(
                    f"P{i + 1}: Request unavailable; no held resources to preempt."
                )

        process_steps.append({
            "process": f"P{i + 1}",
            "status": status,
            "details": step_lines
        })

    return {
        "success": True,
        "strategy": "No-Preemption Prevention",
        "message": "No-Preemption prevention applied.",
        "allocation": new_allocation,
        "request": [row[:] for row in requests],
        "available": new_available,
        "actions": actions,
        "process_steps": process_steps
    }
