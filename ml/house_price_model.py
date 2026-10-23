from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from sklearn.linear_model import LinearRegression
import pandas as pd


# --------------------------------------------------
# TRAINING DATA
# --------------------------------------------------

data = pd.DataFrame([
    # Area, Bedrooms, Bathrooms, Age, Floors, Parking, Furnishing, Location, Price
    [800, 2, 1, 10, 1, 1, "Unfurnished", "Tambaram, Chennai", 38],
    [1000, 2, 2, 5, 2, 1, "Semi-Furnished", "Velachery, Chennai", 55],
    [1200, 3, 2, 5, 2, 1, "Semi-Furnished", "Adyar, Chennai", 75],
    [1500, 3, 2, 3, 2, 1, "Furnished", "Anna Nagar, Chennai", 110],
    [1800, 3, 3, 2, 2, 2, "Furnished", "T. Nagar, Chennai", 135],

    [1000, 2, 2, 5, 2, 1, "Semi-Furnished", "Electronic City, Bangalore", 60],
    [1400, 3, 2, 4, 2, 1, "Furnished", "Whitefield, Bangalore", 105],
    [1600, 3, 3, 3, 2, 2, "Furnished", "Koramangala, Bangalore", 145],
    [1800, 4, 3, 2, 3, 2, "Furnished", "Indiranagar, Bangalore", 170],

    [1000, 2, 2, 7, 2, 1, "Semi-Furnished", "Miyapur, Hyderabad", 55],
    [1400, 3, 2, 5, 2, 1, "Furnished", "Kondapur, Hyderabad", 85],
    [1600, 3, 3, 3, 2, 2, "Furnished", "Gachibowli, Hyderabad", 115],
    [1800, 4, 3, 2, 3, 2, "Furnished", "Banjara Hills, Hyderabad", 150],

    [800, 2, 1, 10, 1, 1, "Unfurnished", "Borivali, Mumbai", 90],
    [1100, 2, 2, 6, 2, 1, "Semi-Furnished", "Andheri, Mumbai", 125],
    [1400, 3, 2, 4, 2, 1, "Furnished", "Powai, Mumbai", 175],
    [1600, 3, 3, 2, 2, 2, "Furnished", "Bandra, Mumbai", 230],

    [1000, 2, 2, 7, 2, 1, "Semi-Furnished", "Rohini, Delhi", 70],
    [1300, 3, 2, 5, 2, 1, "Furnished", "Dwarka, Delhi", 95],
    [1600, 3, 3, 3, 2, 2, "Furnished", "Saket, Delhi", 135],
    [1800, 4, 3, 2, 3, 2, "Furnished", "Vasant Kunj, Delhi", 155]
], columns=[
    "area",
    "bedrooms",
    "bathrooms",
    "property_age",
    "floors",
    "parking",
    "furnishing",
    "location",
    "price"
])


# --------------------------------------------------
# FEATURES
# --------------------------------------------------

numeric_features = [
    "area",
    "bedrooms",
    "bathrooms",
    "property_age",
    "floors",
    "parking"
]

categorical_features = [
    "furnishing",
    "location"
]


# --------------------------------------------------
# PREPROCESSING
# --------------------------------------------------

preprocessor = ColumnTransformer(
    transformers=[
        ("categorical",
         OneHotEncoder(handle_unknown="ignore"),
         categorical_features)
    ],
    remainder="passthrough"
)


# --------------------------------------------------
# MODEL
# --------------------------------------------------

model = Pipeline([
    ("preprocessor", preprocessor),
    ("regressor", LinearRegression())
])


# --------------------------------------------------
# TRAIN
# --------------------------------------------------

X = data.drop("price", axis=1)
y = data["price"]

model.fit(X, y)


# --------------------------------------------------
# PREDICTION FUNCTION
# --------------------------------------------------

def predict_price(
    area,
    bedrooms,
    bathrooms,
    property_age,
    floors,
    parking,
    furnishing,
    location
):

    house = pd.DataFrame([{
        "area": area,
        "bedrooms": bedrooms,
        "bathrooms": bathrooms,
        "property_age": property_age,
        "floors": floors,
        "parking": parking,
        "furnishing": furnishing,
        "location": location
    }])

    prediction = model.predict(house)

    return round(prediction[0], 2)