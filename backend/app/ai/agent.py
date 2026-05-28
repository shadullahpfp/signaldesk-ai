from openai import AsyncOpenAI
from app.core.config import settings

class SignalDeskAI:
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    async def classify_urgency(self, subject: str, description: str) -> str:
        prompt = f"Classify the urgency of this support ticket as LOW, MEDIUM, HIGH, or CRITICAL. Respond with exactly one of these words and nothing else.\n\nSubject: {subject}\nDescription: {description}\n\nUrgency:"
        
        try:
            response = await self.client.chat.completions.create(
                model="gpt-3.5-turbo",  # Using a fast and cost-effective model for classification
                messages=[
                    {"role": "system", "content": "You are an expert customer support triage assistant."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=10,
                temperature=0.0,
            )
            val = response.choices[0].message.content.strip().upper()
            if val in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]:
                return val
            return "LOW"
        except Exception as e:
            print(f"Error in classify_urgency: {e}")
            return "LOW" # Safe fallback

    async def generate_reply(self, subject: str, description: str) -> str:
        prompt = f"Draft a professional, empathetic customer support reply for the following ticket.\n\nSubject: {subject}\nDescription: {description}\n\nReply:"
        
        try:
            response = await self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a senior support engineer writing replies to customers. Be concise and professional."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"Error in generate_reply: {e}")
            return "We have received your ticket and are looking into it."

    async def summarize_ticket(self, subject: str, description: str) -> str:
        prompt = f"Provide a brief one-sentence or two-sentence summary of the following customer support ticket. Focus on the core problem.\n\nSubject: {subject}\nDescription: {description}\n\nSummary:"
        
        try:
            response = await self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a customer support intelligence system."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=150,
                temperature=0.3,
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"Error in summarize_ticket: {e}")
            return "Unable to summarize ticket description."
