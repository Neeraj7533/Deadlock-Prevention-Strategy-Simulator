def _resource_list(values):
    return [
        f"R{j + 1} ({amount})"
        for j, amount in enumerate(values)
        if amount > 0
    ]


def prevent_circular_wait(allocation, requests, available):
    processes = len(allocation)
    resources = len(available)

    new_allocation = [row[:] for row in allocation]
    new_available = available[:]
    actions = []
    process_steps = []

    resource_order = list(range(resources))

    for i in range(processes):
        held_resources = [
            j for j in range(resources)
            if new_allocation[i][j] > 0
        ]
        requested_resources = [
            j for j in range(resources)
            if requests[i][j] > 0
        ]

        step_lines = [
            f"P{i + 1} currently holds: "
            + (", ".join(_resource_list(new_allocation[i])) or "None") + ".",
            f"P{i + 1} requests: "
            + (", ".join(_resource_list(requests[i])) or "None") + ".",
            "Resource order: " + " < ".join(f"R{j + 1}" for j in resource_order) + "."
        ]

        if not requested_resources:
            step_lines.append("No pending request; no ordering check is needed.")
            actions.append(f"P{i + 1}: No pending request.")
            process_steps.append({
                "process": f"P{i + 1}",
                "status": "NO REQUEST",
                "details": step_lines
            })
            continue

        highest_held = max(held_resources) if held_resources else -1
        invalid = [
            j for j in requested_resources
            if j <= highest_held
        ]

        if invalid:
            step_lines.append(
                f"Highest resource order currently held: "
                f"{'R' + str(highest_held + 1) if highest_held >= 0 else 'None'}."
            )
            step_lines.append(
                "Rejected request(s): "
                + ", ".join(f"R{j + 1}" for j in invalid)
                + " because they do not follow the increasing resource order."
            )
            actions.append(
                f"P{i + 1}: Request denied - violates resource ordering."
            )
            status = "REJECTED - ORDER"

        else:
            unavailable = []
            for j in range(resources):
                if requests[i][j] > new_available[j]:
                    unavailable.append(
                        f"R{j + 1} (requested {requests[i][j]}, available {new_available[j]})"
                    )

            if unavailable:
                step_lines.append(
                    "Request follows the resource order, but cannot be allocated because: "
                    + ", ".join(unavailable) + "."
                )
                actions.append(
                    f"P{i + 1}: Request waits - resources unavailable."
                )
                status = "WAITING"
            else:
                allocated = []
                for j in range(resources):
                    if requests[i][j] > 0:
                        new_allocation[i][j] += requests[i][j]
                        new_available[j] -= requests[i][j]
                        allocated.append(f"R{j + 1} ({requests[i][j]})")

                step_lines.append(
                    "Request follows the resource order and is valid."
                )
                step_lines.append(
                    "Allocated: " + ", ".join(allocated) + "."
                )
                step_lines.append("Available resources updated.")
                actions.append(
                    f"P{i + 1}: Request granted - follows resource ordering."
                )
                status = "GRANTED"

        process_steps.append({
            "process": f"P{i + 1}",
            "status": status,
            "details": step_lines
        })

    return {
        "success": True,
        "strategy": "Circular-Wait Prevention",
        "message": "Circular-Wait prevention applied.",
        "resource_order": [f"R{i + 1}" for i in resource_order],
        "allocation": new_allocation,
        "request": [row[:] for row in requests],
        "available": new_available,
        "actions": actions,
        "process_steps": process_steps
    }
