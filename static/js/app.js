document.addEventListener('DOMContentLoaded', () => {
    const generateButton = document.getElementById('generate-party');
    const partyDisplay = document.getElementById('party-display');

    generateButton.addEventListener('click', () => {
        fetch('/generate-party')
            .then(response => response.json())
            .then(data => {
                let html = '<h2>Your Adventuring Party</h2>';

                html += '<h3>Party Stats</h3>';
                html += `<ul>`;
                html += `<li><b>Quest:</b> ${data.quest}</li>`;
                html += `<li><b>Shared Treasure:</b> ${data.shared_treasure.gp}gp, ${data.shared_treasure.sp}sp, ${data.shared_treasure.cp}cp</li>`;
                html += `</ul>`;

                html += '<h3>Members</h3>';
                html += '<table>';
                html += '<tr><th>Name</th><th>Kindred</th><th>Class</th><th>Level</th><th>Alignment</th></tr>';
                data.party.forEach(member => {
                    html += `<tr>`;
                    html += `<td>${member.name}</td>`;
                    html += `<td>${member.kindred}</td>`;
                    html += `<td>${member.class}</td>`;
                    html += `<td>${member.level}</td>`;
                    html += `<td>${member.alignment}</td>`;
                    html += `</tr>`;
                });
                html += '</table>';

                partyDisplay.innerHTML = html;
            });
    });
});
