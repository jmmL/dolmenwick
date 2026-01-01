document.addEventListener('DOMContentLoaded', () => {
    const generateButton = document.getElementById('generate-party');
    const outputDisplay = document.getElementById('output');
    const errorLog = document.getElementById('error-log');

    generateButton.addEventListener('click', async () => {
        try {
            errorLog.innerHTML = "";
            const data = await generateParty();

            let html = `
                <div class="party-summary">
                    <strong>Party Composition:</strong> ${data.party.length} adventurers |
                    ${data.party[0].level > 3 ? "High Level" : "Low Level"} |
                    ${data.mounts}<br>
                    <strong>Current Quest (${data.party[0].alignment}):</strong> ${data.quest}<br>
                    <strong>Shared Wealth:</strong> ${data.shared_treasure.gp}gp, ${data.shared_treasure.sp}sp, ${data.shared_treasure.cp}cp, ${data.shared_treasure.gems} gems, ${data.shared_treasure.art_objects} art objects
                </div>
                <div class="character-grid">`;

            data.party.forEach(c => {
                html += `
                    <div class="card">
                        <div class="name">${c.name}</div>
                        <div class="class-line">Level ${c.level} ${c.kindred} ${c.class}</div>
                        <div style="margin-bottom: 10px;">
                            <div class="stat-line"><span class="stat-label">Alignment:</span> ${c.alignment}</div>
                            <div class="stat-line"><span class="stat-label">Gear:</span> Standard Class Equipment</div>
                            ${c.magicItems.length > 0 ? `<div class="stat-line"><span class="stat-label">Magic Items:</span> ${c.magicItems.join(", ")}</div>` : ""}
                            ${c.trinket !== "None" ? `<div class="stat-line"><span class="stat-label">Possession:</span> ${c.trinket}</div>` : ""}
                        </div>
                        ${c.magic ? `<div class="magic-box">${c.magic}</div>` : ""}
                    </div>`;
            });

            html += `</div>`;
            outputDisplay.innerHTML = html;

        } catch (e) {
            errorLog.innerHTML = "Error: " + e.message;
            console.error(e);
        }
    });
});
