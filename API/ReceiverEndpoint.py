import os
import json
import uuid
import bcrypt
import csv
import re
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

# 🧮 Nutrition calculation helpers
def extract_numeric_value(value_str):
    """Extract numeric value from strings like '250kcal', '6.5g', '150mcg'"""
    if isinstance(value_str, (int, float)):
        return float(value_str)
    
    if isinstance(value_str, str):
        # Use regex to find the first number (including decimals)
        match = re.search(r'(\d+\.?\d*)', value_str)
        if match:
            return float(match.group(1))
    
    return 0.0

def format_nutrient_value(value, unit):
    """Format numeric value back to string with unit"""
    if value == 0:
        return f"0{unit}"
    elif value.is_integer():
        return f"{int(value)}{unit}"
    else:
        return f"{value:.1f}{unit}"

def calculate_weight_based_nutrition(base_nutrition, requested_weight_grams):
    """Calculate nutrition values based on weight in grams"""
    calculated = base_nutrition.copy()
    
    # Get base serving weight
    base_weight_str = base_nutrition.get("serving_size", {}).get("weight", "100g")
    base_weight = extract_numeric_value(base_weight_str)
    
    # Calculate the multiplier based on weight ratio
    weight_multiplier = requested_weight_grams / base_weight if base_weight > 0 else 1
    
    # Calculate calories
    base_calories = extract_numeric_value(base_nutrition.get("calories", "0"))
    calculated["calories"] = format_nutrient_value(base_calories * weight_multiplier, "kcal")
    
    # Calculate macronutrients
    macros = base_nutrition.get("macronutrients", {})
    calculated_macros = {}
    
    for macro, value in macros.items():
        base_value = extract_numeric_value(value)
        calculated_macros[macro] = format_nutrient_value(base_value * weight_multiplier, "g")
    
    calculated["macronutrients"] = calculated_macros
    
    # Calculate vitamins and minerals
    vitamins_minerals = base_nutrition.get("vitamins_minerals", {})
    calculated_vitamins = {}
    
    for nutrient, value in vitamins_minerals.items():
        base_value = extract_numeric_value(value)
        # Extract unit from original value
        unit = "mg"  # default unit
        if isinstance(value, str):
            if "mcg" in value or "μg" in value:
                unit = "mcg"
            elif "mg" in value:
                unit = "mg"
            elif "g" in value:
                unit = "g"
            elif "IU" in value:
                unit = "IU"
        
        calculated_vitamins[nutrient] = format_nutrient_value(base_value * weight_multiplier, unit)
    
    calculated["vitamins_minerals"] = calculated_vitamins
    
    return calculated, weight_multiplier

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
    weight_grams = data.get('weight')  # Weight in grams
    
    if not food_item:
        return jsonify({"error": "Please provide a food item."}), 400

    # Validate weight if provided
    if weight_grams is not None:
        try:
            weight_grams = float(weight_grams)
            if weight_grams <= 0:
                return jsonify({"error": "Weight must be a positive number."}), 400
        except (ValueError, TypeError):
            return jsonify({"error": "Weight must be a valid number in grams."}), 400

    food_key = food_item.lower()

    # Check cache first
    if food_key in nutrition_cache:
        base_nutrition = nutrition_cache[food_key]
        
        # If weight is specified, calculate nutrition for that weight
        if weight_grams is not None:
            calculated_nutrition, weight_multiplier = calculate_weight_based_nutrition(base_nutrition, weight_grams)
            
            # Update serving size info
            calculated_nutrition["serving_size"] = {
                "weight": format_nutrient_value(weight_grams, "g"),
                "quantity": base_nutrition["serving_size"].get("quantity", 1) * weight_multiplier
            }
            
            calculated_nutrition["weight_info"] = {
                "requested_weight": f"{weight_grams}g",
                "base_serving_weight": base_nutrition["serving_size"].get("weight", "100g"),
                "multiplier": round(weight_multiplier, 2)
            }
            
            return jsonify(calculated_nutrition)
        else:
            return jsonify(base_nutrition)

    # If not in cache, get from Gemini AI
    result = analyzer.get_nutrition_info(food_item)

    # If valid result, cache it
    if "error" not in result:
        food_exists = any(
            existing_data.get("food_item", "").lower() == result.get("food_item", "").lower()
            for existing_data in nutrition_cache.values()
        )
        if not food_exists:
            append_nutrition_cache(result)
            nutrition_cache[result.get("food_item","").lower()] = result
        
        # If weight is specified, calculate nutrition for that weight
        if weight_grams is not None:
            calculated_result, weight_multiplier = calculate_weight_based_nutrition(result, weight_grams)
            
            # Update serving size info
            calculated_result["serving_size"] = {
                "weight": format_nutrient_value(weight_grams, "g"),
                "quantity": result["serving_size"].get("quantity", 1) * weight_multiplier
            }
            
            calculated_result["weight_info"] = {
                "requested_weight": f"{weight_grams}g",
                "base_serving_weight": result["serving_size"].get("weight", "100g"),
                "multiplier": round(weight_multiplier, 2)
            }
            
            return jsonify(calculated_result)

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
        if users['users'][user]['email'] == email:
            if bcrypt.checkpw(password.encode('utf-8'), users['users'][user]['password'].encode('utf-8')):
                return jsonify({
                    "message": "Login successful!",
                    "profile": {
                        "name": users['users'][user]["name"],
                        "email": users['users'][user]["email"],
                        "kcal_goal": users['users'][user]["kcal_goal"]
                    },
                    "user_id": user
                }), 200

    return jsonify({"error": "Invalid email or password"}), 401

@app.route('/test', methods=['GET'])
def test():
    return jsonify({"message": "Nutrition API is running successfully!"})

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5000)