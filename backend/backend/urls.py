
# ""URL configuration for backend project.

from django.contrib import admin
from django.urls import path, include
from django.conf.urls.static import static
from django.conf import settings


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('users.urls')),
    path('api/etudiants/', include('etudiants.urls')),
    path('api/paiements/', include('paiements.urls')),
    path('api/Echeance/', include('paiements.echeance_url')),
    path('api/paiement-individuel/', include('paiements.urls')), 
    path('api/paiement-collectif/', include('paiements.paiement_collectif_urls')), 
    path('api/bourses/', include('bourses.urls')),
    path('api/facultes/', include('facultes.urls')),
    path('api/domaines/', include('facultes.domaine_urls')),
    path('api/mentions/', include('facultes.mention_urls')),  
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
