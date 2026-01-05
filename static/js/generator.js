// ⚡ Bolt: Cache game data to avoid redundant network requests.
// The data is fetched once and stored in memory for subsequent party generations.
let gameDataCache = null;
async function getGameData() {
    if (gameDataCache) {
        return gameDataCache;
    }

    const files = ['adventurer_kindred', 'kindreds', 'alignments', 'quests', 'names', 'classes', 'spells_refactored', 'houses'];
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
                const sourceArray = allSpells[spellType][rank];
                const selectedForRank = getUniqueRandomItems(count, sourceArray, allClassSpells);

                // We only want the *new* spells for this rank
                spells[spellType][rank] = selectedForRank.slice(allClassSpells.length);
                allClassSpells.push(...spells[spellType][rank]);
            }
        }

        if (character.class === 'Enchanter') {
            const glamourCount = magicRules.glamours_by_level ? magicRules.glamours_by_level[character.level] : 0;
            spells.glamours = getUniqueRandomItems(glamourCount, allSpells.glamours, spells.glamours || []);

            const acquiredRunes = { lesser: {}, greater: {}, mighty: {} };

            for (let i = 1; i <= character.level; i++) { // One roll per level, from level 1 up to current.
                const levelModifier = getEnchanterLevelModifier(i);
                const runeRoll = roll('2d6') + levelModifier;
                let runeType = null;
                let runePool = null;

                if (runeRoll >= 12) {
                    runeType = 'mighty';
                    runePool = allSpells.runes.mighty;
                } else if (runeRoll >= 8) {
                    runeType = 'greater';
                    runePool = allSpells.runes.greater;
                } else if (runeRoll >= 3) {
                    runeType = 'lesser';
                    runePool = allSpells.runes.lesser;
                }

                if (runeType) {
                    const runeName = getRandomItem(runePool);
                    if (acquiredRunes[runeType][runeName]) {
                        acquiredRunes[runeType][runeName]++;
                    } else {
                        acquiredRunes[runeType][runeName] = 1;
                    }
                }
            }

            if (Object.keys(acquiredRunes.lesser).length > 0 || Object.keys(acquiredRunes.greater).length > 0 || Object.keys(acquiredRunes.mighty).length > 0) {
                spells.runes = acquiredRunes;
            }
        }
    }

    return spells;
}

function getEnchanterLevelModifier(level) {
    // SRD: 3-5: +1, 6-9: +2, 10+: +3
    if (level >= 10) return 3;
    if (level >= 6) return 2;
    if (level >= 3) return 1;
    return 0; // Level 1-2 is no modifier
}

function getRuneFrequency(runeType, level, count) {
    let baseFrequency = '';
    if (runeType === 'lesser') {
        if (level <= 4) baseFrequency = 'Once per day';
        else if (level <= 9) baseFrequency = 'Twice per day';
        else baseFrequency = 'Thrice per day';
    } else if (runeType === 'greater') {
        if (level <= 4) baseFrequency = 'Once per Level';
        else if (level <= 9) baseFrequency = 'Once per week';
        else baseFrequency = 'Once per day';
    } else if (runeType === 'mighty') {
        if (level <= 9) baseFrequency = 'Once ever';
        else baseFrequency = 'Once per year';
    }

    if (count > 1) {
        // SRD: "If a rune is granted which the character already knows, the number of times it may be used is doubled."
        // This is interpreted as doubling for each extra acquisition.
        // e.g., 2x for 2 acquisitions, 4x for 3, etc.
        const multiplier = Math.pow(2, count - 1);
        if (baseFrequency.startsWith('Once')) {
             if (multiplier === 2) return baseFrequency.replace('Once', 'Twice');
             return `${multiplier} times${baseFrequency.substring(4)}`;
        } else if (baseFrequency.startsWith('Twice')) {
            return `${2 * multiplier} times${baseFrequency.substring(5)}`;
        } else if (baseFrequency.startsWith('Thrice')) {
            return `${3 * multiplier} times${baseFrequency.substring(6)}`;
        }
    }

    return baseFrequency;
}

