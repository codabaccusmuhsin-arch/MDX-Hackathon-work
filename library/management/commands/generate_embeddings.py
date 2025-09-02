import os
import json
import requests
from django.core.management.base import BaseCommand
from library.models import Spell  # adjust this if your model path is different


class Command(BaseCommand):
    help = "Generate embeddings for spells using Jina API"

    def handle(self, *args, **options):
        JINA_API_KEY = os.getenv("JINA_AUTH_TOKEN") or "YOUR_API_KEY_HERE"

        if not JINA_API_KEY:
            self.stderr.write(self.style.ERROR("❌ No JINA_AUTH_TOKEN found. Please set it."))
            return

        spells = Spell.objects.filter(embedding__isnull=True)  # assuming you have an `embedding` field
        if not spells.exists():
            self.stdout.write(self.style.SUCCESS("✅ All spells already have embeddings."))
            return

        self.stdout.write(f"⚡ Generating embeddings for {spells.count()} spells...")

        url = "https://api.jina.ai/v1/embeddings"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {JINA_API_KEY}"
        }

        for spell in spells:
            payload = {
                "input": spell.name,   # or use spell.description if you prefer
                "model": "jina-embeddings-v2-base-en"
            }
            try:
                response = requests.post(url, headers=headers, json=payload)
                response.raise_for_status()
                data = response.json()
                embedding = data["data"][0]["embedding"]

                # Save embedding to your model (make sure field is JSONField/TextField)
                spell.embedding = [float(x) for x in embedding]
                spell.save()

                self.stdout.write(self.style.SUCCESS(f" Embedded spell: {spell.name}"))

            except Exception as e:
                self.stderr.write(self.style.ERROR(f" Failed for {spell.name}: {e}"))

        self.stdout.write(self.style.SUCCESS(" Embedding generation complete!"))
