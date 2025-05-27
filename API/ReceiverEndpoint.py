import google.generativeai as genai  # type: ignore
import json
from flask import Flask, request, jsonify
import firebase_admin
from firebase_admin import credentials, db
import uuid

# 🔑 Google Generative API Key
key = "AIzaSyCCIXPTw5o3qz6cysKrVZS8WdASNZg398M"

# 🔑 Firebase Initialization
cred = credentials.Certificate("firebase_key.json")  # Replace with your actual path
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://<your-project-id>.firebaseio.com'  # Replace with your project ID
})

app = Flask(__name__)

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


# Initialize Gemini Nutrition Analyzer
analyzer = NutritionAnalyzer(key)

@app.route('/nutrition', methods=['POST'])
def nutrition():
    data = request.json
    food_item = data.get('food_item')

    if not food_item:
        return jsonify({"error": "Please provide a food item."}), 400

    result = analyzer.get_nutrition_info(food_item)
    return jsonify(result)

@app.route('/register', methods=['POST'])
def register_user():
    """Register user and store in Firebase"""
    data = request.json
    required_fields = ['name', 'password', 'paid', 'kcal_goal']

    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing fields in request"}), 400

    user_id = str(uuid.uuid4())
    user_data = {
        "name": data['name'],
        "password": data['password'],
        "paid": data['paid'],
        "kcal_goal": data['kcal_goal']
    }

    try:
        ref = db.reference(f'/users/{user_id}')
        ref.set(user_data)
        return jsonify({"message": "User registered successfully!", "user_id": user_id}), 201
    except Exception as e:
        return jsonify({"error": f"Failed to register user: {str(e)}"}), 500
    
@app.route('/login', methods=['POST'])
def login_user():
    """Authenticate user with name and password"""
    data = request.json
    name = data.get('name')
    password = data.get('password')

    if not name or not password:
        return jsonify({"error": "Name and password required"}), 400

    try:
        users_ref = db.reference('/users')
        users = users_ref.get()

        for user_id, user_data in users.items():
            if user_data.get("name") == name and user_data.get("password") == password:
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

    except Exception as e:
        return jsonify({"error": f"Login failed: {str(e)}"}), 500


@app.route('/test', methods=['GET'])
def test():
    return jsonify({"message": "Nutrition API is running successfully!"})

if __name__ == "__main__":
    app.run(debug=True)
