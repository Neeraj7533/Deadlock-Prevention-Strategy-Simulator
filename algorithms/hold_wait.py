def prevent_hold_and_wait(allocation, requests, available):
    processes = len(allocation)
    resources = len(available)

    new_allocation = [row[:] for row in allocation]
    new_available = available[:]
    actions = []

    for i in range(processes):
        required = requests[i]

        # Check whether all requested resources are available
        can_allocate = True

        for j in range(resources):
            if required[j] > new_available[j]:
                can_allocate = False
                break

        if can_allocate:
            # Allocate all requested resources at once
            for j in range(resources):
                new_allocation[i][j] += required[j]
                new_available[j] -= required[j]

            actions.append(
                f"P{i + 1}: All requested resources allocated together."
            )

        else:
            # Process cannot hold resources while waiting
            actions.append(
                f"P{i + 1}: Request denied - all required resources "
                f"are not available simultaneously."
            )

    return {
        "success": True,
        "strategy": "Hold-and-Wait Prevention",
        "message": "Hold-and-Wait prevention applied.",
        "allocation": new_allocation,
        "available": new_available,
        "actions": actions
    }