document.addEventListener('DOMContentLoaded', () => {
    const generateButton = document.getElementById('generate-party');
    const outputDisplay = document.getElementById('output');
    const errorLog = document.getElementById('error-log');

    generateButton.addEventListener('click', async () => {
        generateButton.disabled = true;
        generateButton.textContent = "Generating...";
        try {
            // 🛡️ Sentinel: Use textContent to safely clear previous error messages and prevent XSS.
            errorLog.textContent = "";
            const data = await generateParty();

            // 🛡️ Sentinel: Refactored to use safe DOM manipulation instead of innerHTML to prevent XSS.
            outputDisplay.innerHTML = ""; // Clear previous results

            // Party Summary
            const summary = document.createElement('div');
            summary.className = 'party-summary';
            const compStrong = document.createElement('strong');
            compStrong.textContent = 'Party Composition:';
            summary.appendChild(compStrong);
            summary.appendChild(document.createTextNode(` ${data.party.length} adventurers | ${data.party[0].level > 3 ? "High Level" : "Low Level"} | ${data.mounts}`));
            summary.appendChild(document.createElement('br'));
            const questStrong = document.createElement('strong');
            questStrong.textContent = `Current Quest (${data.party[0].alignment}):`;
            summary.appendChild(questStrong);
            summary.appendChild(document.createTextNode(` ${data.quest}`));
            summary.appendChild(document.createElement('br'));
            const wealthStrong = document.createElement('strong');
            wealthStrong.textContent = 'Shared Wealth:';
            summary.appendChild(wealthStrong);
            summary.appendChild(document.createTextNode(` ${data.shared_treasure.gp}gp, ${data.shared_treasure.sp}sp, ${data.shared_treasure.cp}cp, ${data.shared_treasure.gems} gems, ${data.shared_treasure.art_objects} art objects`));
            outputDisplay.appendChild(summary);

            // Character Grid
            const grid = document.createElement('div');
            grid.className = 'character-grid';
            data.party.forEach(c => {
                const card = document.createElement('div');
                card.className = 'card';

                const name = document.createElement('div');
                name.className = 'name';
                name.textContent = c.name; // Safely set text content
                card.appendChild(name);

                const classLine = document.createElement('div');
                classLine.className = 'class-line';
                classLine.textContent = `${c.kindred} ${c.class} (level ${c.level})`; // Safely set text content
                card.appendChild(classLine);

                const stats = document.createElement('div');
                stats.style.marginBottom = '10px';
                const alignmentLine = document.createElement('div');
                alignmentLine.className = 'stat-line';
                const alignmentLabel = document.createElement('span');
                alignmentLabel.className = 'stat-label';
                alignmentLabel.textContent = 'Alignment:';
                alignmentLine.appendChild(alignmentLabel);
                alignmentLine.appendChild(document.createTextNode(` ${c.alignment}`));
                stats.appendChild(alignmentLine);

                if (c.magicItems.length > 0) {
                    const magicItemsLine = document.createElement('div');
                    magicItemsLine.className = 'stat-line';
                    const magicItemsLabel = document.createElement('span');
                    magicItemsLabel.className = 'stat-label';
                    magicItemsLabel.textContent = 'Magic Items:';
                    magicItemsLine.appendChild(magicItemsLabel);
                    magicItemsLine.appendChild(document.createTextNode(` ${c.magicItems.join(', ')}`));
                    stats.appendChild(magicItemsLine);
                }
                card.appendChild(stats);

                if (c.magic) {
                    const magicBox = document.createElement('div');
                    magicBox.className = 'magic-box';
                    // The HTML here is from trusted, hardcoded strings in generator.js, not from user-controlled JSON data.
                    magicBox.innerHTML = c.magic;
                    card.appendChild(magicBox);
                }
                grid.appendChild(card);
            });
            outputDisplay.appendChild(grid);

        } catch (e) {
            // 🛡️ Sentinel: Prevent leaking stack traces to the user. Display a generic error message.
            errorLog.textContent = "An unexpected error occurred. Please try again.";
            console.error(e); // Log the full error for developers
        } finally {
            generateButton.disabled = false;
            generateButton.textContent = "Generate Random Party";
        }
    });
});
