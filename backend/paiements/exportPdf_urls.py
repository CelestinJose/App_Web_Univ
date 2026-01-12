from django.urls import path
from .views import export_pdf_view

urlpatterns = [
    path('exportPdf/', export_pdf_view, name='export_pdf'),
]
