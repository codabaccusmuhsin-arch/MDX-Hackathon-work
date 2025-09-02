from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Spell
from .utils import generate_embedding_for_spell

@receiver(post_save, sender=Spell)
def create_spell_embedding(sender, instance, created, **kwargs):
    """
    Automatically generate embedding when a new Spell is created
    or when the description changes.
    """
    if created or not instance.embedding:
        try:
            embedding = generate_embedding_for_spell(instance.description)
            instance.embedding = embedding
            instance.save(update_fields=['embedding'])
        except Exception as e:
            print(f"Error generating embedding for spell '{instance.name}': {e}")
