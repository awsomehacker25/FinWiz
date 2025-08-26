from fastapi import FastAPI, Body
from pydantic import BaseModel
from typing import List, Optional
from dotenv import load_dotenv
import os
from openai import AzureOpenAI
import pandas as pd
import numpy as np
from scipy import stats
from datetime import date

# --- ENTER YOUR AZURE OPENAI DETAILS HERE ---
load_dotenv()
AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT")
AZURE_OPENAI_API_KEY = os.getenv("AZURE_OPENAI_API_KEY")
AZURE_OPENAI_DEPLOYMENT = os.getenv("AZURE_OPENAI_DEPLOYMENT")

client = AzureOpenAI(
    api_key=AZURE_OPENAI_API_KEY,
    api_version="2025-01-01-preview",
    azure_endpoint=AZURE_OPENAI_ENDPOINT
)

app = FastAPI(title="Financial Advisor API")

# --- Models ---
class Transaction(BaseModel):
    id: str
    userId: str
    amount: float
    category: str
    description: Optional[str]
    date: str

class IncomeItem(BaseModel):
    id: str
    userId: str
    amount: float
    source: str
    date: str

class SavingGoal(BaseModel):
    id: str
    userId: str
    goalName: str
    target: float
    saved: float
    createdAt: str

class UserProfile(BaseModel):
    id: str
    email: str
    firstName: str
    lastName: str
    password: str
    phoneNumber: str
    age: str
    occupation: str
    visaStatus: str
    preferredLanguage: str
    educationLevel: str
    monthlyIncome: str
    financialGoals: List[str]
    experience: str

class LessonCompletion(BaseModel):
    id: str
    userId: str
    lessons: dict

class UserBehavior(BaseModel):
    userId: str
    recent_transactions: List[Transaction]
    recent_income: List[IncomeItem]
    user_profile: Optional[UserProfile] = None
    lesson_completions: Optional[LessonCompletion] = None
    savings_goals: Optional[List[SavingGoal]] = None  # Added here

class AdviceResponse(BaseModel):
    advice: str

class IncomeAnalysisResponse(BaseModel):
    anomalies: List[IncomeItem]
    stability_index: float
    suggestions: List[str]

class SavingsMonitorResponse(BaseModel):
    progress_pct: float
    status: str
    messages: List[str]

class SpendingReviewResponse(BaseModel):
    spending_to_income_ratio: float
    warnings: List[str]
    suggestions: List[str]

class LiteracyRecommendation(BaseModel):
    level: str
    lessons: List[str]

