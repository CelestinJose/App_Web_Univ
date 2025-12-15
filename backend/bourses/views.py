from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets
from .models import Bourse
from .serializers import BourseSerializer

class BourseViewSet(viewsets.ModelViewSet):
    queryset = Bourse.objects.all()
    serializer_class = BourseSerializer
