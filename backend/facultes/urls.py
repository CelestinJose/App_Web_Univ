from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FaculteViewSet, DomaineViewSet, MentionViewSet

router = DefaultRouter()
router.register(r'', FaculteViewSet, basename='faculte')

urlpatterns = [
    path('', include(router.urls)),
]
