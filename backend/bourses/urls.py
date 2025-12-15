from rest_framework.routers import DefaultRouter
from .views import BourseViewSet

router = DefaultRouter()
router.register(r'', BourseViewSet, basename='bourses')

urlpatterns = router.urls
