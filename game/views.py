from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.hashers import check_password
from .models import User, Score

# Default home page
def home(request):
    return render(request, 'home.html')

# Keep index accessible via /index/
def index(request):
    return render(request, 'index.html')

# Signup page# Serve signup HTML page
def signup_page(request):
    return render(request, 'signup.html')

# views.py
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from .models import User
from django.contrib.auth.hashers import make_password, check_password
@csrf_exempt
def signup_api(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            name = data.get('name')
            username = data.get('username')
            dob = data.get('dateOfBirth')
            email = data.get('email')
            password = data.get('password')

            # Validate all fields
            if not name or not username or not dob or not email or not password:
                return JsonResponse({'message': 'All fields are required.'}, status=400)

            # Check if username/email already exists
            if User.objects.filter(username=username).exists():
                return JsonResponse({'message': 'Username already exists.'}, status=400)
            if User.objects.filter(email=email).exists():
                return JsonResponse({'message': 'Email already exists.'}, status=400)

            # Create user (model handles hashing automatically)
            User.objects.create(
                name=name,
                username=username,
                date_of_birth=dob,
                email=email,
                password=password  # plain text, will be hashed in model
            )

            return JsonResponse({'message': 'Sign-up successful!'})
        except Exception as e:
            return JsonResponse({'message': str(e)}, status=400)

    return JsonResponse({'message': 'Invalid request'}, status=400)

# Login page
def login_page(request):
    return render(request, 'login.html')

from django.contrib.auth import authenticate, login
from django.contrib.auth.hashers import check_password

@csrf_exempt
def login_api(request):
    if request.method != "POST":
        return JsonResponse({"message": "Invalid request"}, status=400)

    try:
        data = json.loads(request.body)
        username = data.get("username")
        password = data.get("password")

        if not username or not password:
            return JsonResponse({"message": "Both fields are required."}, status=400)

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return JsonResponse({"message": "Invalid username or password."}, status=401)

        if user.password.startswith('pbkdf2_sha256$'):  # hashed password check
            if check_password(password, user.password):
                request.session['username'] = username
                return JsonResponse({"message": "Login successful!"})
            else:
                return JsonResponse({"message": "Invalid username or password."}, status=401)
        else:
            # fallback: password stored in plain text (not recommended)
            if user.password == password:
                request.session['username'] = username
                return JsonResponse({"message": "Login successful!"})
            return JsonResponse({"message": "Invalid username or password."}, status=401)

    except Exception as e:
        return JsonResponse({"message": str(e)}, status=500)

# User info page
def user_info(request):
    username = request.session.get('username')
    if not username:
        return redirect('login_page')
    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return redirect('login_page')
    return render(request, 'user_info.html', {'user': user})

# Update score
def update_score(request):
    if request.method == "POST":
        username = request.session.get("username")
        if not username:
            return JsonResponse({"success": False, "error": "User not logged in"})
        score = int(request.POST.get("score", 0))
        user = User.objects.get(username=username)
        score_obj, created = Score.objects.get_or_create(user=user)
        if score > score_obj.highscore:
            score_obj.highscore = score
            score_obj.save()
        return JsonResponse({"success": True, "highscore": score_obj.highscore})
    return JsonResponse({"success": False, "error": "Invalid request"})

# Leaderboard pages
def get_leaderboard(request):
    scores = Score.objects.select_related('user').order_by('-highscore')[:50]
    data = [{"username": s.user.username, "highscore": s.highscore} for s in scores]
    return JsonResponse({"scores": data})

def leaderboard(request):
    return render(request, "leaderboard.html")

from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
import json
from .models import MapLocation, CalendarEvent

def index1(request):
    return render(request, 'index1.html')

def profile(request):
    return render(request, 'profile.html')

@csrf_exempt
@require_POST
def log_location(request):
    try:
        data = json.loads(request.body)
        location = MapLocation(
            x=data.get('x'),
            y=data.get('y'),
            category=data.get('category', 'unspecified'),
            details=data.get('details', ''),
            map_id=data.get('map_id', '')
        )
        location.save()
        return JsonResponse({'message': 'Location saved successfully'})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

@csrf_exempt
@require_POST
def add_event(request):
    try:
        data = json.loads(request.body)
        event = CalendarEvent(
            date=data.get('date'),
            details=data.get('details'),
            urgency=data.get('urgency', 'medium')
        )
        event.save()
        return JsonResponse({'message': 'Event added successfully'})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

def get_events(request):
    events = CalendarEvent.objects.all()
    events_data = {}
    for event in events:
        date_str = event.date.isoformat()
        if date_str not in events_data:
            events_data[date_str] = []
        events_data[date_str].append({
            'id': event.id,
            'details': event.details,
            'urgency': event.urgency
        })
    return JsonResponse(events_data)


from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import CalendarEvent
from datetime import datetime
import json

def get_calendar_note(request, date_str):
    try:
        date_obj = datetime.strptime(date_str, "%Y-%m-%d").date()
        event = CalendarEvent.objects.filter(date=date_obj).first()
        if event:
            return JsonResponse({'details': event.details})
        return JsonResponse({'details': ''})
    except Exception as e:
        return JsonResponse({'details': '', 'error': str(e)})

@csrf_exempt
def save_calendar_note(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            date_str = data.get('date')
            details = data.get('details', '')
            date_obj = datetime.strptime(date_str, "%Y-%m-%d").date()

            event, created = CalendarEvent.objects.get_or_create(date=date_obj)
            event.details = details
            event.save()
            return JsonResponse({'success': True})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    return JsonResponse({'success': False, 'error': 'Invalid method'})
from django.shortcuts import render

from django.shortcuts import render
from .models import CalendarEvent  # use your existing model

def logbook(request):
    # Fetch all calendar events sorted by date descending
    events = CalendarEvent.objects.all().order_by('-date')
    return render(request, 'logbook.html', {'events': events})
from django.http import JsonResponse
from django.utils import timezone
from .models import CalendarEvent

def today_note(request):
    today = timezone.localdate()  # current date
    try:
        event = CalendarEvent.objects.get(date=today)
        note = event.details if event.details else "The day is quite quiet today."
    except CalendarEvent.DoesNotExist:
        note = "The day is quite quiet today."
    return JsonResponse({"note": note})
from django.http import JsonResponse
from django.utils.timezone import now
from .models import CalendarEvent

from datetime import date
from django.http import JsonResponse
from .models import CalendarEvent

def today_note(request):
    today = date.today()
    event = CalendarEvent.objects.filter(date=today).first()
    
    if event and event.details:  # ✅ use .details not .notes
        return JsonResponse({"note": event.details})
    else:
        return JsonResponse({"note": ""})  # quiet day fallback
from django.shortcuts import render
from .models import MapLocation

def map_danger_data(request):
    dangers = MapLocation.objects.all().order_by('-created_at')  # latest first
    return render(request, 'map_danger_data.html', {'dangers': dangers})
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from .models import MapLocation

# views.py
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import MapLocation

@csrf_exempt
def log_location(request):
    if request.method == "POST":
        data = json.loads(request.body)
        MapLocation.objects.create(
            map_id=data.get('map_id'),
            x=data.get('x'),
            y=data.get('y'),
            category=data.get('category', 'unspecified'),
            details=data.get('details', '')
        )
        return JsonResponse({'message': 'Location saved!'})
    return JsonResponse({'error': 'Invalid request'}, status=400)

def get_locations(request, map_id):
    markers = MapLocation.objects.filter(map_id=map_id)
    locations = [{
        'x': m.x,
        'y': m.y,
        'category': m.category,
        'details': m.details
    } for m in markers]
    return JsonResponse(locations, safe=False)
