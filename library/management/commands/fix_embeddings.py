import json
from django.core.management.base import BaseCommand
from library.models import Spell

class Command(BaseCommand):
    help = "Fix embeddings stored as strings instead of lists of floats"

    def handle(self, *args, **kwargs):
        spells = Spell.objects.exclude(embedding=None)
        fixed_count = 0

        for spell in spells:
            if isinstance(spell.embedding, str):
                try:
                    # Parse the string into a list
                    parsed = json.loads(spell.embedding)

                    # Ensure all values are floats
                    spell.embedding = [float(x) for x in parsed]
                    spell.save(update_fields=["embedding"])
                    fixed_count += 1
                except Exception as e:
                    self.stdout.write(self.style.ERROR(
                        f"Failed to fix {spell.name}: {e}"
                    ))

        self.stdout.write(self.style.SUCCESS(
            f"Fixed {fixed_count} embeddings"
        ))
