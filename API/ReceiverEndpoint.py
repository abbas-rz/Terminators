import os
import json
import uuid
import bcrypt
import csv
from flask import Flask, request, jsonify
from flask_cors import CORS # type: ignore

# Google Generative AI
import google.generativeai as genai  # type: ignore

# 🔑 Google Generative API Key
key = "AIzaSyCCIXPTw5o3qz6cysKrVZS8WdASNZg398M"

# 📁 JSON file to act as the database
DB_FILE = 'server.json'

# 📊 CSV cache file for nutrition data
CSV_FILE = 'nutrition_cache.csv'

# 🔧 Ensure files exist
if not os.path.exists(DB_FILE):
    with open(DB_FILE, 'w') as f:
        json.dump({"users": {}}, f)

if not os.path.exists(CSV_FILE):
    # Create CSV file with headers
    with open(CSV_FILE, 'w', newline='') as f:
        writer = csv.writer(f)
        # Headers correspond to flattened nutrition JSON
        # We'll store the whole vitamins_minerals dict as JSON string to keep it flexible
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

# 🌱 Flask app setup
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# 🤖 Gemini Nutrition Analyzer Class
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

# 🔬 Initialize analyzer
analyzer = NutritionAnalyzer(key)

# 🗂 User database helpers
def load_users():
    with open(DB_FILE, 'r') as f:
        return json.load(f)

def save_users(data):
    with open(DB_FILE, 'w') as f:
        json.dump(data, f, indent=4)

# 📊 Nutrition CSV caching helpers
def load_nutrition_cache():
    cache = {}
    with open(CSV_FILE, 'r', newline='') as f:
        reader = csv.DictReader(f)
        for row in reader:
            food = row['food_item'].lower()
            # Parse serving quantity as float or int if possible
            try:
                quantity = float(row['serving_quantity'])
                if quantity.is_integer():
                    quantity = int(quantity)
            except (ValueError, TypeError):
                quantity = row['serving_quantity']

            # Parse vitamins_minerals as JSON
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

# Load nutrition cache on app start
nutrition_cache = load_nutrition_cache()

# 📡 Routes

@app.route('/nutrition', methods=['POST'])
def nutrition():
    data = request.json
    food_item = data.get('food_item')
    if not food_item:
        return jsonify({"error": "Please provide a food item."}), 400

    food_key = food_item.lower()

    # Check cache first
    if food_key in nutrition_cache:
        return jsonify(nutrition_cache[food_key])

    # If not in cache, get from Gemini AI
    result = analyzer.get_nutrition_info(food_item)

    # If valid result, check if exact food_item already present by value in cache
    if "error" not in result:
        # Check if exact food_item string is already present
        food_exists = any(
            existing_data.get("food_item", "").lower() == result.get("food_item", "").lower()
            for existing_data in nutrition_cache.values()
        )
        if not food_exists:
            append_nutrition_cache(result)
            # Update cache with lowercased key from the result food_item (exact string)
            nutrition_cache[result.get("food_item","").lower()] = result
        else:
            # Do nothing, data already cached for this food_item string
            pass

    return jsonify(result)

@app.route('/register', methods=['POST'])
def register_user():
    data = request.json
    required_fields = ['name', 'password', 'paid', 'kcal_goal']

    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing fields in request"}), 400

    users = load_users()
    user_id = str(uuid.uuid4())

    hashed_password = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    user_data = {
        "name": data['name'],
        "password": hashed_password,
        "paid": data['paid'],
        "kcal_goal": data['kcal_goal']
    }

    users['users'][user_id] = user_data
    save_users(users)

    return jsonify({"message": "User registered successfully!", "user_id": user_id}), 201

@app.route('/login', methods=['POST'])
def login_user():
    data = request.json
    name = data.get('name')
    password = data.get('password')

    if not name or not password:
        return jsonify({"error": "Name and password required"}), 400

    users = load_users().get('users', {})

    for user_id, user_data in users.items():
        if user_data.get("name") == name:
            stored_hash = user_data.get("password", "").encode('utf-8')
            if bcrypt.checkpw(password.encode('utf-8'), stored_hash):
                return jsonify({
                    "message": "Login successful!",
                    "user_id": user_id,
                    "profile": {
                        "name": user_data["name"],
                        "paid": user_data["paid"],
                        "kcal_goal": user_data["kcal_goal"]
                    }
                }), 200

    return jsonify({"error": "Invalid name or password"}), 401

@app.route('/test', methods=['GET'])
def test():
    return jsonify({"message": "Nutrition API is running successfully!"})

# 🏁 Run public server
if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5000)

