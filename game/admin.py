from django.contrib import admin
from .models import User, Score

admin.site.register(User)
admin.site.register(Score)

from django.contrib import admin
from .models import MapLocation, CalendarEvent

@admin.register(MapLocation)
class MapLocationAdmin(admin.ModelAdmin):
    list_display = ('map_id', 'x', 'y', 'category', 'created_at')
    list_filter = ('map_id', 'category', 'created_at')
    search_fields = ('details',)

@admin.register(CalendarEvent)
class CalendarEventAdmin(admin.ModelAdmin):
    list_display = ('date', 'urgency', 'created_at')
    list_filter = ('urgency', 'date', 'created_at')
    search_fields = ('details',)