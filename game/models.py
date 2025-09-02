from django.db import models
from django.contrib.auth.hashers import make_password

class User(models.Model):
    name = models.CharField(max_length=100)
    username = models.CharField(max_length=50, unique=True)  # ✅ unique username
    date_of_birth = models.DateField()
    email = models.EmailField(unique=True)  # ✅ unique email
    password = models.CharField(max_length=128)  # store hashed passwords

    def save(self, *args, **kwargs):
        # hash password before saving
        if not self.pk:  # only hash on creation
            self.password = make_password(self.password)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.username
        
from django.db import models

class Score(models.Model):
    user = models.OneToOneField('User', on_delete=models.CASCADE)
    highscore = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.user.username} - {self.highscore}"

from django.db import models

class MapLocation(models.Model):
    CATEGORY_CHOICES = [
        ('unspecified', 'Unspecified'),
        ('critical', 'Critical'),
        ('non-critical', 'Non-Critical'),
    ]
    
    x = models.IntegerField()
    y = models.IntegerField()
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='unspecified')
    details = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    map_id = models.CharField(max_length=50)

    def __str__(self):
        return f"Map {self.map_id} - ({self.x}, {self.y}) - {self.category}"

from django.db import models

class CalendarEvent(models.Model):
    URGENCY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ]
    
    date = models.DateField(unique=True)
    details = models.TextField(blank=True)
    urgency = models.CharField(max_length=10, choices=URGENCY_CHOICES, default='medium')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.date} - {self.details}"
