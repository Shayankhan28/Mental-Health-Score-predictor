import joblib
from fastapi import FastAPI
from pydantic import BaseModel, Field
import pandas as pd
from fastapi.middleware.cors import CORSMiddleware
from typing import Literal

model = joblib.load("Mental_Health_Model.pkl")
top_countries = ['Other','India','USA','Canada','Australia','UK','Germany','Mexico','Turkey','France']

app = FastAPI()


app.add_middleware(
    # Cross-Origin Resource Sharing (CORS)
    # Allows your HTML/CSS/JavaScript frontend to access the FastAPI backend
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# Pydantic Model
class StudentData(BaseModel):
    age: int = Field(..., ge=10,le=100 )
    gender: Literal["Male","Female"]
    country: str
    academic_Level: Literal['Undergraduate', 'Graduate', 'High School']
    most_Used_Platform: Literal [ 'Facebook',  'LinkedIn', 'Instagram',  'Snapchat',   'Twitter',   'YouTube',  'TikTok',      'LINE', 'KakaoTalk', 'VKontakte',  'WhatsApp',    'WeChat']
    purpose_Of_Use: Literal['Networking', 'Education', 'Entertainment', 'News']
    avg_Daily_Usage_Hours: float = Field(..., ge=0, le=24)
    daily_Unlocks: int=Field(..., ge=0, )
    study_Hours: float =Field(..., ge=0, le=24 )
    physical_Activity_Hours: float =Field(..., ge=0, le=24 )
    sleep_Hours_Per_Night: float =Field(..., ge=0, le=24 )
    stress_Level: Literal['Medium', 'Low', 'Very High', 'High']


@app.get("/")
def greet():
    return {"message": "Welcome to Sheriyans AI School Guys"}


# Describe what we send back to model response body
class PredictionResponse (BaseModel):
    perdicted_mental_health :float




@app.post("/predict", response_model=PredictionResponse)
def predict(data: StudentData):

    if data.country in top_countries:
        country_group = data.country
    else:
        country_group = "Others"   

         
    input_row = pd.DataFrame([{
        "Age": data.age,
        "Gender": data.gender,
        "Country": data.country,
        "Academic_Level": data.academic_Level,
        "Most_Used_Platform": data.most_Used_Platform,
        "Purpose_Of_Use": data.purpose_Of_Use,
        "Avg_Daily_Usage_Hours": data.avg_Daily_Usage_Hours,
        "Daily_Unlocks": data.daily_Unlocks,
        "Study_Hours": data.study_Hours,
        "Physical_Activity_Hours": data.physical_Activity_Hours,
        "Sleep_Hours_Per_Night": data.sleep_Hours_Per_Night,
        "Stress_Level": data.stress_Level,
        "grouped_country": country_group
    }])

    prediction = model.predict(input_row)[0]
    return PredictionResponse(perdicted_mental_health=round(float(prediction),2))

   