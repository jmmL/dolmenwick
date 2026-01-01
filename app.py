from flask import Flask, render_template, jsonify
import json
import random

app = Flask(__name__)

# --- Data Loading ---
def load_data():
    """Loads all JSON data from files into a dictionary."""
    data = {}
    with open('data/adventurer_kindred.json') as f:
        data['adventurer_kindred'] = json.load(f)
    with open('data/kindreds.json') as f:
        data['kindreds'] = json.load(f)
    with open('data/alignments.json') as f:
        data['alignments'] = json.load(f)
    with open('data/quests.json') as f:
        data['quests'] = json.load(f)
    with open('data/names.json') as f:
        data['names'] = json.load(f)
    return data

game_data = load_data()


# --- Dice Rolling and Lookups ---
def roll(dice_string):
    """Rolls dice based on a string like '1d6' or '1d4+4'."""
    parts = dice_string.replace('+', 'd').split('d')
    num_dice = int(parts[0])
    dice_sides = int(parts[1])
    modifier = int(parts[2]) if len(parts) > 2 else 0
    return sum(random.randint(1, dice_sides) for _ in range(num_dice)) + modifier

def lookup_result(roll, table):
    """Finds the result in a table based on a dice roll."""
    for roll_range, result in table.items():
        start, end = map(int, roll_range.split('-'))
        if start <= roll <= end:
            return result
    return None

# --- Routes ---
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/generate-party')
def generate_party():
    party_size = roll('1d4+4')
    party = []

    # Determine party alignment
    party_alignment = lookup_result(roll('1d6'), game_data['alignments'])

    # Determine party level type
    level_type_roll = roll('1d6')
    is_higher_level = level_type_roll == 6

    used_names = set()
    for _ in range(party_size):
        # Determine Kindred
        kindred_name = lookup_result(roll('1d12'), game_data['adventurer_kindred'])
        kindred_data = game_data['kindreds'][kindred_name]

        # Determine Class
        character_class = lookup_result(roll('1d20'), kindred_data['adventurer_class_table'])

        # Determine Level
        level = roll('1d6+3') if is_higher_level else roll('1d3')

        # Determine Name
        while True:
            first_name = random.choice(game_data['names'][kindred_name]['first_names'])
            surname = random.choice(game_data['names'][kindred_name]['surnames'])
            full_name = f"{first_name} {surname}"
            if full_name not in used_names:
                used_names.add(full_name)
                break

        party.append({
            'name': full_name,
            'kindred': kindred_data['name'],
            'class': character_class,
            'level': level,
            'alignment': party_alignment
        })

    # Shared party stats
    shared_treasure = {
        'cp': roll('1d100'),
        'sp': roll('1d100'),
        'gp': roll('1d100'),
        'gems': roll('1d4') if random.random() < 0.1 else 0,
        'art_objects': roll('1d4') if random.random() < 0.1 else 0
    }

    mounts = "Riding horses" if random.random() < 0.75 else "None"

    for member in party:
        member['trinket'] = "Random trinket" if roll('1d6') <= 2 else "None"

    quest = random.choice(game_data['quests'][party_alignment])

    return jsonify({
        'party': party,
        'shared_treasure': shared_treasure,
        'mounts': mounts,
        'quest': quest
    })


if __name__ == '__main__':
    app.run(debug=True)
