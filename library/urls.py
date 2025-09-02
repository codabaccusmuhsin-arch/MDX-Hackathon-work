from django.urls import path
from django.contrib.auth import views as auth_views
from . import views

urlpatterns = [
    path('', views.spell_list, name='spell_list'),
    path('add/', views.add_spell, name='add_spell'),
    path('<int:spell_id>/', views.spell_detail, name='spell_detail'),

    # Authentication
    path('signup/', views.signup, name='signup'),
    path('login/', auth_views.LoginView.as_view(template_name='accounts/login.html'), name='login'),
    path('logout/', views.custom_logout, name='logout'),
    path("ai-assistant/", views.ai_assistant, name="ai_assistant"), 
    path("chatbot/search_spell/", views.chatbot_search_spell, name="chatbot_search_spell"),
    path("chatbot/", views.ai_assistant, name="chatbot"),
    path("upload_spellbook/", views.upload_spellbook, name="upload_spellbook"),  
    path('base/', views.base_page, name='base'),



]
