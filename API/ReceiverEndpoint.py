import os
import json
import uuid
import bcrypt
import csv
from flask import Flask, request, jsonify
from flask_cors import CORS

import google.generativeai as genai

key = "AIzaSyCCIXPTw5o3qz6cysKrVZS8WdASNZg398M"

DB_FILE = 'server.json'

CSV_FILE = 'nutrition_cache.csv'

if not os.path.exists(DB_FILE):
    with open(DB_FILE, 'w') as f:
        json.dump({"users": {}}, f)

if not os.path.exists(CSV_FILE):
    with open(CSV_FILE, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow([
            "food_item",
            "serving_weight",
            "serving_quantity",
            "calories",
            "protein",
            "carbohydrates",
            "fat",
            "vitamins_minerals_json"
        ])

app = Flask(__name__)
CORS(app)

class NutritionAnalyzer:
    def __init__(self, apiKey):
        genai.configure(api_key=apiKey)
        self.model = genai.GenerativeModel('gemini-1.5-flash')

    def get_nutrition_info(self, food_item):
        prompt = f"""
        Please provide nutrition information for: {food_item}

        Return ONLY a valid JSON object with this exact structure:
        {{
        "food_item": "food name",
        "serving_size": {{
            "weight": "weight in grams (e.g., 100g)",
            "quantity": number
        }},
        "calories": "number with kcal unit (e.g., 250kcal)",
        "macronutrients": {{
            "protein": "number with g unit (e.g., 6.5g)",
            "carbohydrates": "number with g unit (e.g., 42.5g)",
            "fat": "number with g unit (e.g., 11.5g)"
        }},
        "vitamins_minerals": {{
            "Vitamin A": "amount with unit (e.g., 150mcg)",
            "Vitamin C": "amount with unit (e.g., 12mg)",
            "Iron": "amount with unit (e.g., 2.8mg)",
            "Potassium": "amount with unit (e.g., 320mg)",
            "other vitamins/minerals": "amount with unit"
        }}
        }}

        Use typical serving sizes in Indian households and provide single fixed values for nutritional data based on standard portions.
        All macronutrient values should include 'g' unit for grams.
        Include specific amounts with proper SI units for vitamins and minerals (mg, mcg, etc.).
        Return only the JSON object, no additional text or explanations.
        """

        try:
            response = self.model.generate_content(prompt)
            raw_text = response.text.strip()
            start = raw_text.find('{')
            end = raw_text.rfind('}') + 1

            if start != -1 and end != -1:
                json_str = raw_text[start:end]
                try:
                    json_data = json.loads(json_str)
                    return json_data
                except json.JSONDecodeError:
                    return {"error": "Invalid JSON extracted from the model response."}
            else:
                return {"error": "No JSON object found in the model response."}

        except Exception as e:
            return {"error": f"Error getting nutrition information: {str(e)}"}

analyzer = NutritionAnalyzer(key)

def load_users():
    with open(DB_FILE, 'r') as f:
        return json.load(f)

def save_users(data):
    with open(DB_FILE, 'w') as f:
        json.dump(data, f, indent=4)

def load_nutrition_cache():
    cache = {}
    with open(CSV_FILE, 'r', newline='') as f:
        reader = csv.DictReader(f)
        for row in reader:
            food = row['food_item'].lower()
            try:
                quantity = float(row['serving_quantity'])
                if quantity.is_integer():
                    quantity = int(quantity)
            except (ValueError, TypeError):
                quantity = row['serving_quantity']

            try:
                vitamins_minerals = json.loads(row['vitamins_minerals_json'])
            except (json.JSONDecodeError, TypeError):
                vitamins_minerals = {}

            cache[food] = {
                "food_item": row['food_item'],
                "serving_size": {
                    "weight": row['serving_weight'],
                    "quantity": quantity,
                },
                "calories": row['calories'],
                "macronutrients": {
                    "protein": row['protein'],
                    "carbohydrates": row['carbohydrates'],
                    "fat": row['fat'],
                },
                "vitamins_minerals": vitamins_minerals
            }
    return cache

def append_nutrition_cache(nutri_data):
    # Flatten the structure to rows for CSV
    with open(CSV_FILE, 'a', newline='') as f:
        writer = csv.writer(f)
        food_item = nutri_data.get("food_item", "")
        serving_size = nutri_data.get("serving_size", {})
        weight = serving_size.get("weight", "")
        quantity = serving_size.get("quantity", "")
        calories = nutri_data.get("calories", "")
        macronutrients = nutri_data.get("macronutrients", {})
        protein = macronutrients.get("protein", "")
        carbohydrates = macronutrients.get("carbohydrates", "")
        fat = macronutrients.get("fat", "")
        vitamins_minerals = nutri_data.get("vitamins_minerals", {})
        vitamins_json_str = json.dumps(vitamins_minerals, ensure_ascii=False)

        writer.writerow([
            food_item,
            weight,
            quantity,
            calories,
            protein,
            carbohydrates,
            fat,
            vitamins_json_str
        ])

nutrition_cache = load_nutrition_cache()

@app.route('/nutrition', methods=['POST'])
def nutrition():
    data = request.json
    food_item = data.get('food_item')
    if not food_item:
        return jsonify({"error": "Please provide a food item."}), 400

    food_key = food_item.lower()

    if food_key in nutrition_cache:
        return jsonify(nutrition_cache[food_key])

    result = analyzer.get_nutrition_info(food_item)

    if "error" not in result:
        food_exists = any(
            existing_data.get("food_item", "").lower() == result.get("food_item", "").lower()
            for existing_data in nutrition_cache.values()
        )
        if not food_exists:
            append_nutrition_cache(result)
            nutrition_cache[result.get("food_item","").lower()] = result
        else:
            pass

    return jsonify(result)

@app.route('/kcal_goal', methods=["POST"])
def kcal_goal():
    data = request.json
    required_fields = ['uuid', 'kcal_goal']
    print(data)
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing fields in request"}), 400

    users = load_users()
    id = data['uuid']

    users['users'][id]["kcal_goal"] = data['kcal_goal']
    save_users(users)

    return jsonify({"message": "Success"}), 201

@app.route('/register', methods=['POST'])
def register_user():
    data = request.json
    required_fields = ['name', 'email', 'password']

    user_id = str(uuid.uuid4())

    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing fields in request"}), 400

    users = load_users()

    if user_id in users['users']:
        return jsonify({"error": "User already exists."}), 409

    hashed_password = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    for user in users['users']:
        if data['email'] == users['users'][user]["email"]:
            return jsonify({"error": "User already exists."}), 409

    user_data = {
        "name": data['name'],
        "email": data['email'],
        "password": hashed_password,
        "kcal_goal": 0  # Optional: Initialize with 0 or None
    }

    users['users'][user_id] = user_data
    print("Saving Users: \n", users)
    save_users(users)

    return jsonify({"message": "User registered successfully!", "user_id": user_id}), 201

@app.route('/login', methods=['POST'])
def login_user():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"error": "Send all required fields"}), 400

    users = load_users()

    for user in users['users']:
        if bcrypt.checkpw(password.encode('utf-8'), users['users'][user]['password'].encode('utf-8')):
            return jsonify({
                "message": "Login successful!",
                "profile": {
                    "name": data["name"],
                    "kcal_goal": users['users'][user]["kcal_goal"]
                },
                "user_id": user
            }), 200
            break

    return jsonify({"error": "Invalid name or password"}), 401

@app.route('/test', methods=['GET'])
def test():
    return jsonify({"message": "Nutrition API is running successfully!"})

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5000)

