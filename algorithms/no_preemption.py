def prevent_no_preemption(allocation, requests, available):
    processes = len(allocation)
    resources = len(available)

    new_allocation = [row[:] for row in allocation]
    new_available = available[:]
    actions = []

    for i in range(processes):
        required = requests[i]

        can_allocate = True

        for j in range(resources):
            if required[j] > new_available[j]:
                can_allocate = False
                break

        if can_allocate:
            # Allocate requested resources
            for j in range(resources):
                new_allocation[i][j] += required[j]
                new_available[j] -= required[j]

            actions.append(
                f"P{i + 1}: Request granted."
            )

        else:
            # Preempt resources already held by the process
            released = []

            for j in range(resources):
                if new_allocation[i][j] > 0:
                    released.append(
                        f"R{j + 1} ({new_allocation[i][j]})"
                    )

                    new_available[j] += new_allocation[i][j]
                    new_allocation[i][j] = 0

            if released:
                actions.append(
                    f"P{i + 1}: Resources preempted: "
                    + ", ".join(released)
                )
            else:
                actions.append(
                    f"P{i + 1}: No resources available for preemption."
                )

    return {
        "success": True,
        "strategy": "No-Preemption Prevention",
        "message": "No-Preemption prevention applied.",
        "allocation": new_allocation,
        "available": new_available,
        "actions": actions
    }