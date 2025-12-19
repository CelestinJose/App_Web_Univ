
# ""URL configuration for backend project.

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('users.urls')),
    path('api/etudiants/', include('etudiants.urls')),
    path('api/paiements/', include('paiements.urls')),
    path('api/bourses/', include('bourses.urls')),
    path('api/facultes/', include('facultes.urls')),
    path('api/domaines/', include('facultes.domaine_urls')),
    path('api/mentions/', include('facultes.mention_urls')),  
]
