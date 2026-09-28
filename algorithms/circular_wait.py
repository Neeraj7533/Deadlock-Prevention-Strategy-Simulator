def prevent_circular_wait(allocation, requests, available):
    processes = len(allocation)
    resources = len(available)

    new_allocation = [row[:] for row in allocation]
    new_available = available[:]
    actions = []

    # Resource ordering: R1 < R2 < R3 ...
    resource_order = list(range(resources))

    for i in range(processes):
        held_resources = []
        requested_resources = []

        for j in range(resources):
            if new_allocation[i][j] > 0:
                held_resources.append(j)

            if requests[i][j] > 0:
                requested_resources.append(j)

        # Highest resource currently held by the process
        highest_held = max(held_resources) if held_resources else -1

        valid_request = True

        # Every requested resource must have a higher order
        # than the resources already held
        for resource in requested_resources:
            if resource <= highest_held:
                valid_request = False
                break

        if not valid_request:
            actions.append(
                f"P{i + 1}: Request denied - violates resource ordering."
            )
            continue

        # Check availability
        can_allocate = True

        for j in range(resources):
            if requests[i][j] > new_available[j]:
                can_allocate = False
                break

        if can_allocate:
            for j in range(resources):
                new_allocation[i][j] += requests[i][j]
                new_available[j] -= requests[i][j]

            actions.append(
                f"P{i + 1}: Request granted - follows resource ordering."
            )
        else:
            actions.append(
                f"P{i + 1}: Request waiting - resources unavailable."
            )

    return {
        "success": True,
        "strategy": "Circular-Wait Prevention",
        "message": "Circular-Wait prevention applied.",
        "resource_order": [
            f"R{i + 1}" for i in resource_order
        ],
        "allocation": new_allocation,
        "available": new_available,
        "actions": actions
    }