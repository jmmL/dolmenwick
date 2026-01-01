async function getGameData(basePath = '') {
    const files = ['adventurer_kindred', 'kindreds', 'alignments', 'quests', 'names', 'classes', 'spells_refactored'];
    const promises = files.map(file => fetch(`${basePath}data/${file}.json`).then(response => response.json()));
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
    if (!diceString.includes('d')) {
        return parseInt(diceString);
    }
    const parts = diceString.split('d');
    const numDice = parseInt(parts[0]);
    const diceSides = parseInt(parts[1]);
    let total = 0;
    for (let i = 0; i < numDice; i++) {
        total += Math.floor(Math.random() * diceSides) + 1;
    }
    return total;
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

function getRandomItem(arr) {
    if (!arr || arr.length === 0) return null;
    return arr[Math.floor(Math.random() * arr.length)];
}

function getUniqueRandomItems(count, sourceArray, existingItems = []) {
    const selectedItems = [...existingItems];
    if (!sourceArray || sourceArray.length === 0) return selectedItems;
    const availableItems = sourceArray.filter(item => !existingItems.includes(item));
    const numToSelect = Math.min(count, availableItems.length);
    while (selectedItems.length < existingItems.length + numToSelect) {
        const newItem = getRandomItem(availableItems);
        if (!selectedItems.includes(newItem)) {
            selectedItems.push(newItem);
        }
    }
    return selectedItems;
}


function assignSpells(character, gameData) {
    const spells = {};
    const classData = gameData.classes[character.class];
    const kindredData = gameData.kindreds[character.kindred.toLowerCase()];
    const allSpells = gameData.spells_refactored;

    // 1. Kindred-based Magic
    if (kindredData.magic) {
        if (kindredData.magic.type === 'glamour') {
            spells.glamours = getUniqueRandomItems(kindredData.magic.count, allSpells.glamours);
        }
        if (kindredData.magic.type === 'knack') {
            spells.knack = getRandomItem(allSpells.knacks);
        }
    }

    // 2. Class-based Magic
    if (classData && classData.magic) {
        const magicRules = classData.magic;

        if (magicRules.type === 'arcane' || magicRules.type === 'holy') {
            const spellType = magicRules.type;
            const levelInfo = magicRules.spells_by_level ? magicRules.spells_by_level[character.level] : {};
            spells[spellType] = {};
            let allClassSpells = [];
            for (const rank in levelInfo) {
                const count = levelInfo[rank];
                const selectedForRank = getUniqueRandomItems(count, allSpells[spellType][rank], allClassSpells);
                // We only want the *new* spells for this rank
                spells[spellType][rank] = selectedForRank.slice(allClassSpells.length);
                allClassSpells.push(...spells[spellType][rank]);
            }
        }

        if (character.class === 'Enchanter') {
            const glamourCount = magicRules.glamours_by_level ? magicRules.glamours_by_level[character.level] : 0;
            spells.glamours = getUniqueRandomItems(glamourCount, allSpells.glamours, spells.glamours || []);

            const acquiredRunes = { lesser: [], greater: [], mighty: [] };
            const levelModifier = getEnchanterLevelModifier(character.level);

            for (let i = 0; i < character.level; i++) { // One roll per level
                const runeRoll = roll('2d6') + levelModifier;
                if (runeRoll >= 12) {
                    acquiredRunes.mighty.push(getRandomItem(allSpells.runes.mighty));
                } else if (runeRoll >= 8) {
                    acquiredRunes.greater.push(getRandomItem(allSpells.runes.greater));
                } else if (runeRoll >= 3) {
                    acquiredRunes.lesser.push(getRandomItem(allSpells.runes.lesser));
                }
            }

            if (acquiredRunes.lesser.length > 0 || acquiredRunes.greater.length > 0 || acquiredRunes.mighty.length > 0) {
                spells.runes = acquiredRunes;
            }
        }
    }

    return spells;
}

function getEnchanterLevelModifier(level) {
    if (level >= 10) return 3;
    if (level >= 6) return 2;
    if (level >= 3) return 1;
    return 0;
}

function formatMagic(character, spells) {
    if (Object.keys(spells).length === 0) {
        if (["Cleric", "Friar"].includes(character.class)) return "No prayers prepared yet.";
        return "";
    }

    let html = '';

    if (spells.glamours && spells.glamours.length > 0) {
        html += `<strong>Glamours:</strong> ${spells.glamours.join(', ')}<br>`;
    }
    if (spells.knack) {
        html += `<strong>Knack:</strong> ${spells.knack}<br>`;
    }

    const formatRankedSpells = (spellData, typeName) => {
        let spellList = [];
        Object.keys(spellData).sort().forEach(rank => {
            spellData[rank].forEach(spell => {
                spellList.push(`${spell} (${rank})`);
            });
        });
        if (spellList.length > 0) {
            return `<strong>${typeName}:</strong> ${spellList.join(', ')}<br>`;
        }
        return '';
    };

    if (spells.arcane) {
        html += formatRankedSpells(spells.arcane, "Arcane Spells");
    }
    if (spells.holy) {
        html += formatRankedSpells(spells.holy, "Holy Spells");
    }

    if (spells.runes) {
        ['lesser', 'greater', 'mighty'].forEach(type => {
            if (spells.runes[type] && spells.runes[type].length > 0) {
                const typeName = type.charAt(0).toUpperCase() + type.slice(1);
                html += `<strong>${typeName} Rune:</strong> ${spells.runes[type].join(', ')}<br>`;
            }
        });
    }

    if (character.class === "Bard") {
        let targets = "Mortals";
        if (character.level >= 4) targets += ", Animals, Demi-fey";
        if (character.level >= 7) targets += ", Fairies, Monstrosities";
        html += `<strong>Unique Ability:</strong> Counter Charm<br><strong>Enchantment:</strong> Can fascinate ${targets}`;
    }

    return html.trim();
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
    const partySize = roll('1d4') + 4;
    const party = [];
    const usedNames = new Set();
    const partyAlignment = lookupResult(roll('1d6'), gameData.alignments);
    const isHigherLevel = roll('1d6') === 6;

    for (let i = 0; i < partySize; i++) {
        const kindredName = lookupResult(roll('1d12'), gameData.adventurer_kindred);
        const kindredData = gameData.kindreds[kindredName.toLowerCase()];
        const characterClass = lookupResult(roll('1d20'), kindredData.adventurer_class_table);
        const level = isHigherLevel ? roll('1d6') + 3 : roll('1d3');

        let fullName;
        while (true) {
            const firstName = getRandomItem(gameData.names[kindredName.toLowerCase()].first_names);
            const surname = getRandomItem(gameData.names[kindredName.toLowerCase()].surnames);
            fullName = `${firstName} ${surname}`;
            fullName = generateName(kindredName, gameData.names);
            if (!usedNames.has(fullName)) {
                usedNames.add(fullName);
                break;
            }
        }

        const character = { name: fullName, kindred: kindredData.name, class: characterClass, level: level };
        const spells = assignSpells(character, gameData);
        const magicString = formatMagic(character, spells);
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
            ...character,
            alignment: partyAlignment,
            magic: magicString,
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
    const quest = getRandomItem(gameData.quests[partyAlignment]);
    const quest = gameData.quests[partyAlignment][Math.floor(Math.random() * gameData.quests[partyAlignment].length)];

    return { party, shared_treasure: sharedTreasure, mounts, quest };
}
