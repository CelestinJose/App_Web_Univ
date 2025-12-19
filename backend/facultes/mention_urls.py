# facultes/mention_urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MentionViewSet

router = DefaultRouter()
router.register(r'', MentionViewSet, basename='mention')

urlpatterns = [
    path('', include(router.urls)),
]