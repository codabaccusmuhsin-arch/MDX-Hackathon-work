from django.shortcuts import render

# Create your views here.
from django.http import HttpResponse
from .utils import query_ai, load_dataset, check_alerts
import pandas as pd
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATASET_PATH = os.path.join(BASE_DIR, 'stats/datasets/my_data.xlsx')



def stark_dashboard(request):
    # Load the dataset
    df = load_dataset()

    # ------------------------------
    # Temporary test to trigger an alert
    df.loc[0, 'Budget Allocation'] = 20000000
    # ------------------------------

    # Check for alerts
    alerts = check_alerts(df)

    # Pass alerts to template
    context = {
        'alerts': alerts,
    }
    return render(request, 'stats/stark.html', context)


from django.http import HttpResponse

def ai_query_view(request):
    query = request.GET.get("q", "")
    if query:
        answer = query_ai(query)  # returns a string
        return HttpResponse(answer)
    return HttpResponse("No query provided")




def stark_view(request):
    return render(request, 'stark.html')