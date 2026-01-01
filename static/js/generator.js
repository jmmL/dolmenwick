// ⚡ Bolt: Cache game data to avoid redundant network requests.
// The data is fetched once and stored in memory for subsequent party generations.
let gameDataCache = null;
async function getGameData() {
    if (gameDataCache) {
        return gameDataCache;
    }

    const files = ['adventurer_kindred', 'kindreds', 'alignments', 'quests', 'names', 'spells'];
    const promises = files.map(file => fetch(`data/${file}.json`).then(response => response.json()));
    const results = await Promise.all(promises);
    const data = {};
    files.forEach((file, index) => {
        data[file] = results[index];
    });

    gameDataCache = data;
    return data;
}

function roll(diceString) {
    const parts = diceString.replace('+', 'd').split('d');
    const numDice = parseInt(parts[0]);
    const diceSides = parseInt(parts[1]);
    const modifier = parts.length > 2 ? parseInt(parts[2]) : 0;
    let total = 0;
    for (let i = 0; i < numDice; i++) {
        total += Math.floor(Math.random() * diceSides) + 1;
    }
    return total + modifier;
}

function lookupResult(rollValue, table) {
    for (const rollRange in table) {
        const [start, end] = rollRange.split('-').map(Number);
        if (rollValue >= start && rollValue <= end) {
            return table[rollRange];
        }
    }
    return null;
}

function generateName(kindredName, namesData) {
    const kindredNameData = namesData[kindredName.toLowerCase()];
    let firstName, surname;

    switch (kindredName.toLowerCase()) {
        case 'breggle':
        case 'human':
        case 'mossling':
        case 'woodgrue':
            const roll = Math.random();
            if (roll < 1/3) {
                firstName = kindredNameData.male[Math.floor(Math.random() * kindredNameData.male.length)];
            } else if (roll < 2/3) {
                firstName = kindredNameData.female[Math.floor(Math.random() * kindredNameData.female.length)];
            } else {
                firstName = kindredNameData.unisex[Math.floor(Math.random() * kindredNameData.unisex.length)];
            }
            surname = kindredNameData.surname[Math.floor(Math.random() * kindredNameData.surname.length)];
            return `${firstName} ${surname}`;

        case 'elf':
            if (Math.random() < 0.5) {
                return kindredNameData.courtly[Math.floor(Math.random() * kindredNameData.courtly.length)];
            } else {
                return kindredNameData.rustic[Math.floor(Math.random() * kindredNameData.rustic.length)];
            }

        case 'grimalkin':
            firstName = kindredNameData.first_name[Math.floor(Math.random() * kindredNameData.first_name.length)];
            if (firstName.includes('/')) {
                const options = firstName.split('/');
                firstName = Math.random() < 0.5 ? options[0] : options[1];
            }
            surname = kindredNameData.surname[Math.floor(Math.random() * kindredNameData.surname.length)];
            return `${firstName} ${surname}`;

        default:
            return "Unknown Kindred";
    }
}

async function generateParty() {
    const gameData = await getGameData();
    const partySize = roll('1d4+4');
    const party = [];
    const usedNames = new Set();

    const partyAlignment = lookupResult(roll('1d6'), gameData.alignments);
    const isHigherLevel = roll('1d6') === 6;

    for (let i = 0; i < partySize; i++) {
        const kindredName = lookupResult(roll('1d12'), gameData.adventurer_kindred);
        const kindredData = gameData.kindreds[kindredName];
        const characterClass = lookupResult(roll('1d20'), kindredData.adventurer_class_table);
        const level = isHigherLevel ? roll('1d6+3') : roll('1d3');

        let fullName;
        while (true) {
            fullName = generateName(kindredName, gameData.names);
            if (!usedNames.has(fullName)) {
                usedNames.add(fullName);
                break;
            }
        }

        let magic = "";
        if (characterClass === "Magician") {
            let spells = [];
            for(let i=0; i<level+1; i++) spells.push(gameData.spells.Arcane[Math.floor(Math.random() * gameData.spells.Arcane.length)]);
            magic = `<strong>Arcane Spells:</strong> ${[...new Set(spells)].join(", ")}`;
        } else if (characterClass === "Cleric" || characterClass === "Friar") {
            let spells = [];
            let spellCount = (characterClass === "Cleric" && level < 2) ? 0 : level;
            for(let i=0; i<spellCount; i++) spells.push(gameData.spells.Holy[Math.floor(Math.random() * gameData.spells.Holy.length)]);
            magic = spells.length > 0 ? `<strong>Holy Spells:</strong> ${[...new Set(spells)].join(", ")}` : "No holy spells prepared yet.";
        } else if (characterClass === "Enchanter") {
            let glamours = [];
            for(let i=0; i<level; i++) glamours.push(gameData.spells.Glamours[Math.floor(Math.random() * gameData.spells.Glamours.length)]);
            let rune = level >= 1 ? `<br><strong>Rune:</strong> ${gameData.spells.Runes[Math.floor(Math.random() * gameData.spells.Runes.length)]}` : "";
            magic = `<strong>Glamours:</strong> ${[...new Set(glamours)].join(", ")}${rune}`;
        }

        const magicItems = [];
        const categories = ["Armour", "Ring", "Weapon", "Potion", "Rod/Staff", "Scroll", "Wondrous"];
        categories.forEach(cat => {
            if (roll('1d100') <= (level * 5)) magicItems.push(cat);
        });

        party.push({
            name: fullName,
            kindred: kindredData.name,
            class: characterClass,
            level: level,
            alignment: partyAlignment,
            magic: magic,
            magicItems: magicItems
        });
    }

    const sharedTreasure = {
        cp: roll('1d100'),
        sp: roll('1d100'),
        gp: roll('1d100'),
        gems: Math.random() < 0.1 ? roll('1d4') : 0,
        art_objects: Math.random() < 0.1 ? roll('1d4') : 0
    };

    const mounts = Math.random() < 0.75 ? 'Riding horses (if encountered on road or in settlement)' : 'On foot';
    const quest = gameData.quests[partyAlignment][Math.floor(Math.random() * gameData.quests[partyAlignment].length)];

    return {
        party: party,
        shared_treasure: sharedTreasure,
        mounts: mounts,
        quest: quest
    };
}
