import google.generativeai as genai # type: ignore
import json
from flask import Flask, request, jsonify

# 🔑 Your API Key
key = "AIzaSyCCIXPTw5o3qz6cysKrVZS8WdASNZg398M"  # Consider using environment variables for security

app = Flask(__name__)

class NutritionAnalyzer:
    def __init__(self, apiKey):
        """Initialize the Gemini model with API key"""
        genai.configure(api_key=apiKey)
        self.model = genai.GenerativeModel('gemini-1.5-flash')

    def get_nutrition_info(self, food_item):
        """Get nutrition information for a specific food item in JSON format"""
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
            # print("Raw model response:", response.text) #Debugging

            raw_text = response.text.strip()
            start = raw_text.find('{')
            end = raw_text.rfind('}') + 1

            if start != -1 and end != -1:
                json_str = raw_text[start:end]
                try:
                    json_data = json.loads(json_str)
                    return json_data
                except json.JSONDecodeError:
                    print("JSON decode error for extracted JSON:", json_str)
                    return {"error": "Invalid JSON extracted from the model response."}
            else:
                print("No JSON object found in model response.")
                return {"error": "No JSON object found in the model response."}

        except Exception as e:
            return {"error": f"Error getting nutrition information: {str(e)}"}


# Initialize the nutrition analyzer
analyzer = NutritionAnalyzer(key)

@app.route('/nutrition', methods=['POST'])
def nutrition():
    data = request.json
    food_item = data.get('food_item')

    if not food_item:
        return jsonify({"error": "Please provide a food item."}), 400

    result = analyzer.get_nutrition_info(food_item)
    # print(result) #Debugging
    return jsonify(result)

@app.route('/test', methods=['GET'])
def test():
    return jsonify({"message": "Nutrition API is running successfully!"})

if __name__ == "__main__":
    app.run(debug=True)

