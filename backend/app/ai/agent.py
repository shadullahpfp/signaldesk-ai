import openai
from app.core.config import settings

class SignalDeskAI:
    def __init__(self):
        openai.api_key = settings.OPENAI_API_KEY

    async def classify_urgency(self, subject: str, description: str) -> str:
        prompt = f"Classify the urgency of this support ticket as LOW, MEDIUM, HIGH, or CRITICAL.\n\nSubject: {subject}\nDescription: {description}\n\nUrgency:"
        
        try:
            response = await openai.ChatCompletion.acreate(
                model="gpt-4-turbo-preview",
                messages=[{"role": "system", "content": "You are an expert customer support triage assistant."},
                          {"role": "user", "content": prompt}],
                max_tokens=10,
                temperature=0.0,
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            return "LOW" # Safe fallback

    async def generate_reply(self, subject: str, description: str) -> str:
        prompt = f"Draft a professional, empathetic customer support reply for the following ticket.\n\nSubject: {subject}\nDescription: {description}\n\nReply:"
        
        try:
            response = await openai.ChatCompletion.acreate(
                model="gpt-4-turbo-preview",
                messages=[{"role": "system", "content": "You are a senior support engineer writing replies to customers. Be concise and professional."},
                          {"role": "user", "content": prompt}],
                temperature=0.7,
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            return "We have received your ticket and are looking into it."