// 🛡️ Sentinel: Refactored to return structured data instead of an HTML string, preventing XSS.
function formatMagic(character, spells) {
    const magicData = [];

    if (Object.keys(spells).length === 0) {
        if (["Cleric", "Friar"].includes(character.class)) {
            magicData.push({ text: "No prayers prepared yet." });
        }
        return magicData;
    }

    if (spells.glamours && spells.glamours.length > 0) {
        magicData.push({ label: 'Glamours', text: spells.glamours.join(', ') });
    }
    if (spells.knack) {
        magicData.push({ label: 'Knack', text: spells.knack });
    }

    const formatRankedSpells = (spellData, typeName) => {
        let spellList = [];
        Object.keys(spellData).sort().forEach(rank => {
            spellData[rank].forEach(spell => {
                spellList.push(`${spell} (${rank})`);
            });
        });
        if (spellList.length > 0) {
            magicData.push({ label: typeName, text: spellList.join(', ') });
        }
    };

    if (spells.arcane) {
        formatRankedSpells(spells.arcane, "Arcane Spells");
    }
    if (spells.holy) {
        formatRankedSpells(spells.holy, "Holy Spells");
    }

    if (spells.runes) {
        ['lesser', 'greater', 'mighty'].forEach(type => {
            if (Object.keys(spells.runes[type]).length > 0) {
                const typeName = type.charAt(0).toUpperCase() + type.slice(1);
                let runesForType = [];
                for (const runeName in spells.runes[type]) {
                    const count = spells.runes[type][runeName];
                    const frequency = getRuneFrequency(type, character.level, count);
                    runesForType.push(`${runeName} (${frequency})`);
                }
                magicData.push({ label: `${typeName} Runes`, text: runesForType.join(', ') });
            }
        });
    }

    if (character.class === "Bard") {
        let targets = "Mortals";
        if (character.level >= 4) targets += ", Animals, Demi-fey";
        if (character.level >= 7) targets += ", Fairies, Monstrosities";
        magicData.push({ label: 'Unique Ability', text: 'Counter Charm' });
        magicData.push({ label: 'Enchantment', text: `Can fascinate ${targets}` });
    }

    return magicData;
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

function determineAlignment(charClass, gameData) {
    const housesData = gameData.houses;
    let alignment, houseName;

    if (['Cleric', 'Friar'].includes(charClass)) {
        alignment = Math.random() < 0.5 ? 'Lawful' : 'Neutral';
    } else if (charClass === 'Knight') {
        const houseNames = Object.keys(housesData);
        houseName = getRandomItem(houseNames);
        alignment = housesData[houseName].alignment;
    } else {
        const roll = Math.random();
        if (roll < 1/3) alignment = 'Lawful';
        else if (roll < 2/3) alignment = 'Neutral';
        else alignment = 'Chaotic';
    }

    return { alignment, houseName };
}

function calculatePartyAlignment(party) {
    const alignmentCounts = { Lawful: 0, Neutral: 0, Chaotic: 0 };
    party.forEach(c => {
        if (alignmentCounts[c.alignment] !== undefined) {
            alignmentCounts[c.alignment]++;
        }
    });

    let maxCount = -1;
    let candidates = [];

    for (const align in alignmentCounts) {
        if (alignmentCounts[align] > maxCount) {
            maxCount = alignmentCounts[align];
            candidates = [align];
        } else if (alignmentCounts[align] === maxCount) {
            candidates.push(align);
        }
    }

    return getRandomItem(candidates);
}

async function generateParty(alignmentMode = 'party') {
    const gameData = await getGameData();
    const partySize = roll('1d4') + 4;
    const party = [];
    const usedNames = new Set();
    const isHigherLevel = roll('1d6') === 6;

    // Determine initial party alignment (only used if in 'party' mode)
    let globalPartyAlignment = null;
    if (alignmentMode === 'party') {
        globalPartyAlignment = lookupResult(roll('1d6'), gameData.alignments);
    }

    for (let i = 0; i < partySize; i++) {
        const kindredName = lookupResult(roll('1d12'), gameData.adventurer_kindred);
        const kindredData = gameData.kindreds[kindredName.toLowerCase()];
        const characterClass = lookupResult(roll('1d20'), kindredData.adventurer_class_table);
        const level = isHigherLevel ? roll('1d6') + 3 : roll('1d3');

        let fullName;
        while (true) {
            fullName = generateName(kindredName, gameData.names);
            if (!usedNames.has(fullName)) {
                usedNames.add(fullName);
                break;
            }
        }

        const character = { name: fullName, kindred: kindredData.name, class: characterClass, level: level };
        const spells = assignSpells(character, gameData);
        const magicData = formatMagic(character, spells);

        const magicItems = [];
        const categories = ["Armour", "Ring", "Weapon", "Potion", "Rod/Staff", "Scroll", "Wondrous"];
        categories.forEach(cat => {
            if (roll('1d100') <= (level * 5)) magicItems.push(cat);
        });

        // Alignment Logic
        let charAlignment, houseName;

        if (alignmentMode === 'party') {
            charAlignment = globalPartyAlignment;
            // Handle Knight House selection matching party alignment
            if (characterClass === 'Knight') {
                const compatibleHouses = Object.keys(gameData.houses).filter(
                    h => gameData.houses[h].alignment === globalPartyAlignment
                );
                // Fallback if somehow no house matches (should not happen with standard data)
                if (compatibleHouses.length > 0) {
                    houseName = getRandomItem(compatibleHouses);
                } else {
                    // Fallback to random house
                    houseName = getRandomItem(Object.keys(gameData.houses));
                }
            }
        } else {
            // Individual Mode
            const result = determineAlignment(characterClass, gameData);
            charAlignment = result.alignment;
            houseName = result.houseName;
        }

        if (characterClass === 'Knight' && houseName) {
            character.name += ` of House ${houseName}`;
        }

        party.push({
            ...character,
            alignment: charAlignment,
            magic: magicData,
            magicItems: magicItems
        });
    }

    // Determine Final Party Alignment
    let finalPartyAlignment;
    if (alignmentMode === 'party') {
        finalPartyAlignment = globalPartyAlignment;
    } else {
        finalPartyAlignment = calculatePartyAlignment(party);
    }

    // Select Leader
    const leaderCandidates = party.filter(c => c.alignment === finalPartyAlignment);
    // Fallback: If no candidate matches (very unlikely in individual mode due to calculation, possible if manual overrides existed), pick random.
    // In calculated mode, at least one person has the mode alignment.
    let leaderIndex = -1;
    if (leaderCandidates.length > 0) {
        const leader = getRandomItem(leaderCandidates);
        leaderIndex = party.indexOf(leader);
    } else {
        leaderIndex = Math.floor(Math.random() * party.length);
    }

    const leader = party[leaderIndex];
    leader.isLeader = true;

    // Move leader to front
    party.splice(leaderIndex, 1);
    party.unshift(leader);


    const sharedTreasure = {
        cp: roll('1d100'),
        sp: roll('1d100'),
        gp: roll('1d100'),
        gems: Math.random() < 0.1 ? roll('1d4') : 0,
        art_objects: Math.random() < 0.1 ? roll('1d4') : 0
    };

    const mounts = Math.random() < 0.75 ? 'Riding horses (if encountered on road or in settlement)' : 'On foot';
    const quest = getRandomItem(gameData.quests[finalPartyAlignment]);

    return { party, shared_treasure: sharedTreasure, mounts, quest };
}
