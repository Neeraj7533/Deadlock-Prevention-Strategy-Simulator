def detect_deadlock(allocation, request, available):
    """
    Detect deadlock using the deadlock detection algorithm.

    allocation = resources currently held by each process
    request    = resources each process is still waiting for
    available  = currently available resources
    """

    # Make copies so original data is not changed
    work = available.copy()

    process_count = len(allocation)
    finished = [False] * process_count

    # Keep checking whether a process can finish
    changed = True

    while changed:

        changed = False

        for i in range(process_count):

            if finished[i]:
                continue

            # Check whether Request[i] <= Work
            can_finish = True

            for j in range(len(work)):
                if request[i][j] > work[j]:
                    can_finish = False
                    break

            if can_finish:

                # Process can finish and release its resources
                for j in range(len(work)):
                    work[j] += allocation[i][j]

                finished[i] = True
                changed = True

    # Processes that could not finish are deadlocked
    deadlocked_processes = []

    for i in range(process_count):
        if not finished[i]:
            deadlocked_processes.append(f"P{i + 1}")

    if len(deadlocked_processes) > 0:

        return {
            "deadlock": True,
            "message": "DEADLOCK DETECTED",
            "deadlocked_processes": deadlocked_processes
        }

    else:

        return {
            "deadlock": False,
            "message": "NO DEADLOCK DETECTED",
            "deadlocked_processes": []
        }