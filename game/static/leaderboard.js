document.addEventListener("DOMContentLoaded", function () {
    const tbody = document.querySelector("#leaderboard tbody");

    async function fetchLeaderboard() {
        try {
            const response = await fetch("/get_leaderboard/"); // new API endpoint
            if (!response.ok) throw new Error("Failed to fetch leaderboard");

            const data = await response.json();

            // Clear existing rows
            tbody.innerHTML = "";

            data.scores.forEach((item, index) => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${item.username}</td>
                    <td>${item.highscore}</td>
                `;
                tbody.appendChild(row);
            });

        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="3">Error loading leaderboard</td></tr>`;
            console.error(err);
        }
    }

    fetchLeaderboard();
});
