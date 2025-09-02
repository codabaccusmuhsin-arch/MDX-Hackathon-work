from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),          # default -> home.html
    path('index/', views.index, name='index'),  # /index/ -> index.html
    path('signup/', views.signup_page, name='signup_page'),    # GET page
    path('signup_api/', views.signup_api, name='signup_api'),  # POST JSON
    path('login/', views.login_page, name='login_page'),       # GET page
    path('login_api/', views.login_api, name='login_api'),
    path('user_info/', views.user_info, name='user_info'),
    path('update_score/', views.update_score, name='update_score'),
    path('get_leaderboard/', views.get_leaderboard, name='get_leaderboard'),
    path('leaderboard/', views.leaderboard, name='leaderboard'),
    path('index1/', views.index1, name='index1'),
    path('profile/', views.profile, name='profile'),
    path('log-location/', views.log_location, name='log_location'),
    path('add-event/', views.add_event, name='add_event'),
    path('get-events/', views.get_events, name='get_events'),
    path('get_calendar_note/<str:date_str>/', views.get_calendar_note, name='get_calendar_note'),
    path('save_calendar_note/', views.save_calendar_note, name='save_calendar_note'),
    path('logbook/', views.logbook, name='logbook'),
    path("today_note/", views.today_note, name="today_note"),
    path("map_danger_data/", views.map_danger_data, name="map_danger_data"),
    path('log-location/', views.log_location, name='log_location'),
    path('get-locations/<str:map_id>/', views.get_locations, name='get_locations'),

]
