# library/models.py
from django.db import models
from django.core.serializers.json import DjangoJSONEncoder

class Spell(models.Model):
    TYPE_CHOICES = [
        ('spellbook', 'Spellbook'),
        ('scroll', 'Scroll'),
        ('manual', 'Manual'),
        ('artifact', 'Artifact'),
    ]

    name = models.CharField(max_length=100)
    origin = models.CharField(max_length=100, blank=True, null=True)
    power_class = models.CharField(max_length=50)
    author = models.CharField(max_length=100, blank=True, null=True)
    type = models.CharField(max_length=50, choices=TYPE_CHOICES, default='spellbook')
    description = models.TextField()
    restricted = models.BooleanField(default=False)
    time_based = models.BooleanField(default=False)
    language = models.CharField(max_length=50, blank=True, null=True)
    usage_context = models.CharField(
        max_length=50, blank=True, null=True,
        choices=[
            ('offensive', 'Offensive'),
            ('defensive', 'Defensive'),
            ('utility', 'Utility'),
            ('healing', 'Healing'),
        ]
    )

    # Store embedding as a JSON list
    embedding = models.JSONField(encoder=DjangoJSONEncoder, blank=True, null=True)

    def __str__(self):
        return self.name