# --- Helper to call Azure OpenAI ---
def call_llm(prompt: str, max_tokens=150) -> str:
    """Call Azure OpenAI Chat model."""
    response = client.chat.completions.create(
        model=AZURE_OPENAI_DEPLOYMENT,
        messages=[
            {"role": "system", "content": "You are a friendly financial coach."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=max_tokens,
        temperature=0.7,
        n=1
    )
    return response.choices[0].message.content.strip()

# --- Endpoints ---
# @app.post("/tips", response_model=AdviceResponse)
# def personalized_tips(user: UserBehavior):
#     total_spent = sum(t.amount for t in user.recent_transactions if t.amount < 0)
#     total_income = sum(i.amount for i in user.recent_income)
#     user_name = user.user_profile.firstName if user.user_profile else "there"

#     goals_summary = ""
#     if user.savings_goals:
#         goals_summary = " They are saving for " + ", ".join(g.goalName for g in user.savings_goals) + "."

#     prompt = (
#         f"A user named {user_name} had ${total_income:.2f} income and spent ${-total_spent:.2f} "
#         f"in the last period.{goals_summary} Suggest 2-3 bite-size tips (one sentence each) "
#         f"on how to manage their money given this behavior."
#     )
#     advice = call_llm(prompt)
#     return AdviceResponse(advice=advice)

# @app.post("/income-analysis", response_model=IncomeAnalysisResponse)
# def income_analysis(user: UserBehavior):
#     df = pd.DataFrame([{"date": e.date, "amount": e.amount} for e in user.recent_income])
#     df["z"] = np.abs(stats.zscore(df["amount"]))
#     anomalies = df[df["z"] > 2]
#     stability = float(np.std(df["amount"]) / (np.mean(df["amount"]) + 1e-6))
#     suggestions = [
#         f"Income entry from {row['date']}: unexpected income of ${row['amount']:.2f}. "
#         "Consider saving 20-30% of it."
#         for _, row in anomalies.iterrows()
#     ]
#     return IncomeAnalysisResponse(
#         anomalies=[
#             IncomeItem(
#                 id=f"anomaly_{i}",
#                 userId=user.userId,
#                 amount=r.amount,
#                 source="Unknown",
#                 date=r.date
#             )
#             for i, (_, r) in enumerate(anomalies.iterrows())
#         ],
#         stability_index=stability,
#         suggestions=suggestions
#     )

# @app.post("/savings-monitor", response_model=SavingsMonitorResponse)
# def savings_monitor(goal: SavingGoal):
#     pct = goal.saved / goal.target
#     msgs = []
#     if pct < 0.3:
#         status = "below_30"
#         msgs.append("You're below 30% of your goal - try automating small weekly transfers.")
#     elif pct >= 1:
#         status = "achieved"
#         msgs.append("Congratulations! You've reached your savings target!")
#     else:
#         status = "on_track"
#         msgs.append("Great job - you're on track! Keep up the momentum.")
#     return SavingsMonitorResponse(
#         progress_pct=round(pct * 100, 1),
#         status=status,
#         messages=msgs
#     )

# @app.post("/spending-review", response_model=SpendingReviewResponse)
# def spending_review(user: UserBehavior):
#     spend = -sum(t.amount for t in user.recent_transactions if t.amount < 0)
#     inc = sum(i.amount for i in user.recent_income)
#     ratio = spend / (inc + 1e-6)
#     warnings, sugg = [], []
#     if ratio > 1.0:
#         warnings.append("You've spent more than you earned last period.")
#         sugg.append("Review variable expenses and cut non-essentials by 10%.")
#     elif ratio > 0.8:
#         warnings.append("Spending is approaching your income limit.")
#         sugg.append("Try setting a stricter category budget for discretionary spend.")
#     else:
#         sugg.append("Your spending is in a healthy range - nice work.")
#     return SpendingReviewResponse(
#         spending_to_income_ratio=round(ratio, 2),
#         warnings=warnings,
#         suggestions=sugg
#     )

# @app.post("/literacy-recommender", response_model=LiteracyRecommendation)
# def literacy_recommender(user: UserBehavior):
#     completion_score = 0
#     if user.lesson_completions:
#         completed_lessons = sum(
#             1 for lesson in user.lesson_completions.lessons.values()
#             if lesson.get("completed", False)
#         )
#         total_lessons = len(user.lesson_completions.lessons)
#         completion_score = (completed_lessons / max(total_lessons, 1)) * 100
#     if user.user_profile:
#         level = user.user_profile.experience
#     else:
#         level = "beginner" if completion_score < 50 else "intermediate"
#     if level == "beginner":
#         lessons = [
#             "Budgeting 101: Understanding Income vs. Expenses",
#             "Saving Basics: The Power of Starting Early"
#         ]
#     else:
#         lessons = [
#             "Investing 101: Risk, Return, and Diversification",
#             "Advanced Budgeting: Automating Your Savings"
#         ]
#     return LiteracyRecommendation(level=level, lessons=lessons)

@app.post("/financial-coach", response_model=AdviceResponse)
def financial_coach(user: UserBehavior, question: str = Body(..., embed=True)):
    """AI-powered financial coach that answers user questions with context from their data."""

    # Income totals and average
    total_income = sum(i.amount for i in user.recent_income)
    avg_income = np.mean([i.amount for i in user.recent_income]) if user.recent_income else 0

    # Income details
    if user.recent_income:
        income_details = "; ".join(f"${i.amount:.2f} from {i.source}" for i in user.recent_income)
        income_context = f"Income details: {income_details}."
    else:
        income_context = "No recent income recorded."

    # Spending totals
    total_spent = -sum(t.amount for t in user.recent_transactions if t.amount < 0)
    if user.recent_transactions:
        spending_details = "; ".join(
            f"${-t.amount:.2f} on {t.category} ({t.description})" for t in user.recent_transactions if t.amount < 0
        )
        spending_context = f"Recently, they spent a total of ${total_spent:.2f}, including: {spending_details}."
    else:
        spending_context = f"Recently, they spent a total of ${total_spent:.2f}."

    # User name
    user_name = user.user_profile.firstName if user.user_profile else "User"

    # Lessons completed with details
    if user.lesson_completions:
        lessons_done_list = [
            l_name for l_name, l_info in user.lesson_completions.lessons.items() if l_info.get("completed", False)
        ]
        lessons_total = len(user.lesson_completions.lessons)
        literacy_progress = (
            f"They completed {len(lessons_done_list)}/{lessons_total} literacy lessons"
            + (": " + ", ".join(lessons_done_list) if lessons_done_list else ".")
        )
    else:
        literacy_progress = "No literacy lessons completed."

    # Savings goals
    if user.savings_goals:
        goals_summary = ", ".join(
            f"{g.goalName} (${g.saved:.2f}/${g.target:.2f})" for g in user.savings_goals
        )
        goals_context = f"Their current savings goals are: {goals_summary}."
    else:
        goals_context = "No savings goals set currently."

    # Combine full context
    context = (
        f"{user_name} has an average income of ${avg_income:.2f}, "
        f"recent total income of ${total_income:.2f}. {income_context} "
        f"{spending_context} {literacy_progress}. {goals_context} "
        "They may also have financial aspirations."
    )

    # Prompt
    prompt = (
        f"Context: {context}\n\n"
        f"User's question: {question}\n\n"
        "Provide a personalized, simple, and practical financial advice in 3-4 sentences."
    )

    advice = call_llm(prompt, max_tokens=200)
    return AdviceResponse(advice=advice)