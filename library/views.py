# library/views.py
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import Group
from django.contrib import messages
from .models import Spell
from .forms import SpellForm, SpellbookUploadForm
from django.contrib.auth import logout
from django.http import HttpResponse, JsonResponse
from .ai_utils import embed_text, cosine_similarity, embed_query, search_spells
import docx
import PyPDF2
import re

# Spell list + filtering
def spell_list(request):
    spells = Spell.objects.all()
    spell_type = request.GET.get('type')
    origin = request.GET.get('origin')
    power_class = request.GET.get('power_class')
    author = request.GET.get('author')
    language = request.GET.get('language')
    usage_context = request.GET.get('usage_context')
    time_based = request.GET.get('time_based')

    if spell_type: spells = spells.filter(type=spell_type)
    if origin: spells = spells.filter(origin__icontains=origin)
    if power_class: spells = spells.filter(power_class__icontains=power_class)
    if author: spells = spells.filter(author__icontains=author)
    if language: spells = spells.filter(language__icontains=language)
    if usage_context: spells = spells.filter(usage_context=usage_context)
    if time_based == "on": spells = spells.filter(time_based=True)

    is_trusted = False
    if request.user.is_authenticated:
        is_trusted = request.user.groups.filter(name="trusted_users").exists()

    return render(request, "library/spell_list.html", {"spells": spells, "is_trusted": is_trusted})

# Spell detail
def spell_detail(request, spell_id):
    spell = get_object_or_404(Spell, id=spell_id)
    return render(request, "library/spell_detail.html", {"spell": spell})

# Add spell
def add_spell(request):
    if request.method == "POST":
        form = SpellForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect("spell_list")
    else:
        form = SpellForm()
    return render(request, "library/add_spell.html", {"form": form})

# Signup
def signup(request):
    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            normal_group, _ = Group.objects.get_or_create(name='normal_users')
            user.groups.add(normal_group)
            messages.success(request, "Account created successfully! You can now log in.")
            return redirect('login')
    else:
        form = UserCreationForm()
    return render(request, 'accounts/signup.html', {'form': form})

# Logout
def custom_logout(request):
    try:
        logout(request)
        return redirect('/')
    except Exception as e:
        return HttpResponse(f"Logout failed: {e}")

# Chatbot page
def ai_assistant(request):
    return render(request, "library/chatbot.html")

# Chatbot-integrated spell search
def chatbot_search_spell(request):
    user_input = request.GET.get("message", "").strip()
    if not user_input:
        return JsonResponse({"reply": "Please say something!"})

    # Handle greetings
    greetings = ["hello", "hi", "hey", "how are you"]
    if any(word in user_input.lower() for word in greetings):
        return JsonResponse({"reply": "Hi! Ask me about a spell, and I'll find it for you."})

    # ---- Here is where you use embed_query ----
    try:
        # Generate embedding for the user input
        from .ai_utils import embed_query, cosine_similarity
        query_embedding = embed_query(user_input)

        spells = Spell.objects.exclude(embedding=None)
        results = []
        for spell in spells:
            similarity = cosine_similarity(query_embedding, spell.embedding)
            results.append({"spell": spell, "similarity": similarity})

        # Sort and select top spells
        results.sort(key=lambda x: x["similarity"], reverse=True)
        threshold = 0.5
        top_spells = [r["spell"] for r in results if r["similarity"] >= threshold]

        if top_spells:
            reply_lines = [f"**{spell.name}**: {spell.description}" for spell in top_spells[:3]]
            reply_text = "\n".join(reply_lines)
        else:
            reply_text = "Sorry, I couldn't find any matching spells."

        return JsonResponse({"reply": reply_text})

    except Exception as e:
        return JsonResponse({"reply": f"Oops! Something went wrong: {str(e)}"})



import re
from django.shortcuts import render, redirect
from django.contrib import messages
from .forms import SpellbookUploadForm
from .models import Spell
from .ai_utils import embed_query
import PyPDF2
import docx

def upload_spellbook(request):
    if request.method == "POST":
        form = SpellbookUploadForm(request.POST, request.FILES)
        if form.is_valid():
            uploaded_file = request.FILES['file']
            text = ""

            # Extract text from PDF
            if uploaded_file.name.endswith(".pdf"):
                reader = PyPDF2.PdfReader(uploaded_file)
                for page in reader.pages:
                    text += page.extract_text() + "\n"

            # Extract text from DOCX
            elif uploaded_file.name.endswith(".docx"):
                doc = docx.Document(uploaded_file)
                for para in doc.paragraphs:
                    text += para.text + "\n"
            else:
                messages.error(request, "Unsupported file type. Only PDF or DOCX allowed.")
                return redirect("upload_spellbook")

            # Split text into individual spell entries
            spell_entries = re.split(r'\n{2,}', text)  # separate by empty lines
            created_count = 0

            for entry in spell_entries:
                lines = entry.strip().split("\n")
                if len(lines) < 2:
                    continue  # skip incomplete entries

                name = lines[0].strip()
                description = " ".join(lines[1:]).strip()

                # Avoid duplicates
                if Spell.objects.filter(name=name).exists():
                    continue

                # Create spell object
                spell = Spell(name=name, description=description)

                # Generate embedding
                try:
                    embedding = embed_query(description)
                    spell.embedding = [float(x) for x in embedding]
                except Exception as e:
                    print(f"Embedding failed for '{name}': {e}")

                spell.save()
                created_count += 1

            messages.success(
                request, f"Spellbook uploaded successfully! {created_count} new spells added."
            )
            return redirect("spell_list")
    else:
        form = SpellbookUploadForm()

    return render(request, "library/upload_spellbook.html", {"form": form})

# library/views.py
from django.shortcuts import render

from django.shortcuts import render

def base_page(request):
    return render(request, 'base.html')


from django.shortcuts import render
from .models import Spell

def spell_list(request):
    spells = Spell.objects.all()  # fetch all spells
    is_trusted = request.user.is_staff if request.user.is_authenticated else False
    return render(request, 'library/spell_list.html', {
        'spells': spells,
        'is_trusted': is_trusted
    })


