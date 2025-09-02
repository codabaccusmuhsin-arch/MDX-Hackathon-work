from django import forms
from .models import Spell

class SpellForm(forms.ModelForm):
    class Meta:
        model = Spell
        fields = [
            'name', 'origin', 'power_class', 'author', 'type', 'description', 'restricted',
            'time_based', 'language', 'usage_context'
        ]

class SpellbookUploadForm(forms.Form):
    file = forms.FileField(
        label="Upload Spellbook (PDF or DOCX)",
        help_text="Max size 10MB",
    )
