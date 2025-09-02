from django.urls import path
from . import views

urlpatterns = [
    path('ai-query/', views.ai_query_view, name='ai-query'),
    path("dashboard/", views.stark_dashboard, name="stark-dashboard"),
    path('stark/', views.stark_view, name='stark-page'), 


]
